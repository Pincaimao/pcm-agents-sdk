import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { FileUploadResponse, verifyApiKey, PCM_DOMAIN } from '../../utils/utils';
import { ConversationStartEventData, InterviewCompleteEventData, StreamCompleteEventData } from '../../components';
import { ErrorEventBus, ErrorEventDetail } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';
import { Message } from '../../services/message.service';

/**
 * 千岗千简历
 */

@Component({
  tag: 'pcm-qgqjl-modal',
  styleUrls: ['pcm-qgqjl-modal.css', '../../global/global.css', '../../global/host.css'],
  shadow: true,
})
export class QgqjlModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '千岗千简历';

  /**
   * SDK鉴权密钥
   */
  @Prop({ attribute: 'token' }) token!: string;

  /**
   * 是否显示聊天模态框
   */
  @Prop({ mutable: true }) isOpen: boolean = false;

  /**
   * 当点击模态框关闭时触发
   */
  @Event() modalClosed: EventEmitter<void>;

  /**
   * 应用图标URL
   */
  @Prop() icon?: string;

  /**
   * 聊天框的页面层级
   */
  @Prop() zIndex?: number = 1000;

  /**
   * 是否展示顶部标题栏
   */
  @Prop() isShowHeader: boolean = true;

  /**
   * 是否展示右上角的关闭按钮
   */
  @Prop() isNeedClose: boolean = true;

  /**
   * 会话ID，传入继续对话，否则创建新会话
   */
  @Prop({ mutable: true }) conversationId?: string;

  /**
   * 默认查询文本
   */
  @Prop() defaultQuery: string = '请开始出题';
  /**
   * 获取简历数据事件（用户点击导出简历json数据后触发）
   */
  @Event() getResumeData: EventEmitter<any>;
  /**
   * 是否隐藏导出数据按钮
   */
  @Prop() hideExportButton: boolean = false;
  /**
   * 导出按钮的文本
   */
  @Prop() exportButtonText: string = '导出简历json数据';

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  /**
   * 自定义输入参数，传入customInputs.job_info时，会隐藏JD输入区域<br>
   * 传入customInputs.file_url时，会隐藏简历上传区域。<br>
   * 传入customInputs.file_url和customInputs.job_info时，会直接开始聊天。<br>
   */
  @Prop() customInputs: Record<string, string> = {};

  /**
   * 是否显示工作区历史会话按钮
   */
  @Prop() showWorkspaceHistory: boolean = false;

  /**
   * 是否开启移动端上传简历（仅PC端生效）
   */
  @Prop() mobileUploadAble: boolean = false;

  /**
   * 上传成功事件
   */
  @Event() uploadSuccess: EventEmitter<FileUploadResponse>;

  /**
   * 流式输出完成事件
   */
  @Event() streamComplete: EventEmitter<StreamCompleteEventData>;

  /**
   * 新会话开始的回调，只会在一轮对话开始时触发一次
   */
  @Event() conversationStart: EventEmitter<ConversationStartEventData>;

  /**
   * 当聊天完成时触发
   */
  @Event() interviewComplete: EventEmitter<InterviewCompleteEventData>;

  /**
   * SDK密钥验证失败事件
   */
  @Event() tokenInvalid: EventEmitter<void>;

  /**
   * 错误事件
   */
  @Event() someErrorEvent: EventEmitter<ErrorEventDetail>;

  /**
   * 附件预览模式
   * 'drawer': 在右侧抽屉中预览
   * 'window': 在新窗口中打开
   */
  @Prop() filePreviewMode: 'drawer' | 'window' = 'window';

  @State() isUploading: boolean = false;
  @State() uploadedFileInfo: FileUploadResponse | null = null;
  @State() showChatModal: boolean = false;
  @State() showIframe: boolean = false;

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  @State() jobDescription: string = '';
  @State() isSubmitting: boolean = false;
  /**
   * iframe DOM 引用
   */
  private _iframeEl?: HTMLIFrameElement;

  private tokenInvalidListener: () => void;
  private removeErrorListener: () => void;
  private pcmUploadRef;

  @Watch('token')
  handleTokenChange(newToken: string) {
    // 当传入的 token 变化时，更新 authStore 中的 token
    if (newToken && newToken !== authStore.getToken()) {
      authStore.setToken(newToken);
    }
  }

  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (!newValue) {
      // 重置状态
      this.showChatModal = false;
      this.jobDescription = '';
    } else {
      if (this.customInputs && this.customInputs.job_info) {
        this.jobDescription = this.customInputs.job_info;
      }

      await verifyApiKey(this.token);

      // 如果有会话ID或者同时有file_url和job_info，直接显示聊天模态框
      if (this.conversationId || (this.customInputs?.file_url && this.customInputs?.job_info)) {
        this.showChatModal = true;
        this.showIframe = false;
      }
    }
  }

  componentWillLoad() {
    // 将 zIndex 存入配置缓存
    if (this.zIndex) {
      configStore.setItem('modal-zIndex', this.zIndex);
    }
    if (this.token) {
      authStore.setToken(this.token);
    }

    // 添加全局token无效事件监听器
    this.tokenInvalidListener = () => {
      this.tokenInvalid.emit();
    };
    // 添加全局错误监听
    this.removeErrorListener = ErrorEventBus.addErrorListener(errorDetail => {
      this.someErrorEvent.emit(errorDetail);
    });
    document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);
  }

  /**
   * 处理流式响应完成事件
   */
  private handleStreamComplete = (event: CustomEvent<StreamCompleteEventData>) => {
    this.conversationId = event.detail.conversation_id;
  };
  componentDidLoad() {
    // 监听来自 iframe 的消息
    window.addEventListener('message', this.handleIframeMessage);
  }

  disconnectedCallback() {
    // 组件销毁时移除事件监听器
    document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);
    // 移除错误监听器
    if (this.removeErrorListener) {
      this.removeErrorListener();
    }
    window.removeEventListener('message', this.handleIframeMessage);
  }

  private handleClose = () => {
    this.modalClosed.emit();
  };


  //   生成简历
  private closeResumeChat = () => {
    this.showIframe = true;
    this.showChatModal = false;
  };
  /**
   * 处理 iframe 加载完成（不再直接发送 token）
   * 由 iframe 主动 postMessage { type: 'iframeReady' } 通知父页面后再发送 token
   */
  private handleIframeLoad = () => {
    console.log(this._iframeEl, 'this._iframeEl');
    // 不再直接发送 token，等待 iframeReady 消息
  };
  /**
   * 处理来自 iframe 的消息
   * 支持 iframe 调用父组件方法，也支持握手机制
   */
  private handleIframeMessage = (event: MessageEvent) => {
    // 允许本地和线上环境
    const allowedOrigins = ['http://localhost:3000', PCM_DOMAIN];
    if (!allowedOrigins.includes(event.origin)) return;
    const { type, value } = event.data || {};
    if (type === 'callParentMethod') {
      this.exampleMethodFromIframe(value);
    }
    // 关键：收到 iframeReady 后再发送 token
    if (type === 'iframeReady' && this._iframeEl?.contentWindow) {
      // 动态获取 targetOrigin，兼容本地和线上
      const targetOrigin = new URL(this._iframeEl.src).origin;
      // 1. 先发送 parentReady，带上父页面的 origin
      this._iframeEl.contentWindow.postMessage({ type: 'parentReady', origin: window.location.origin }, targetOrigin);
      // 2. 再发送 token
      this._iframeEl.contentWindow.postMessage({ type: 'setToken', token: this.token }, targetOrigin);
      console.log(this.exportButtonText, 'this.exportButtonText');
      this._iframeEl.contentWindow.postMessage(
        {
          type: 'buttonConfig',
          config: {
            hideExportButton: this.hideExportButton,
            exportButtonText: this.exportButtonText,
          },
        },
        targetOrigin,
      );
      console.log('父组件已发送 token 给 iframe，targetOrigin:', targetOrigin);
    }
  };

  /**
   * 导出简历数据
   * @param value 简历数据是字符串形式
   */
  public exampleMethodFromIframe(value: string) {
    this.getResumeData.emit(JSON.parse(value));
  }



  private handleJobDescriptionChange = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement;
    this.jobDescription = textarea.value;
  };

  private handleStartInterview = async () => {
    // 既没有预设 file_url，也没有上传文件，则提示
    if (!this.customInputs?.file_url && !this.uploadedFileInfo) {
      Message.info('请上传简历');
      return;
    }

    // 如果没有预设的job_info，则需要检查用户输入
    if (!this.customInputs?.job_info && !this.jobDescription.trim()) {
      Message.info('请输入职位描述');
      return;
    }

    // 判断文件是否正在上传
    if (await this.pcmUploadRef?.getIsUploading?.()) {
      Message.info('文件上传中，请稍后');
      return;
    }

    this.isSubmitting = true;
    this.showChatModal = true;
    this.isSubmitting = false;
  };

  render() {
    if (!this.isOpen) return null;

    const modalStyle = {
      zIndex: String(this.zIndex),
    };

    const containerClass = {
      'modal-container': true,
      'fullscreen': this.fullscreen,
      'pc-layout': !this.showIframe,
    };

    const overlayClass = {
      'modal-overlay': true,
      'fullscreen-overlay': this.fullscreen,
    };

    // 显示加载状态
    const isLoading = this.conversationId && !this.showChatModal;

    // 修正这里的逻辑，确保当 customInputs.job_info 存在时，hideJdInput 为 true
    const hideJdInput = Boolean(this.customInputs && this.customInputs.job_info);

    // 判断是否隐藏简历上传区域
    const hideResumeUpload = Boolean(this.customInputs && this.customInputs.file_url);

    // 判断是否同时提供了file_url和job_info
    const hasFileAndJob = Boolean(this.customInputs?.file_url && this.customInputs?.job_info);

    return (
      <div class={overlayClass} style={modalStyle}>
        <div class={containerClass}>
          {this.isShowHeader && (
            <div class="modal-header">
              <div class="header-left">
                {this.icon && <img src={this.icon} class="header-icon" alt="应用图标" />}
                <div>{this.modalTitle}</div>
              </div>
              {this.isNeedClose && (
                <button class="close-button" onClick={this.handleClose}>
                  <span>×</span>
                </button>
              )}
            </div>
          )}

          {/* 上传界面 - 仅在不显示聊天模态框且没有会话ID且没有同时提供file_url和job_info时显示 */}
          {!this.showChatModal && !this.conversationId && !hasFileAndJob && (
            <div class="input-container">
              {/* JD输入区域 - 仅在没有customInputs.job_info时显示 */}
              {!hideJdInput && (
                <div class="jd-input-section">
                  <label htmlFor="job-description">请输入职位描述 (JD)</label>
                  <textarea
                    id="job-description"
                    class="job-description-textarea"
                    placeholder="请输入职位描述，包括职责、要求等信息..."
                    rows={6}
                    value={this.jobDescription}
                    onInput={this.handleJobDescriptionChange}
                  ></textarea>
                </div>
              )}

              {/* 简历上传区域 - 仅在没有customInputs.file_url时显示 */}
              {!hideResumeUpload && (
                <div class="resume-upload-section">
                  <label>上传简历</label>
                  <pcm-upload
                    ref={el => this.pcmUploadRef = el}
                    maxFileSize={15 * 1024 * 1024}
                    multiple={false}
                    mobileUploadAble={this.mobileUploadAble}
                    acceptFileSuffixList={['.txt', '.md', '.pdf', '.docx', '.doc']}
                    uploadParams={{
                      tags: ['resume'],
                    }}
                    onUploadChange={(e) => {
                      const result: FileUploadResponse[] = e.detail ?? [];
                      this.uploadedFileInfo = result[0];
                      this.uploadSuccess.emit(this.uploadedFileInfo);
                    }}
                  />
                </div>
              )}

              <button
                class="submit-button"
                disabled={(!hideResumeUpload && !this.uploadedFileInfo) || (!hideJdInput && !this.jobDescription.trim()) || this.isUploading || this.isSubmitting}
                onClick={this.handleStartInterview}
              >
                {this.isUploading ? '上传中...' : this.isSubmitting ? '处理中...' : '开始分析'}
              </button>

              <div class="ai-disclaimer">
                <p>所有内容均由AI生成仅供参考</p>
                <p class="beian-info">
                  <span>中央网信办生成式人工智能服务备案号</span>：
                  <a href="https://www.pincaimao.com" target="_blank" rel="noopener noreferrer">
                    Hunan-PinCaiMao-202412310003
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* 加载状态 - 在有会话ID但聊天模态框尚未显示时展示 */}
          {isLoading && !this.showIframe && (
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <p class="loading-text">正在加载对话...</p>
            </div>
          )}

          {/* 聊天界面 - 在显示聊天模态框时显示 */}
          {this.showChatModal && (
            <div>
              <pcm-app-chat-modal
                isOpen={true}
                modalTitle={this.modalTitle}
                icon={this.icon}
                isShowHeader={this.isShowHeader}
                isNeedClose={this.isShowHeader}
                fullscreen={this.fullscreen}
                showWorkspaceHistory={this.showWorkspaceHistory}
                botId="45444431062634496"
                conversationId={this.conversationId}
                defaultQuery={this.defaultQuery}
                filePreviewMode={this.filePreviewMode}
                closeResume={this.closeResumeChat}
                customInputs={{
                  ...this.customInputs,
                  file_url: this.customInputs?.file_url || this.uploadedFileInfo?.cos_key,
                  file_name: this.customInputs?.file_name || this.uploadedFileInfo?.file_name,
                  job_info: this.customInputs?.job_info || this.jobDescription,
                }}
                interviewMode="text"
                onStreamComplete={this.handleStreamComplete}
              ></pcm-app-chat-modal>
            </div>
          )}
          {this.showIframe && (
            <>
              {/*
                    1. 不再通过 URL 传递 token，避免泄露。
                    2. 通过 ref 获取 iframe 元素，onLoad 时 postMessage 发送 token。
                */}
              <div class="iframe-container">
                <iframe
                  ref={el => (this._iframeEl = el as HTMLIFrameElement)}
                  src={`${PCM_DOMAIN}/myresume?conversation_id=${this.conversationId}&isSdk=true`}
                  // src={`http://localhost:3000/myresume?conversation_id=${this.conversationId}&isSdk=true`}
                  frameborder="0"
                  onLoad={this.handleIframeLoad}
                ></iframe>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

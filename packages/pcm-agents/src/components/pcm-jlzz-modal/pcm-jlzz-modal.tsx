import { Component, h, Prop, Event, EventEmitter, Watch, State, Element } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse, verifyApiKey, PCM_DOMAIN, sendHttpRequest } from '../../utils/utils';
import { ConversationStartEventData, StreamCompleteEventData } from '../../components';
import { ErrorEventBus, ErrorEventDetail } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';
import { SentryReporter } from '../../utils/sentry-reporter';
import { ConversationItem } from '../../interfaces/chat';

@Component({
  tag: 'pcm-jlzz-modal',
  styleUrls: ['pcm-jlzz-modal.css', '../../global/global.css'],
  shadow: true,
})
export class JlzzModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '简历制作';

  /**
   * SDK鉴权密钥
   */
  @Prop({ attribute: 'token' }) token!: string;

  /**
   * 是否显示聊天模态框
   */
  @Prop({ mutable: true }) isOpen: boolean = false;

  /**
   * 是否成功，成功展示 iframe 官网
   */
  @State() isSuccess: boolean = false;

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
   * 会话ID
   */
  @State() conversationId?: string;

  /**
   * 默认查询文本
   */
  @Prop() defaultQuery: string = '根据对话生成简历';

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  @State() customInputs: Record<string, string> = {};

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
   * SDK密钥验证失败事件
   */
  @Event() tokenInvalid: EventEmitter<void>;

  /**
   * 错误事件
   */
  @Event() someErrorEvent: EventEmitter<ErrorEventDetail>;

  /**
   * 获取简历数据事件（用户点击导出简历json数据后触发）
   */
  @Event() getResumeData: EventEmitter<any>;

  /**
   * 附件预览模式
   * 'drawer': 在右侧抽屉中预览
   * 'window': 在新窗口中打开
   */
  @Prop() filePreviewMode: 'drawer' | 'window' = 'window';

  @State() selectedFile: File | null = null;
  @State() isUploading: boolean = false;
  @State() uploadedFileInfo: FileUploadResponse | null = null;
  @State() showChatModal: boolean = false;
  @State() resumeType: 'upload' | 'paste' | 'chat' | 'history' = 'chat';
  @State() resumeText: string = '';

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  @State() isSubmitting: boolean = false;
  @State() showIframe: boolean = false;
  // 添加历史会话相关状态
  @State() isHistoryDrawerOpen: boolean = false;
  @State() historyConversations: ConversationItem[] = [];
  @State() isLoadingConversations: boolean = false;
  private tokenInvalidListener: () => void;
  private removeErrorListener: () => void;
  /**
   * iframe DOM 引用
   */
  private _iframeEl?: HTMLIFrameElement;

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
      this.clearSelectedFile();
      this.showChatModal = false;
      this.showIframe = false;
      this.isSuccess = false;
      this.conversationId = undefined;
      this.resumeType = 'chat';
    } else {
      await verifyApiKey(this.token);
     
      
    }
  }

  /**
   * 处理流式响应完成事件
   */
  private handleStreamComplete = (event: CustomEvent<StreamCompleteEventData>) => {
    this.conversationId = event.detail.conversation_id;
    // 当流式响应完成时，如果不是直接对话模式，则显示 iframe
    if (this.resumeType !== 'chat') {
      this.showIframe = true;
      this.isSuccess = true;
    }
  };
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

  private handleClose = () => {
    this.modalClosed.emit();
  };
  // 切换类型
  private changeType = (type: 'upload' | 'paste' | 'chat' | 'history') => {
    this.resumeType = type;
  };

  private handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  };
  private handleResumeTextChange = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement;
    this.resumeText = textarea.value;
  };

  private handleUploadClick = () => {
    const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    fileInput?.click();
  };

  private clearSelectedFile = () => {
    this.selectedFile = null;
    this.uploadedFileInfo = null;
    const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  // 获取历史会话列表
  private async loadHistoryConversations() {
    this.isLoadingConversations = true;

    try {
      const result = await sendHttpRequest({
        url: '/sdk/v1/chat/conversations',
        method: 'GET',
        data: {
          bot_id: '39284520284983296',
          limit: 50, // 获取最近50个会话
          page: 1,
        },
      });

      if (result.success && result.data) {
        const conversations = result.data.data || [];

        // 格式化会话数据
        this.historyConversations = conversations.map((conv: any) => {
          // 处理时间戳，确保它是有效的数字
          let createdTime: Date;
          let timeDisplay = '未知时间';

          try {
            // 确保 created_at 是一个有效的时间戳
            const timestamp = typeof conv.created_at === 'string' ? parseInt(conv.created_at) : conv.created_at;

            if (isNaN(timestamp) || timestamp <= 0) {
              console.warn('无效的时间戳:', conv.created_at);
              createdTime = new Date();
            } else {
              // Unix时间戳转换为JavaScript Date对象（乘以1000转换为毫秒）
              createdTime = new Date(timestamp * 1000);
            }

            // 验证日期是否有效
            if (isNaN(createdTime.getTime())) {
              console.warn('无效的日期对象:', conv.created_at);
              createdTime = new Date();
            }

            const now = new Date();
            const diffTime = now.getTime() - createdTime.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // 格式化时间显示
            if (diffDays === 0) {
              // 今天
              timeDisplay = `今天 ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
            } else if (diffDays === 1) {
              // 昨天
              timeDisplay = `昨天 ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
            } else if (diffDays > 0 && diffDays < 7) {
              // 一周内
              const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
              timeDisplay = `${weekdays[createdTime.getDay()]} ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
            } else if (diffDays < 0) {
              // 未来时间（可能是时区问题或系统时间不准确）
              timeDisplay = `${(createdTime.getMonth() + 1).toString().padStart(2, '0')}-${createdTime.getDate().toString().padStart(2, '0')} ${createdTime
                .getHours()
                .toString()
                .padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
            } else {
              // 超过一周
              timeDisplay = `${(createdTime.getMonth() + 1).toString().padStart(2, '0')}-${createdTime.getDate().toString().padStart(2, '0')} ${createdTime
                .getHours()
                .toString()
                .padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
            }
          } catch (error) {
            console.error('时间格式化错误:', error, conv.created_at);
            timeDisplay = '时间解析失败';
          }

          return {
            id: conv.id,
            name: conv.name || '新会话',
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            status: conv.status,
            message_count: conv.message_count || 0,
            timeDisplay,
          } as ConversationItem;
        });
      }
    } catch (error) {
      console.error('获取历史会话失败:', error);
      SentryReporter.captureError(error, {
        action: 'loadHistoryConversations',
        component: 'pcm-app-chat-modal',
        title: '获取历史会话失败',
      });
      ErrorEventBus.emitError({
        error: error,
        message: '获取历史会话失败',
      });
    } finally {
      this.isLoadingConversations = false;
    }
  }
  private async uploadFile() {
    if (!this.selectedFile) return;

    this.isUploading = true;

    try {
      // 使用 uploadFileToBackend 工具函数上传文件
      const result = await uploadFileToBackend(
        this.selectedFile,
        {},
        {
          tags: ['resume'],
        },
      );

      this.uploadedFileInfo = result;
      this.uploadSuccess.emit(result);
    } catch (error) {
      console.error('文件上传错误:', error);
      this.clearSelectedFile();
      SentryReporter.captureError(error, {
        action: 'uploadFile',
        component: 'pcm-jlzz-modal',
        title: '文件上传失败',
      });
      ErrorEventBus.emitError({
        error: error,
        message: '文件上传失败，请重试',
      });
    } finally {
      this.isUploading = false;
    }
  }

  private handleStartInterview = async () => {
    if (this.resumeType === 'upload' && !this.selectedFile) {
      alert('请上传简历');
      return;
    }

    if (this.resumeType === 'paste' && !this.resumeText.trim()) {
      alert('请粘贴简历文本');
      return;
    }

    this.isSubmitting = true;

    try {
      // 如果还没上传，先上传文件
      if (this.resumeType === 'upload' && !this.uploadedFileInfo) {
        await this.uploadFile();
        if (!this.uploadedFileInfo) {
          this.isSubmitting = false;
          return; // 上传失败
        }
      }

      // 直接显示聊天模态框
      this.showChatModal = true;
    } catch (error) {
      console.error('开始制作时出错:', error);
      SentryReporter.captureError(error, {
        action: 'handleStartInterview',
        component: 'pcm-jlzz-modal',
        title: '开始制作时出错',
      });
      ErrorEventBus.emitError({
        error: error,
        message: '开始制作时出错，请重试',
      });
    } finally {
      this.isSubmitting = false;
    }
  };
  private closeResumeChat = () => {
    this.isSuccess = false;
    this.resumeType = 'chat';
  };
  render() {
    if (!this.isOpen) return null;
    const modalStyle = {
      zIndex: String(this.zIndex),
    };

    const containerClass = {
      'modal-container': true,
      'fullscreen': this.fullscreen,
      'pc-layout': !this.isSuccess,
    };

    const overlayClass = {
      'modal-overlay': true,
      'fullscreen-overlay': this.fullscreen,
    };

    // 判断是否隐藏简历上传区域
    const hideResumeUpload = Boolean(this.customInputs && this.customInputs.file_url);

    // 判断是否同时提供了file_url和job_info
    const hasFileAndJob = Boolean(this.customInputs?.file_url && this.customInputs?.job_info);

    return (
      <div class={overlayClass} style={modalStyle}>
        <div class={containerClass}>
          {this.isShowHeader && !this.showChatModal && (
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
          {!this.showChatModal && !this.conversationId && !hasFileAndJob && !this.showIframe && (
            <div class="input-container">
              <div class="resume-type-container">
                <div
                  class={{
                    'resume-type-item': true,
                    'selected': this.resumeType === 'chat',
                  }}
                  onClick={() => this.changeType('chat')}
                >
                  直接开始
                </div>
                <div
                  class={{
                    'resume-type-item': true,
                    'selected': this.resumeType === 'upload',
                  }}
                  onClick={() => this.changeType('upload')}
                >
                  上传简历
                </div>
                <div
                  class={{
                    'resume-type-item': true,
                    'selected': this.resumeType === 'paste',
                  }}
                  onClick={() => this.changeType('paste')}
                >
                  粘贴简历
                </div>
                <div
                  class={{
                    'resume-type-item': true,
                    'selected': this.resumeType === 'history',
                  }}
                  onClick={() => {
                    this.changeType('history');
                    this.loadHistoryConversations();
                  }}
                >
                  历史对话
                </div>
              </div>

              {/* 简历上传区域 - 仅在没有customInputs.file_url时显示 */}
              {!hideResumeUpload && this.resumeType === 'upload' && (
                <div class="resume-upload-section">
                  <label>上传简历</label>
                  <div class="upload-area" onClick={this.handleUploadClick}>
                    {this.selectedFile ? (
                      <div class="file-item">
                        <div class="file-item-content">
                          <span class="file-icon">📝</span>
                          <span class="file-name">{this.selectedFile.name}</span>
                        </div>
                        <button
                          class="remove-file"
                          onClick={e => {
                            e.stopPropagation();
                            this.clearSelectedFile();
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div class="upload-placeholder">
                        <img src="https://pub.pincaimao.com/static/web/images/home/i_upload.png"></img>
                        <p class="upload-text">点击上传简历</p>
                        <p class="upload-hint">支持 txt、markdown、pdf、docx、doc、md 格式</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {this.resumeType === 'paste' && (
                <div class="jd-input-section">
                  <label htmlFor="job-description">
                    请粘贴简历文本
                  </label>
                  <textarea
                    id="job-description"
                    class="job-description-textarea"
                    placeholder="请粘贴简历文本..."
                    rows={6}
                    value={this.resumeText}
                    onInput={this.handleResumeTextChange}
                  ></textarea>
                </div>
              )}

              {this.resumeType === 'chat' && (
                <div class="jd-input-section">
                  <label htmlFor="job-description">从头开始创建</label>
                  <div class="chat-content">
                    <div class="chat-content-text">🤖无需复杂操作，只需回答AI的几个简单问题，系统会根据你的回答自动生成内容完整、格式专业的个人简历</div>
                  </div>
                </div>
              )}

              {}
              {this.resumeType === 'history' ? (
                <div class="converstation-list">
                  {this.historyConversations.map(conversation => (
                    <div
                      key={conversation.id}
                      class={{
                        'conversation-item': true,
                        'active': conversation.id === this.conversationId,
                      }}
                      onClick={() => {
                        this.conversationId = conversation.id;
                        this.isSuccess = true;
                        this.showChatModal = true;
                        this.showIframe = true;
                      }}
                    >
                      <div class="conversation-info">
                        <div class="conversation-title">{conversation.name}</div>
                        <div class="conversation-meta">
                          <span class="conversation-time">{conversation.timeDisplay}</span>
                          {conversation.message_count > 0 && <span class="message-count">{conversation.message_count}条消息</span>}
                          {conversation.status && (
                            <span
                              class={{
                                'conversation-status': true,
                                'completed': conversation.status === '结束',
                                'running': conversation.status === '进行中',
                              }}
                            >
                              {conversation.status}
                            </span>
                          )}
                        </div>
                      </div>
                      {conversation.id === this.conversationId && (
                        <div class="current-indicator">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  class="submit-button"
                  disabled={
                    (this.resumeType === 'upload' && !hideResumeUpload && !this.selectedFile) ||
                    (this.resumeType === 'paste' && !this.resumeText.trim()) ||
                    this.isUploading ||
                    this.isSubmitting
                  }
                  onClick={this.handleStartInterview}
                >
                  {this.isUploading ? '上传中...' : this.isSubmitting ? '处理中...' : ['upload', 'paste'].includes(this.resumeType) ? '开始制作' : '开始对话'}
                </button>
              )}

              <div class="ai-disclaimer">
                <p>所有内容均由AI生成仅供参考</p>
                <p class="beian-info">
                  <span>中央网信办生成式人工智能服务备案号</span>：
                  <a href="https://www.pincaimao.com" target="_blank" rel="noopener noreferrer">
                    Hunan-PinCaiMao-202412310003
                  </a>
                </p>
              </div>

              <input type="file" class="file-input" onChange={this.handleFileChange} />
            </div>
          )}


          {/* 聊天界面 - 在显示聊天模态框时显示 */}
          {this.showChatModal && (
            <>
              <div
                style={{
                  display: this.resumeType === 'chat' ? 'block' : 'none',
                }}
              >
                <pcm-app-chat-modal
                  isOpen={true}
                  modalTitle={this.modalTitle}
                  icon={this.icon}
                  isShowHeader={this.isShowHeader}
                  isNeedClose={this.isShowHeader}
                  fullscreen={this.fullscreen}
                  showWorkspaceHistory={false}
                  botId="39284520284983296"
                  conversationId={this.conversationId}
                  defaultQuery={this.resumeType === 'paste' ? this.resumeText : this.defaultQuery}
                  filePreviewMode={this.filePreviewMode}
                  customInputs={{
                    ...this.customInputs,
                    file_url: this.resumeType === 'upload' ? this.customInputs.file_url || this.uploadedFileInfo?.cos_key : '',
                    mode_type: this.resumeType === 'chat' ? 1 : 0,
                  }}
                  interviewMode="text"
                  closeResume={this.closeResumeChat}
                  onStreamComplete={this.handleStreamComplete}
                ></pcm-app-chat-modal>
              </div>
              {/* 如果不是对话模式，则展示加载中。完成之后跳转 */}
              {this.resumeType !== 'chat' && !this.showIframe && (
                <div class="loading-container">
                  <div class="loading-spinner"></div>
                  <p class="loading-text">AI正在优化您的简历...</p>
                </div>
              )}
              {this.showIframe && (
                <>
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
            </>
          )}
        </div>
      </div>
    );
  }
}

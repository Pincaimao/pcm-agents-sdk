import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest, verifyApiKey } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';

/**
 * 知识库问答助手
 */


// 添加引用文档接口
interface Reference {
  doc_info: {
    doc_name: string;
    doc_id: string;
  };
  content: string;
}

// 添加智能体详情接口
interface EmployeeDetails {
  id: number;
  name: string;
  description: string;
  avatar: string;
  default_greeting: string;
  quick_questions: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  dify_app_key: string | null;
  last_conversation_id: string | null;
  workflow_id: string;
  agent_name: string;
}

@Component({
  tag: 'pcm-zsk-chat-modal',
  styleUrl: 'pcm-zsk-chat-modal.css',
  shadow: true,
})
export class ChatKBModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '在线客服';

  /**
   * SDK鉴权密钥
   */
  @Prop({ attribute: 'token' }) token!: string;

  /**
   * 是否显示聊天模态框
   */
  @Prop({ mutable: true }) isOpen: boolean = false;

  /**
   * 聊天消息历史
   */
  @State() messages: ChatMessage[] = [];


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
   * 当前助手回复的消息
   */
  @State() currentAssistantMessage: string = '';

  /**
   * 是否正在加载回复
   */
  @State() isLoading: boolean = false;

  /**
   * 当前正在流式输出的消息
   */
  @State() currentStreamingMessage: ChatMessage | null = null;

  // 添加新的状态控制
  @State() shouldAutoScroll: boolean = true;

  @State() isLoadingHistory: boolean = false;

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  /**
   * 一轮对话结束时的回调
   */
  @Event() streamComplete: EventEmitter<{
    conversation_id: string;
    event: string;
    message_id: string;
    id: string;
  }>;

  /**
   * 新会话开始的回调，只会在一轮对话开始时触发一次
   */
  @Event() conversationStart: EventEmitter<{
    conversation_id: string;
    event: string;
    message_id: string;
    id: string;
  }>;


  /**
     * SDK密钥验证失败事件
     */
  @Event() tokenInvalid: EventEmitter<void>;


  private readonly SCROLL_THRESHOLD = 30;

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  // 添加文字输入相关状态
  @State() textAnswer: string = '';
  @State() isSubmittingText: boolean = false;

  /**
   * 自定义智能体inputs输入参数
   */
  @Prop() customInputs: Record<string, any> = {};


  // 添加推荐问题和引用文档状态
  @State() suggestedQuestions: string[] = [];
  @State() suggestedQuestionsLoading: boolean = false;
  @State() currentRefs: Reference[] = [];

  /**
   * 是否显示引用文档
   */
  @Prop() showReferences: boolean = true;

  /**
   * 是否显示推荐问题
   */
  @Prop() showSuggestedQuestions: boolean = false;

  /**
   * 数字员工ID，从聘才猫开发平台创建数字员工后，点击导出获取
   */
  @Prop() employeeId!: string;

  /**
   * 智能体详情
   */
  @State() employeeDetails: EmployeeDetails | null = null;

  /**
   * 是否正在加载智能体详情
   */
  @State() isLoadingEmployeeDetails: boolean = false;

  /**
   * 预设问题列表
   */
  @State() quickQuestions: string[] = [];

  private handleClose = () => {
    this.modalClosed.emit();
  };


  private async sendMessageToAPI(message: string) {
    // 验证 employeeId 是否存在
    if (!this.employeeId) {
      alert('请提供有效的数字员工ID');
      return;
    }

    this.isLoading = true;
    let answer = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 修改消息处理逻辑，移除文件上传相关代码
    const queryText = message.trim() || '请开始';

    // 重置推荐问题和引用文档
    this.suggestedQuestions = [];
    this.currentRefs = [];

    // 创建新的消息对象
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,  // 消息唯一标识
      time: time,                // 消息时间
      query: queryText,          // 用户输入的消息内容
      answer: '',
      isStreaming: true,        // 是否正在流式输出
      conversation_id: this.conversationId,  // 会话ID
      inputs: this.customInputs,               // 输入参数
      status: "normal",         // 消息状态
      error: null              // 错误信息
    };

    // 设置当前流式消息
    this.currentStreamingMessage = newMessage;

    this.shouldAutoScroll = true;
    // 滚动到底部
    this.scrollToBottom();

    // 准备请求数据
    const requestData: any = {
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      query: queryText,
      employee_id: this.employeeId,
    };

    // 合并基本输入参数和自定义输入参数
    requestData.inputs = {
      // 合并自定义输入参数
      ...this.customInputs
    };

    await sendSSERequest({
      url: `/sdk/v1/knowledge/chat/chat-messages`,
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + this.token
      },
      data: requestData,
      onMessage: (data) => {
        console.log('收到Stream数据:', data);

        if (data.conversation_id && !this.conversationId) {
          this.conversationId = data.conversation_id;
          this.conversationStart.emit({
            conversation_id: data.conversation_id,
            event: data.event,
            message_id: data.message_id,
            id: data.id,
          });
        }

        // 处理问题建议
        if (data.event === 'node_started' && data.data.title.includes('聘才猫推荐开始')) {
          this.suggestedQuestionsLoading = true;
        }

        // 处理问题建议
        if (data.event === 'node_finished' && data.data.title.includes('聘才猫推荐结束')) {
          let suggestions: string[] = [];

          try {
            // 清理 markdown 代码块标记并解析 JSON
            let textContent = data.data.outputs.text;
            if (typeof textContent === 'string') {
              // 移除 markdown 代码块标记
              textContent = textContent.replace(/```json\n/, '').replace(/```/, '').trim();
              const suggestionData = JSON.parse(textContent);

              // 处理标准格式的建议问题
              if (suggestionData.status === 'success' && Array.isArray(suggestionData.items)) {
                suggestions = suggestionData.items.map((item: any) => item.question);
              }
            } else {
              // 如果已经是对象，直接使用
              const suggestionData = textContent;
              if (suggestionData.status === 'success' && Array.isArray(suggestionData.items)) {
                suggestions = suggestionData.items.map((item: any) => item.question);
              }
            }
          } catch (e) {
            console.warn('解析问题建议失败:', e);
          }

          this.suggestedQuestions = suggestions;
          this.suggestedQuestionsLoading = false;
        }

        // 处理引用文档
        if (data.event === 'node_finished' && data.data?.inputs?.documents) {
          const refs: Reference[] = [];

          // 遍历 documents 数组
          data.data.inputs.documents.forEach((arg: any) => {
            // 遍历每个 arg 中的 result_list
            if (arg.result_list && Array.isArray(arg.result_list)) {
              arg.result_list.forEach((result: any) => {
                if (result.doc_info && result.content) {
                  refs.push({
                    doc_info: {
                      doc_name: result.doc_info.doc_name,
                      doc_id: result.doc_info.doc_id
                    },
                    content: result.content
                  });
                }
              });
            }
          });

          // 去重处理
          const uniqueRefs = new Map();
          refs.forEach((ref: Reference) => {
            if (ref.doc_info && ref.doc_info.doc_id) {
              uniqueRefs.set(ref.doc_info.doc_id, ref);
            }
          });

          this.currentRefs = Array.from(uniqueRefs.values());
        }

        if (data.event === 'message') {
          const inputMessage: UserInputMessageType = { message: message };
          convertWorkflowStreamNodeToMessageRound('message', inputMessage, data);

          if (data.event === 'agent_message' || data.event === 'message') {
            if (data.answer) {
              answer += data.answer;
              const updatedMessage: ChatMessage = {
                ...this.currentStreamingMessage,
                answer,
                isStreaming: true
              };
              this.currentStreamingMessage = updatedMessage;
              this.scrollToBottom();
            }
          }
        }
        if (data.event === "message_end") {
          this.streamComplete.emit({
            conversation_id: data.conversation_id || '',
            event: data.event,
            message_id: data.message_id,
            id: data.id,
          });
        }
      },
      onError: (error) => {
        console.error('发生错误:', error);
        alert(error instanceof Error ? error.message : '消息发送失败，请稍后再试');
        this.messages = [...this.messages, {
          ...newMessage,
          answer: '抱歉，发生了错误，请稍后再试。',
          error: error,
          isStreaming: false
        }];
        this.currentStreamingMessage = null;
        this.isLoading = false;
      },
      onComplete: async () => {
        this.isLoading = false;

        // 更新消息列表
        this.messages = [...this.messages, this.currentStreamingMessage];
        this.currentStreamingMessage = null;

      }
    });
  }


  // 监听滚动事件，用于控制聊天历史记录的自动滚动行为。
  private handleScroll = () => {
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (!chatHistory) return;

    const { scrollTop, scrollHeight, clientHeight } = chatHistory;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 更新是否应该自动滚动的状态
    this.shouldAutoScroll = distanceFromBottom <= this.SCROLL_THRESHOLD;
  };

  private scrollToBottom() {
    if (!this.shouldAutoScroll) return;
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory && this.isOpen) {
      // 强制浏览器重新计算布局
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }

  // 添加 componentDidRender 生命周期方法，用于在组件渲染后滚动到底部
  componentDidRender() {
    if (this.isLoadingHistory || (this.shouldAutoScroll && this.isOpen)) {
      const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    }
  }


  // 修改 loadHistoryMessages 方法
  private async loadHistoryMessages() {
    if (!this.conversationId) return;

    this.isLoadingHistory = true;
    console.log('加载历史消息...');

    try {
      const result = await sendHttpRequest({
        url: '/sdk/v1/knowledge/chat/conversation-history',
        method: 'GET',
        headers: {
          'authorization': 'Bearer ' + this.token
        },
        data: {
          conversation_id: this.conversationId,
        }
      });

      if (result.success && result.data) {
        const historyData = result.data.data || [];
        const formattedMessages: ChatMessage[] = historyData.map(msg => {
          const time = new Date(msg.created_at * 1000);
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;

          // 创建新的消息对象，不包含 inputs 字段
          const { inputs, ...msgWithoutInputs } = msg;

          return {
            ...msgWithoutInputs,
            time: timeStr,
            isStreaming: false,
            status: msg.status === 'error' ? 'error' : 'normal' as const
          };
        });

        this.messages = formattedMessages;

        requestAnimationFrame(() => {
          this.shouldAutoScroll = true;
          this.scrollToBottom();
        });
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      alert(error instanceof Error ? error.message : '加载历史消息失败，请刷新重试');
    } finally {
      this.isLoadingHistory = false;
    }
  }

  // 修改 componentDidLoad 生命周期方法
  componentDidLoad() {
    // 添加滚动事件监听器
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory) {
      chatHistory.addEventListener('scroll', this.handleScroll);
    }
  }


  // 添加获取智能体详情的方法
  private async fetchEmployeeDetails() {
    if (!this.employeeId || !this.token) return;

    this.isLoadingEmployeeDetails = true;

    try {
      const result = await sendHttpRequest({
        url: `/sdk/v1/knowledge/chat/employee/${this.employeeId}`,
        method: 'GET',
        headers: {
          'authorization': 'Bearer ' + this.token
        }
      });
      if (result.success && result.data) {
        this.employeeDetails = result.data;
        
        // 设置预设问题
        if (this.employeeDetails.quick_questions) {
          this.quickQuestions = this.employeeDetails.quick_questions
            .split(',')
            .map(q => q.trim())
            .filter(q => q);
        }

        // 如果有上次会话ID，加载历史消息
        if (this.conversationId) {
          await this.loadHistoryMessages();
        }
      }else{
        alert('获取智能体详情失败，请稍后再试');
      }
    } catch (error) {
      console.error('获取智能体详情失败:', error);
    } finally {
      this.isLoadingEmployeeDetails = false;
    }
  }

  // 修改 isOpen 的 watch 方法
  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      // 验证 employeeId 是否存在
      if (!this.employeeId) {
        console.error('未提供数字员工ID (employeeId)');
        setTimeout(() => alert('请提供有效的数字员工ID'), 0);
        return;
      }

      // 当模态框打开时，验证API密钥
      this.verifyApiKey();

      // 获取智能体详情
      await this.fetchEmployeeDetails();
    }
  }


  // 修改 componentDidLoad 生命周期方法，确保组件卸载时释放资源
  disconnectedCallback() {
    // 移除滚动事件监听器
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory) {
      chatHistory.removeEventListener('scroll', this.handleScroll);
    }

  }


   /**
     * 验证API密钥
     */
   private async verifyApiKey() {
    try {
        const isValid = await verifyApiKey(this.token);
        
        if (!isValid) {
            throw new Error('API密钥验证失败');
        }
    } catch (error) {
        console.error('API密钥验证错误:', error);
        // 通知父组件API密钥无效
        this.tokenInvalid.emit();
    }
}

  // 处理文本输入变化
  private handleTextInputChange = (event: Event) => {
    const input = event.target as HTMLTextAreaElement;
    this.textAnswer = input.value;
  };

  // 添加处理键盘事件的方法
  private handleKeyDown = (event: KeyboardEvent) => {
    // 如果按下的是回车键
    if (event.key === 'Enter') {
      // 如果同时按下了Ctrl键，允许换行
      if (event.ctrlKey) {
        return; // 不阻止默认行为，允许插入换行符
      } else {
        // 阻止默认的换行行为
        event.preventDefault();
        // 如果文本框不为空且不处于禁用状态，则发送消息
        if (this.textAnswer.trim() && !this.isSubmittingText && !this.isLoading &&
          !this.currentStreamingMessage) {
          this.submitTextAnswer();
        }
      }
    }
  };

  // 修改提交文本回答的方法
  private submitTextAnswer = async () => {
    if (!this.textAnswer.trim() || this.isSubmittingText) {
      return;
    }

    this.isSubmittingText = true;

    try {
      // 保存当前输入内容
      const textToSend = this.textAnswer;

      // 立即清空文本输入
      this.textAnswer = '';

      // 发送用户输入的文本作为查询
      await this.sendMessageToAPI(textToSend);
    } catch (error) {
      console.error('提交文本回答失败:', error);
      alert('提交回答失败，请重试');
    } finally {
      this.isSubmittingText = false;
    }
  };

  // 添加处理推荐问题点击的方法
  private handleSuggestedQuestionClick = (question: string) => {
    if (this.isLoading || this.currentStreamingMessage) return;
    this.textAnswer = question;
    this.submitTextAnswer();
  };

  // 添加文档下载方法
  private async handleDocumentDownload(ref: Reference) {
    try {
      console.log('下载文档:', ref);
      
      // 从文档ID中提取数字部分
      const docIdMatch = ref.doc_info.doc_id.match(/docID_(\d+)/);
      if (!docIdMatch || !docIdMatch[1]) {
        alert('无法解析文档ID');
        return;
      }
      const docId = docIdMatch[1];
      // 获取文档详细信息
      const result = await sendHttpRequest({
        url: `/sdk/v1/files/${docId}/info`,
        method: 'GET',
        headers: {
          'authorization': `Bearer ${this.token}`
        },
      });


      if (result.success && result.data?.file_url) {
        // 构建预览URL
        const baseUrl = result.data.file_url;
        const previewUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ci-process=doc-preview&copyable=1&dstType=html`;

        // 打开预览链接
        window.open(previewUrl, '_blank');
      } else {
        alert('获取文档链接失败');
      }
    } catch (error) {
      console.error('下载文档失败:', error);
      alert('下载文档失败，请稍后再试');
    }
  }

  render() {
    if (!this.isOpen) return null;

    const modalStyle = {
      zIndex: String(this.zIndex)
    };

    const containerClass = {
      'modal-container': true,
      'fullscreen': this.fullscreen
    };

    const overlayClass = {
      'modal-overlay': true,
      'fullscreen-overlay': this.fullscreen
    };

    // 修改渲染引用文档组件的方法
    const renderReferences = () => {
      if (!this.showReferences || this.currentRefs.length === 0) return null;

      return (
        <div class="references-section">
          <h3 class="references-title">引用文档</h3>
          <div class="references-list">
            {this.currentRefs.map((ref, index) => (
              <div
                class="reference-item"
                key={`ref-${index}`}
                onClick={() => this.handleDocumentDownload(ref)}
              >
                <div class="reference-header">
                  <span class="reference-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                  </span>
                  <span class="reference-name">{ref.doc_info.doc_name}</span>
                  <span class="download-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // 渲染推荐问题组件
    const renderSuggestedQuestions = () => {
      if (!this.showSuggestedQuestions) return null;

      if (this.suggestedQuestionsLoading) {
        return (
          <div class="loading-suggestions">
            <div class="loading-spinner-small"></div>
          </div>
        );
      }

      if (this.suggestedQuestions.length === 0) return null;

      return (
        <div class="suggested-questions">
          <h3 class="suggested-title">推荐问题</h3>
          {this.suggestedQuestions.map((question, index) => (
            <div
              class="suggested-question"
              key={`question-${index}`}
              onClick={() => this.handleSuggestedQuestionClick(question)}
            >
              <span>{question}</span>
              <span class="arrow-right">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      );
    };

    // 渲染预设问题组件
    const renderQuickQuestions = () => {
      // 只有在没有会话ID且有预设问题时才显示
      if (this.conversationId || this.quickQuestions.length === 0) return null;

      return (
        <div class="suggested-questions">
          <h3 class="suggested-title">常见问题</h3>
          {this.quickQuestions.map((question, index) => (
            <div
              class="suggested-question"
              key={`preset-question-${index}`}
              onClick={() => this.handleSuggestedQuestionClick(question)}
            >
              <span>{question}</span>
              <span class="arrow-right">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      );
    };

    // 修改文本输入区域渲染函数
    const renderTextInputArea = () => (
      <div class="text-input-area">
        <textarea
          class="text-answer-input"
          placeholder="请输入...(按回车发送，Ctrl+回车换行)"
          value={this.textAnswer}
          onInput={this.handleTextInputChange}
          onKeyDown={this.handleKeyDown}
        ></textarea>
        <div class="input-toolbar">
          <div class="toolbar-actions">
            {/* <button class="toolbar-button" title="表情" disabled>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4H7zm1.5-5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
            </button>
            <button class="toolbar-button" title="图片" disabled>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
              </svg>
            </button> */}
          </div>
          <button
            class={{
              'submit-text-button': true,
              'disabled': !this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage
            }}
            disabled={!this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage}
            onClick={this.submitTextAnswer}
          >
            {this.isSubmittingText ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    );

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

          <div style={{ height: '100%' }}>
            <div class="chat-history" onScroll={this.handleScroll}>
              {this.isLoadingHistory ? (
                <div class="loading-container">
                  <div class="loading-spinner"></div>
                  <p>加载历史消息中...</p>
                </div>
              ) : (
                <div>
                  {this.messages.map((message) => (
                    <div id={`message_${message.id}`} key={message.id}>
                      <pcm-chat-message
                        message={message}
                        token={this.token}
                        onMessageChange={(event) => {
                          const updatedMessages = this.messages.map(msg =>
                            msg.id === message.id ? { ...msg, ...event.detail } : msg
                          );
                          this.messages = updatedMessages;
                        }}
                      ></pcm-chat-message>
                    </div>
                  ))}
                  {this.currentStreamingMessage && (
                    <div id={`message_${this.currentStreamingMessage.id}`}>
                      <pcm-chat-message
                        token={this.token}
                        message={this.currentStreamingMessage}
                      ></pcm-chat-message>
                    </div>
                  )}
                  {this.messages.length === 0 && !this.currentStreamingMessage && (
                    <div class="empty-state">
                      {this.isLoadingEmployeeDetails ? (
                        <p>加载中...</p>
                      ) : this.employeeDetails?.default_greeting ? (
                        <p>{this.employeeDetails.default_greeting}</p>
                      ) : (
                        <p>请输入...</p>
                      )}
                    </div>
                  )}

                  {/* 添加引用文档和推荐问题组件 */}
                  {renderReferences()}
                  {renderSuggestedQuestions()}
                  {renderQuickQuestions()}
                </div>
              )}
            </div>

            <div class="recording-section">
              <div class="recording-container">
                {renderTextInputArea()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
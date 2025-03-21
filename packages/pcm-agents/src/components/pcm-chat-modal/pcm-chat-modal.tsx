import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';

@Component({
  tag: 'pcm-chat-modal',
  styleUrl: 'pcm-chat-modal.css',
  shadow: true,
})
export class ChatModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '在线客服';

  /**
   * 是否显示聊天模态框
   */
  @Prop({ mutable: true }) isOpen: boolean = false;

  /**
   * 聊天消息历史
   */
  @State() messages: ChatMessage[] = [];

  /**
   * 当前输入的消息
   */
  @State() currentMessage: string = '';

  /**
   * 当发送消息时触发
   */
  @Event() messageSent: EventEmitter<string>;

  /**
   * 当模态框关闭时触发
   */
  @Event() modalClosed: EventEmitter<void>;

  /**
   * 应用图标URL
   */
  @Prop() icon?: string;

  /**
   * 聊天框窗口的布局风格
   */
  @Prop() layout: 'mobile' | 'pc' = 'pc';

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
   * 机器人ID
   */
  @Prop() botId: string;

  /**
   * 会话ID
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
  private readonly SCROLL_THRESHOLD = 100;

  @State() isLoadingHistory: boolean = false;

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  // 添加新的 Event
  @Event() streamComplete: EventEmitter<{
    conversation_id: string;
    event: string;
    message_id: string;
    id: string;
  }>;

  @State() suggestedQuestions: string[] = [];
  @State() suggestedQuestionsLoading: boolean = false;
  private stopSuggestedQuestionsRef: { current: boolean } = { current: false };

  @State() selectedFile: File | null = null;

  private handleClose = () => {
    this.isOpen = false;
    this.modalClosed.emit();
  };

  private handleInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.currentMessage = input.value;
  };

  private async getSuggestedQuestions(messageId: string) {
    this.stopSuggestedQuestionsRef.current = false;
    this.suggestedQuestionsLoading = true;

    try {
      const response = await sendHttpRequest({
        url: `https://pcm_api.ylzhaopin.com/share/messages/${messageId}/suggested`,
        params: {
          bot_id: this.botId
        }
      });

      if (this.stopSuggestedQuestionsRef.current) return;

      if (response.isOk && response.data?.result === 'success') {
        this.suggestedQuestions = response.data?.data || [];
      }
    } catch (error) {
      console.error('获取问题建议失败:', error);
    } finally {
      this.suggestedQuestionsLoading = false;
    }
  }

  private handleStopSuggestedQuestions = () => {
    this.suggestedQuestions = [];
    this.stopSuggestedQuestionsRef.current = true;
  };

  private handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  };

  private handleUploadClick = () => {
    const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    fileInput?.click();
  };

  private clearSelectedFile = () => {
    this.selectedFile = null;
    const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  private async sendMessageToAPI(message: string) {
    this.handleStopSuggestedQuestions();
    console.log('开始发送消息:', message);
    this.isLoading = true;
    let answer = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 创建新的消息对象时确保必填字段都有值
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,  // id 必填
      time: time,                // time 必填
      query: message,
      answer: '',
      bot_id: this.botId,
      isStreaming: true,
      conversation_id: this.conversationId,
      parent_message_id: this.messages.length > 0
        ? this.messages[this.messages.length - 1].id
        : "00000000-0000-0000-0000-000000000000",
      inputs: {},
      message_files: [],
      feedback: null,
      retriever_resources: [],
      agent_thoughts: [],
      status: "normal",
      error: null
    };


    // 设置当前流式消息
    this.currentStreamingMessage = newMessage;

    this.shouldAutoScroll = true;
    // 滚动到底部
    this.scrollToBottom();

    await sendSSERequest({
      url: `https://pcm_api.ylzhaopin.com/share/chat-messages`,
      method: 'POST',
      data: {
        bot_id: this.botId,
        response_mode: 'streaming',
        conversation_id: this.conversationId,
        query: message,
        user: '1234567890'
      },
      onMessage: (data) => {
        console.log('收到Stream数据:', data);

        if (data.conversation_id && !this.conversationId) {
          this.conversationId = data.conversation_id;
          this.updateUrlWithConversationId(data.conversation_id);
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
        this.messages = [...this.messages, {
          ...newMessage,
          answer: '抱歉，发生了错误，请稍后再试。',
          error: error,
          isStreaming: false
        }];
        this.currentStreamingMessage = null;
        this.isLoading = false;
      },
      onComplete: () => {
        console.log('请求完成');
        this.isLoading = false;
        this.messages = [...this.messages, this.currentStreamingMessage];

        // 在消息完成后获取问题建议
        if (this.currentStreamingMessage) {
          this.getSuggestedQuestions(this.currentStreamingMessage.conversation_id);
        }

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
    console.log('chatHistory', chatHistory);
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

  private updateUrlWithConversationId(conversationId: string) {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('conversation_id')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('conversation_id', conversationId);
      window.history.replaceState({}, '', newUrl);
    }
  }

  private handleSendMessage = () => {
    if (!this.currentMessage.trim() || this.isLoading) return;

    // 触发消息发送事件
    this.messageSent.emit(this.currentMessage);

    // 发送消息到API
    this.sendMessageToAPI(this.currentMessage);

    // 清空输入框
    this.currentMessage = '';

    // 保持输入框焦点
    const inputElement = this.hostElement.shadowRoot?.querySelector('input');
    inputElement?.focus();
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendMessage();
    }
  };

  // 修改 loadHistoryMessages 方法
  private async loadHistoryMessages() {
    if (!this.conversationId) return;

    this.isLoadingHistory = true;

    try {
      const response = await sendHttpRequest({
        url: `https://pcm_api.ylzhaopin.com/share/messages`,
        params: {
          conversation_id: this.conversationId,
          bot_id: this.botId,
          user: '1234567890',
          limit: 20
        }
      });

      if (!response.isOk || !response.data) {
        throw new Error('加载历史消息失败');
      }

      // 适配新的接口返回格式
      const historyData = response.data.data || [];

      // 清空现有消息，确保不会重复
      this.currentStreamingMessage = null;
      this.messages = [];

      const formattedMessages: ChatMessage[] = historyData.map(msg => {
        const time = new Date(msg.created_at * 1000);
        const timeStr = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;

        return {
          ...msg,
          time: timeStr,
          bot_id: this.botId,
          isStreaming: false,
          status: msg.status === 'error' ? 'error' : 'normal' as const
        };
      });

      this.messages = formattedMessages;

      // 使用 requestAnimationFrame 确保在下一帧渲染后滚动
      requestAnimationFrame(() => {
        this.shouldAutoScroll = true;
        this.scrollToBottom();
      });

    } catch (error) {
      console.error('加载历史消息失败:', error);
    } finally {
      this.isLoadingHistory = false;
    }
  }


  // 添加 isOpen 的 watch 方法
  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      if (this.conversationId) {
        await this.loadHistoryMessages();
      }
    }
  }

  render() {
    if (!this.isOpen) return null;

    const modalStyle = {
      zIndex: String(this.zIndex)
    };

    const containerClass = {
      'modal-container': true,
      'mobile-layout': this.layout === 'mobile',
      'pc-layout': this.layout === 'pc'
    };

    return (
      <div class="modal-overlay" style={modalStyle}>
        <div class={containerClass}>
          {this.isShowHeader && (
            <div class="modal-header">
              <div class="header-left">
                {this.icon && <img src={this.icon} class="header-icon" alt="应用图标" />}
                <h3>{this.modalTitle}</h3>
              </div>
              {this.isNeedClose && (
                <button class="close-button" onClick={this.handleClose}>
                  <span>×</span>
                </button>
              )}
            </div>
          )}

          <div class="chat-history" onScroll={this.handleScroll}>
            {this.isLoadingHistory ? (
              <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>加载历史消息中...</p>
              </div>
            ) : (
              <>
                {this.messages.map((message) => (
                  <div id={`message_${message.id}`} key={message.id}>
                    <pcm-chat-message
                      message={message}
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
                      message={this.currentStreamingMessage}
                    ></pcm-chat-message>
                  </div>
                )}
                {this.messages.length === 0 && !this.currentStreamingMessage && (
                  <div class="empty-state">
                    <p>请输入消息</p>
                  </div>
                )}
              </>
            )}

            {this.suggestedQuestionsLoading ? (
              <div class="loading-suggestions">
                <div class="loading-spinner-small"></div>
              </div>
            ) : (
              this.suggestedQuestions.length > 0 && (
                <div class="suggested-questions">
                  {this.suggestedQuestions.map((question, index) => (
                    <div
                      key={index}
                      class="suggested-question"
                      onClick={() => {
                        this.currentMessage = question;
                        this.handleSendMessage();
                      }}
                    >
                      {question}
                      <span class="arrow-right">→</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 添加文件预览区域 */}
          {this.selectedFile && (
            <div class="file-preview">
              <div class="file-info">
                <span class="file-name" title={this.selectedFile.name}>
                  {this.selectedFile.name}
                </span>
                <button class="remove-file" onClick={this.clearSelectedFile}>
                  ×
                </button>
              </div>
            </div>
          )}

          <div class="message-input">
            <input
              type="file"
              class="file-input"
              onChange={this.handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              class="upload-button"
              onClick={this.handleUploadClick}
              title="上传文件"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m0-16l-4 4m4-4l4 4"
                />
              </svg>
            </button>

            <div class="input-wrapper">
              <input
                type="text"
                placeholder="请输入消息..."
                value={this.currentMessage}
                onInput={this.handleInputChange}
                onKeyDown={this.handleKeyDown}
                disabled={this.isLoading}
              />
            </div>

            <button
              class="send-button"
              onClick={() => this.handleSendMessage()}
              disabled={(!this.currentMessage.trim() && !this.selectedFile) || this.isLoading}
            >
              {this.isLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    );
  }
} 
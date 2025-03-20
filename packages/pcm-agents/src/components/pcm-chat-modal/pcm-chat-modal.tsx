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
   * 消息事件类型
   */
  @Prop() messageEvent: string = 'message';

  /**
   * 请求URL前缀
   */
  @Prop() apiBaseUrl: string = '';

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

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  private handleClose = () => {
    this.isOpen = false;
    this.modalClosed.emit();
  };

  private handleInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.currentMessage = input.value;
  };

  private async sendMessageToAPI(message: string) {
    console.log('开始发送消息:', message);
    this.isLoading = true;
    let answer = '';
    let tempConversationId = this.conversationId;

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

    // 滚动到底部
    this.scrollToBottom();

    await sendSSERequest({
      url: `http://192.168.17.194:8000/share/chat-messages`,
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

        if (data.conversation_id && !tempConversationId) {
          tempConversationId = data.conversation_id;
          this.conversationId = data.conversation_id;
          this.updateUrlWithConversationId(data.conversation_id);
        }

        if (data.event === this.messageEvent) {
          const inputMessage: UserInputMessageType = { message: message };
          convertWorkflowStreamNodeToMessageRound(this.messageEvent, inputMessage, data);

          if (data.event === 'agent_message' || data.event === 'message') {
            if (data.answer) {
              answer += data.answer;
              const updatedMessage: ChatMessage = {
                ...this.currentStreamingMessage,
                answer,
                isStreaming: true
              };
              this.currentStreamingMessage = updatedMessage;
              this.scrollToBottom(); // 每次更新消息时滚动
            }
          }
          if (data.event === 'workflow_finished') {
            console.log('工作流完成，最终答案:', answer);
            // 完成时将消息添加到消息列表
            if (this.currentStreamingMessage) {
              const finalMessage = {
                ...this.currentStreamingMessage,
                answer,
                isStreaming: false
              };
              this.messages = [...this.messages, finalMessage];
              this.currentStreamingMessage = null;
              this.scrollToBottom(); // 消息完成时滚动
            }
          }
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

  // 添加 componentDidRender 生命周期方法
  componentDidRender() {
    if (this.shouldAutoScroll && this.isOpen) {
        requestAnimationFrame(() => {
            const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
            if (chatHistory) {
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        });
    }
  }

  private updateUrlWithConversationId(conversationId: string) {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('task_id')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('task_id', conversationId);
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

    try {
      const response = await sendHttpRequest({
        url: `${this.apiBaseUrl || 'http://192.168.17.194:8000'}/share/messages`,
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

      const historyData = response.data;

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
      
      // 等待DOM更新后滚动到底部
      requestAnimationFrame(() => {
        this.shouldAutoScroll = true;
        this.scrollToBottom();
      });
    } catch (error) {
      console.error('加载历史消息失败:', error);
    }
  }

  // 修改 addTestMessages 方法
  private addTestMessages() {
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 模拟API返回的数据结构
    const testData = [
      {
        id: "013eed0e-6100-46c1-98cf-ab3b9ee72ae2",
        conversation_id: "f2f00afe-82f8-460e-9603-6327ea777fc4",
        parent_message_id: "00000000-0000-0000-0000-000000000000",
        query: "你好，请问有什么可以帮助你的吗？",
        answer: "您好！我是您的智能助手，很高兴为您服务。我可以回答您的问题、提供信息或帮助您解决问题。请问您有什么需要我帮助的吗？",
        created_at: Math.floor(Date.now() / 1000) - 120,
        inputs: {
          answer: "您好！我是您的智能助手，很高兴为您服务。我可以回答您的问题、提供信息或帮助您解决问题。请问您有什么需要我帮助的吗？"
        },
        message_files: [],
        feedback: null,
        retriever_resources: [],
        agent_thoughts: [],
        status: "normal",
        error: null
      },
      {
        id: "425c43e5-0b85-43b7-b5d6-854e1e2df48c",
        conversation_id: "f2f00afe-82f8-460e-9603-6327ea777fc4",
        parent_message_id: "013eed0e-6100-46c1-98cf-ab3b9ee72ae2",
        query: "我想了解一下你的功能",
        answer: "作为一个智能助手，我有以下功能：\n\n1. **回答问题**：我可以回答各种常见问题\n2. **提供信息**：我可以提供各类知识和信息\n3. **文本处理**：我可以帮助撰写、编辑和优化文本\n4. **创意支持**：我可以提供创意建议和灵感\n5. **问题解决**：我可以帮助分析和解决各种问题\n\n您有什么特定的需求吗？我很乐意为您提供帮助！",
        created_at: Math.floor(Date.now() / 1000) - 60,
        inputs: {
          answer: "作为一个智能助手，我有以下功能：\n\n1. **回答问题**：我可以回答各种常见问题\n2. **提供信息**：我可以提供各类知识和信息\n3. **文本处理**：我可以帮助撰写、编辑和优化文本\n4. **创意支持**：我可以提供创意建议和灵感\n5. **问题解决**：我可以帮助分析和解决各种问题\n\n您有什么特定的需求吗？我很乐意为您提供帮助！"
        },
        message_files: [],
        feedback: null,
        retriever_resources: [],
        agent_thoughts: [],
        status: "normal",
        error: null
      }
    ];

    // 添加时间和bot_id属性
    this.messages = testData.map(msg => ({
      ...msg,
      time,
      bot_id: this.botId,
      status: msg.status === 'error' ? 'error' : 'normal' as const
    }));

    // 等待 DOM 更新
    requestAnimationFrame(() => {
      this.shouldAutoScroll = true;
      this.scrollToBottom();
    });
  }


  // 添加 isOpen 的 watch 方法
  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      if (this.conversationId) {
        await this.loadHistoryMessages();
      } else {
        this.addTestMessages();
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
          </div>

          <div class="message-input">
            <input
              type="text"
              placeholder="请输入消息..."
              value={this.currentMessage}
              onInput={this.handleInputChange}
              onKeyDown={this.handleKeyDown}
              disabled={this.isLoading}
            />
            <button
              class="send-button"
              onClick={this.handleSendMessage}
              disabled={!this.currentMessage.trim() || this.isLoading}
            >
              {this.isLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    );
  }
} 
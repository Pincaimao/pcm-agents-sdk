import { Component, Prop, h, State, Event, EventEmitter, Element } from '@stencil/core';
import showdown from 'showdown';

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
  @State() messages: { text: string; isUser: boolean; time: string }[] = [];

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

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  // 添加 Markdown 转换器实例
  private converter: showdown.Converter;

  constructor() {
    this.converter = new showdown.Converter({
      simplifiedAutoLink: true,
      strikethrough: true,
      tables: true,
      tasklists: true,
      emoji: true
    });
  }

  private handleClose = () => {
    this.isOpen = false;
    this.modalClosed.emit();
  };

  private handleInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    this.currentMessage = input.value;
  };

  private handleSendMessage = () => {
    if (!this.currentMessage.trim()) return;

    // 添加用户消息到历史记录
    this.addMessage(this.currentMessage, true);
    
    // 触发消息发送事件
    this.messageSent.emit(this.currentMessage);
    
    // 清空输入框
    this.currentMessage = '';
    
    // 保持输入框焦点
    const inputElement = this.hostElement.shadowRoot?.querySelector('input');
    inputElement?.focus();
    
    // 模拟客服回复
    setTimeout(() => {
      this.addMessage('### 你好！\n\n这是一个 **Markdown** 格式的消息。\n\n- 支持列表\n- 支持代码 `console.log("Hello")`\n\n[了解更多](https://www.example.com)', false);
    }, 1000);
  };

  private addMessage(text: string, isUser: boolean) {
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    this.messages = [
      ...this.messages,
      { text, isUser, time }
    ];
    
    // 使用 hostElement 来查找聊天历史元素
    setTimeout(() => {
      const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
      console.log('chatHistory:', chatHistory);
      
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    }, 100);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendMessage();
    }
  };

  // 修改渲染消息的部分
  private renderMessageContent(message: { text: string; isUser: boolean; time: string }) {
    if (message.isUser) {
      return <p>{message.text}</p>;
    }
    
    // 对客服消息进行 Markdown 渲染
    const htmlContent = this.converter.makeHtml(message.text);
    return <div innerHTML={htmlContent}></div>;
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
          
          <div class="chat-history">
            {this.messages.map((message) => (
              <div class={`message ${message.isUser ? 'user-message' : 'agent-message'}`}>
                <div class="message-content">
                  {this.renderMessageContent(message)}
                  <span class="message-time">{message.time}</span>
                </div>
              </div>
            ))}
            {this.messages.length === 0 && (
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
            />
            <button 
              class="send-button" 
              onClick={this.handleSendMessage}
              disabled={!this.currentMessage.trim()}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    );
  }
} 
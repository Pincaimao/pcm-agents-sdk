export interface MessageOptions {
  content: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

class MessageService {
  private _container: HTMLDivElement | null = null;

  private getContainer(): HTMLDivElement {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'pcm-message-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  }

  private create(options: MessageOptions): HTMLElement {
    const messageElement = document.createElement('pcm-message');
    messageElement.setAttribute('content', options.content);
    
    if (options.type) {
      messageElement.setAttribute('type', options.type);
    }
    
    if (options.duration !== undefined) {
      messageElement.setAttribute('duration', options.duration.toString());
    }
    
    const container = this.getContainer();
    container.appendChild(messageElement);
    
    return messageElement;
  }

  success(content: string | MessageOptions, duration?: number): void {
    const options: MessageOptions = typeof content === 'string' 
      ? { content, type: 'success', duration } 
      : { ...content, type: 'success' };
    
    this.create(options);
  }

  error(content: string | MessageOptions, duration?: number): void {
    const options: MessageOptions = typeof content === 'string' 
      ? { content, type: 'error', duration } 
      : { ...content, type: 'error' };
    
    this.create(options);
  }

  info(content: string | MessageOptions, duration?: number): void {
    const options: MessageOptions = typeof content === 'string' 
      ? { content, type: 'info', duration } 
      : { ...content, type: 'info' };
    
    this.create(options);
  }

  warning(content: string | MessageOptions, duration?: number): void {
    const options: MessageOptions = typeof content === 'string' 
      ? { content, type: 'warning', duration } 
      : { ...content, type: 'warning' };
    
    this.create(options);
  }

  // 清除所有消息
  clear(): void {
    if (this._container) {
      this._container.innerHTML = '';
    }
  }
}

// 创建单例实例
export const Message = new MessageService(); 
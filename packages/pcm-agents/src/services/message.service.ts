export interface MessageOptions {
  content: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  key?: string; // 消息唯一标识
}

interface MessageInstance {
  id: string;
  element: HTMLElement;
  timer?: number;
  options: MessageOptions;
}

class MessageService {
  private _container: HTMLDivElement | null = null;
  private _instances: Map<string, MessageInstance> = new Map();
  private _maxCount: number = 2; // 最大同时显示数量
  private _idCounter: number = 0;

  private getContainer(): HTMLDivElement {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'pcm-message-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  }

  private generateId(): string {
    return `pcm-message-${++this._idCounter}`;
  }

  private getMessageKey(options: MessageOptions): string {
    // 如果提供了key，使用key；否则使用content+type作为key
    return options.key || `${options.content}-${options.type}`;
  }

  private removeOldestMessage(): void {
    if (this._instances.size >= this._maxCount) {
      const firstKey = this._instances.keys().next().value;
      if (firstKey) {
        this.removeMessage(firstKey);
      }
    }
  }

  private removeMessage(key: string): void {
    const instance = this._instances.get(key);
    if (instance) {
      // 清除定时器
      if (instance.timer) {
        clearTimeout(instance.timer);
      }
      
      // 移除DOM元素
      if (instance.element && instance.element.parentNode) {
        instance.element.parentNode.removeChild(instance.element);
      }
      
      // 从实例映射中移除
      this._instances.delete(key);
    }
  }

  private create(options: MessageOptions): HTMLElement {
    const messageKey = this.getMessageKey(options);
    
    // 如果相同key的消息已存在，先移除
    if (this._instances.has(messageKey)) {
      this.removeMessage(messageKey);
    }
    
    // 检查数量限制
    this.removeOldestMessage();
    
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
    
    // 创建实例记录
    const id = this.generateId();
    const instance: MessageInstance = {
      id,
      element: messageElement,
      options: { ...options }
    };
    
    // 设置自动移除定时器
    const duration = options.duration ?? 3000;
    if (duration > 0) {
      instance.timer = window.setTimeout(() => {
        this.removeMessage(messageKey);
      }, duration);
    }
    
    // 保存实例
    this._instances.set(messageKey, instance);
    
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
    this._instances.forEach((_, key) => {
      this.removeMessage(key);
    });
  }

  // 清除指定key的消息
  remove(key: string): void {
    this.removeMessage(key);
  }

  // 设置最大显示数量
  setMaxCount(count: number): void {
    this._maxCount = Math.max(1, count);
  }

  // 销毁服务（清理资源）
  destroy(): void {
    this.clear();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
      this._container = null;
    }
  }
}

// 创建单例实例
export const Message = new MessageService(); 
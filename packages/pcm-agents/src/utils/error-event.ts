export interface ErrorEventDetail {
  source: string;
  error: any;
  message: string;
  type: 'api' | 'ui' | 'network' | 'other';
}

export class ErrorEventBus {
  /**
   * 触发错误事件
   */
  static emitError(detail: ErrorEventDetail): void {
    const event = new CustomEvent('pcm-error', {
      bubbles: true,
      composed: true,
      detail
    });
    document.dispatchEvent(event);
  }

  /**
   * 添加错误事件监听器
   */
  static addErrorListener(callback: (detail: ErrorEventDetail) => void): () => void {
    const handler = (event: CustomEvent<ErrorEventDetail>) => {
      callback(event.detail);
    };
    
    document.addEventListener('pcm-error', handler as EventListener);
    
    // 返回移除监听器的函数
    return () => {
      document.removeEventListener('pcm-error', handler as EventListener);
    };
  }
} 
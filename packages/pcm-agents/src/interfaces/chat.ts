export interface ChatMessage {
  /**
   * 消息唯一标识
   */
  id: string;
  
  /**
   * 用户输入的消息内容
   */
  query?: string;
  
  /**
   * AI助手的回复内容
   */
  answer?: string;
  
  /**
   * 消息时间，格式为 "HH:mm"
   */
  time: string;
  
  /**
   * 会话ID
   */
  conversation_id?: string;
  
  /**
   * 是否正在流式输出
   */
  isStreaming?: boolean;
  
  /**
   * 输入参数
   */
  inputs?: Record<string, any>;
  
  /**
   * 消息状态
   */
  status?: 'normal' | 'error';
  
  /**
   * 错误信息
   */
  error?: any;
} 
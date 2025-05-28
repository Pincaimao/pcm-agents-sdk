export interface ChatMessage {
  /**
   * 消息唯一标识
   */
  id: string;
  
  /**
   * 会话ID
   */
  conversation_id?: string;
  
  /**
   * 父消息ID
   */
  parent_message_id?: string;
  
  /**
   * 输入参数
   */
  inputs?: Record<string, any>;
  
  /**
   * 用户输入的消息内容
   */
  query: string;
  
  /**
   * AI助手的回复内容
   */
  answer: string;
  
  /**
   * 消息附件
   */
  message_files?: Array<any>;
  
  /**
   * 反馈
   */
  feedback?: Record<string, any>;
  
  /**
   * 检索资源
   */
  retriever_resources?: Array<any>;
  
  /**
   * 创建时间
   */
  created_at?: string;
  
  /**
   * 代理思考过程
   */
  agent_thoughts?: Array<any>;
  
  /**
   * 消息状态
   */
  status: "normal" | "error";
  
  /**
   * 错误信息
   */
  error: any;
  
  /**
   * 消息时间，格式为 "HH:mm"
   */
  time?: string;
  
  /**
   * 是否正在流式输出
   */
  isStreaming?: boolean;

  /**
   * 是否显示重试按钮
   */
  showRetryButton?: boolean;
} 
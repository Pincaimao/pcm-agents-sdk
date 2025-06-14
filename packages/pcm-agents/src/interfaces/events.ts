/**
 * 流式输出完成事件的数据类型
 */
export interface StreamCompleteEventData {
  conversation_id: string;
  event: string;
  message_id: string;
  id: string;
}

/**
 * 会话开始事件的数据类型
 */
export interface ConversationStartEventData {
  conversation_id: string;
  event: string;
  message_id: string;
  id: string;
}

/**
 * 聊天完成事件的数据类型
 */
export interface InterviewCompleteEventData {
  conversation_id: string;
  current_question_number?: number;
  total_questions?: number;
  ai_response?: string;
}

/**
 * 录制错误事件的数据类型
 */
export interface RecordingErrorEventData {
  type: string;
  message: string;
  details?: any;
}

/**
 * 录制状态变化事件的数据类型
 */
export interface RecordingStatusChangeEventData {
  status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
  details?: any;
}

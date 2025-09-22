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

/**
 * 任务创建完成事件的数据类型
 */
export interface TaskCreatedEventData {
  task_id: number;
  job_description: string;
  evaluation_criteria: Array<{
    name: string;
    value: number;
    description: string;
  }>;
  create_time: string;
}

/**
 * 简历分析开始事件的数据类型
 */
export interface ResumeAnalysisStartEventData {
  task_id: number;
  resume_count: number;
  resume_files: Array<{
    file_name: string;
    file_url: string;
  }>;
}

/**
 * 简历分析完成事件的数据类型
 */
export interface ResumeAnalysisCompleteEventData {
  task_id: number;
  total_resumes: number;
  analyzed_resumes: number;
  failed_resumes: number;
  average_score: number;
  highest_score: number;
}


/**
 * 任务切换事件的数据类型
 */
export interface TaskSwitchEventData {
  previous_task_id?: number;
  current_task_id: number;
  task_title?: string;
  switch_time: string;
}


/**
 * 简历删除事件的数据类型
 */
export interface ResumeDeletedEventData {
  task_id: number;
  resume_id: string;
  resume_name: string;
  delete_time: string;
}


export interface ChatMessage {
  id: string;
  query?: string;
  answer?: string;
  time: string;
  conversation_id?: string;
  created_at?: number;
  isStreaming?: boolean;
  bot_id?: string;
  parent_message_id?: string;
  inputs?: Record<string, any>;
  message_files?: Array<any>;
  feedback?: any;
  retriever_resources?: Array<any>;
  agent_thoughts?: Array<any>;
  status?: 'normal' | 'error';
  error?: any;
} 
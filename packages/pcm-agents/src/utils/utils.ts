export function format(first?: string, middle?: string, last?: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

// 添加类型定义
export interface UserInputMessageType {
  message: string;
  [key: string]: any;
}

export interface WorkFlowNode {
  message_id?: string;
  conversation_id?: string;
  created_at?: string;
  event?: string;
  answer?: string;
  data?: {
    outputs?: {
      answer?: string;
    };
    status?: string;
    error?: any;
  };
}

export interface MessageRound extends UserInputMessageType {
  id?: string;
  conversation_id?: string;
  created_at?: string;
  answer?: string;
  status?: string;
  error?: any;
}

/**
 * 将工作流节点转换为消息轮次
 * @param message_event 消息事件类型
 * @param inputMessage 用户输入消息
 * @param streamNode 工作流节点
 * @returns 消息轮次
 */
export const convertWorkflowStreamNodeToMessageRound = (
  message_event: string,
  inputMessage: UserInputMessageType,
  streamNode: WorkFlowNode,
): MessageRound => {
  const messageRound: MessageRound = {
    ...inputMessage,
  };
  if (message_event === 'workflow_finished') messageRound.answer = streamNode.data?.outputs?.answer;
  if (message_event === 'agent_message' || message_event === 'message') messageRound.answer = streamNode?.answer;
  messageRound.id = streamNode.message_id;
  messageRound.conversation_id = streamNode.conversation_id;
  messageRound.created_at = streamNode.created_at;
  messageRound.status = streamNode.data?.status;
  messageRound.error = streamNode.data?.error;
  return messageRound;
};

/**
 * SSE 流式请求配置接口
 */
export interface SSERequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

/**
 * 发送 SSE 流式请求
 * @param config 请求配置
 * @returns Promise<void>
 */
export const sendSSERequest = async (config: SSERequestConfig): Promise<void> => {
  const { url, method, headers = {}, data, onMessage, onError, onComplete } = config;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        ...headers
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');
    
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 处理缓冲区中的完整消息
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.substring(5).trim();
            if (!jsonStr) continue;
            
            const data = JSON.parse(jsonStr);
            onMessage?.(data);
          } catch (e) {
            console.error('解析 SSE 数据错误:', e, '原始数据:', line);
          }
        }
      }
    }
    
    onComplete?.();
  } catch (error) {
    console.error('SSE 请求错误:', error);
    onError?.(error);
  }
};

/**
 * HTTP请求配置接口
 */
export interface HttpRequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
}

/**
 * HTTP响应接口
 */
export interface HttpResponse<T = any> {
  isOk: boolean;
  data?: T;
  error?: any;
}

/**
 * 发送HTTP请求
 * @param config 请求配置
 * @returns Promise<HttpResponse>
 */
export const sendHttpRequest = async <T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> => {
  const { url, method = 'GET', headers = {}, params = {}, data } = config;
  
  try {
    // 构建URL和查询参数
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const requestUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(requestUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    return {
      isOk: true,
      data: responseData
    };
  } catch (error) {
    console.error('HTTP请求错误:', error);
    return {
      isOk: false,
      error
    };
  }
};

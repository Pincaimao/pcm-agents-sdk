/**
 * API域名配置
 */
// export const API_DOMAIN = 'http://127.0.0.1:8001';
export const API_DOMAIN = 'https://tagents.ylzhaopin.com/agents/api';
// export const API_DOMAIN = 'https://www.pincaimao.com/agents/api';


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
    // 使用 API_DOMAIN 拼接完整的请求URL
    const requestUrl = `${API_DOMAIN}${url}`;
    
    const response = await fetch(requestUrl, {
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
  formData?: FormData;  // 添加FormData支持
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

/**
 * 统一的API响应接口
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * HTTP响应接口
 */
export interface HttpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  message?: string;
}

/**
 * 发送HTTP请求
 * @param config 请求配置
 * @returns Promise<HttpResponse>
 */
export const sendHttpRequest = async <T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> => {
  const { url, method = 'GET', headers = {}, params = {}, data, formData, onMessage } = config;
  
  try {
    // 构建URL和查询参数
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    // 使用 API_DOMAIN 拼接完整的请求URL
    let requestUrl = `${API_DOMAIN}${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // 创建请求配置对象
    const requestConfig: RequestInit = {
      method,
      headers: formData ? { ...headers } : {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // 处理请求体
    if (formData) {
      // 如果提供了FormData，直接使用
      requestConfig.body = formData;
    } else if (method !== 'GET' && method !== 'HEAD' && data) {
      // 否则，如果是非GET/HEAD请求且有data，将其JSON序列化
      requestConfig.body = JSON.stringify(data);
    }

    // 如果是 GET 方法且有 data，将其作为查询参数添加到 URL
    if (method === 'GET' && data) {
      const dataParams = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          dataParams.append(key, String(value));
        }
      });
      requestUrl += (queryParams.toString() ? '&' : '?') + dataParams.toString();
    }

    const response = await fetch(requestUrl, requestConfig);
    const responseData: ApiResponse<T> = await response.json();
    
    // 调用 onMessage 回调
    if (onMessage) {
      onMessage(responseData);
    }
    
    // 检查响应状态
    if (!response.ok) {
      console.error(`HTTP错误: ${response.status} ${response.statusText}`);
      return {
        success: false,
        message: responseData.message || `HTTP错误: ${response.status}`,
        error: responseData
      };
    }
    
    // 检查业务状态码
    if (responseData.code !== 0) {
      console.error(`API错误: ${responseData.message}`);
      return {
        success: false,
        message: responseData.message,
        error: responseData
      };
    }
    
    // 直接返回data
    return {
      success: true,
      data: responseData.data
    };
  } catch (error) {
    console.error('HTTP请求错误:', error);
    if (config.onError) {
      config.onError(error);
    }
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : '未知错误'
    };
  } finally {
    if (config.onComplete) {
      config.onComplete();
    }
  }
};



/**
 * 文件上传响应数据接口
 */
export interface FileUploadResponse {
  /** 文件在对象存储中的唯一标识符 */
  cos_key: string;
  /** 文件名称 */
  file_name: string;
  /** 文件大小（带单位的字符串，如 "1.5MB"） */
  file_size: string;
  /** 文件的预签名URL */
  presigned_url: string;
  /** 文件扩展名 */
  ext: string;
}

/**
 * 通过后端API上传文件
 * @param file 要上传的文件
 * @param params 可选的额外参数
 * @param headers 可选的请求头
 * @returns Promise 包含上传结果
 */
export const uploadFileToBackend = async (
  file: File,
  headers?: Record<string, string>,
  params?: Record<string, any>
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // 添加额外参数到 formData
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
  }
  
  try {
    const response = await sendHttpRequest<{cos_key: string, file_name: string, file_size: string, presigned_url: string, ext: string}>({
      url: '/sdk/v1/files/upload',
      method: 'POST',
      headers: {
        ...headers
      },
      formData
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || '文件上传失败');
    }
    
    return response.data;
  } catch (error) {
    console.error('文件上传错误:', error);
    throw error;
  }
};

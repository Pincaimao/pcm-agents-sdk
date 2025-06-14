// 导入环境变量
import { API_DOMAIN } from './env';
import { authStore } from '../../store/auth.store'; // 导入 authStore
import { configStore } from '../../store/config.store';

export { API_DOMAIN };

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
export const convertWorkflowStreamNodeToMessageRound = (message_event: string, inputMessage: UserInputMessageType, streamNode: WorkFlowNode): MessageRound => {
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
 * 同步延迟函数，阻塞主线程指定的毫秒数
 * @param ms 延迟的毫秒数
 */
const syncDelay = (ms: number) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // 空循环，阻塞主线程
  }
};

/**
 * 获取有效的 token，从 authStore 中获取
 * @returns string 有效的 token
 */
export const getEffectiveToken = (): string => {
  return authStore.getToken() || '';
};

/**
 * 请求超时时间（毫秒）
 */
const REQUEST_TIMEOUT = 3 * 60 * 1000; // 3分钟

/**
 * 创建带超时的 fetch 请求
 * @param url 请求URL
 * @param options fetch选项
 * @param timeout 超时时间（毫秒）
 * @returns Promise<Response>
 */
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = REQUEST_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接后重试');
    }
    throw error;
  }
};

/**
 * 发送 SSE 流式请求
 * @param config 请求配置
 * @param isRetry 是否为重试请求
 * @returns Promise<void>
 */
export const sendSSERequest = async (config: SSERequestConfig, isRetry = false): Promise<void> => {
  const { url, method, headers = {}, data, onMessage, onError, onComplete } = config;

  try {
    // 使用 API_DOMAIN 拼接完整的请求URL
    const requestUrl = `${API_DOMAIN}${url}`;

    // 如果没有提供 Authorization 头，则从 authStore 获取 token
    if (!headers['authorization'] && !headers['Authorization']) {
      const token = getEffectiveToken();
      if (token) {
        headers['authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetchWithTimeout(requestUrl, {
      method,
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    // 检查是否为401错误（未授权）
    if (response.status === 401) {
      // 触发全局token无效事件
      createTokenInvalidEvent();

      // 如果不是重试请求，则使用同步延迟500毫秒后重试一次
      if (!isRetry) {
        syncDelay(500); // 阻塞式延迟
        return sendSSERequest(config, true);
      }
    }

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
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

    // 如果是超时错误且不是重试请求，则重试一次
    if (!isRetry) {
      console.log('SSE请求超时，正在重试...');
      syncDelay(1000); // 延迟1秒后重试
      return sendSSERequest(config, true);
    }

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
  formData?: FormData; // 添加FormData支持
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

// 添加一个全局事件发射器用于处理401错误
export const createTokenInvalidEvent = () => {
  const event = new CustomEvent('pcm-token-invalid', {
    bubbles: true,
    composed: true,
    detail: { timestamp: new Date().getTime() },
  });
  document.dispatchEvent(event);
};

/**
 * 发送HTTP请求
 * @param config 请求配置
 * @param isRetry 是否为重试请求
 * @returns Promise<HttpResponse>
 */
export const sendHttpRequest = async <T = any>(config: HttpRequestConfig, isRetry = true): Promise<HttpResponse<T>> => {
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
    // 如果没有提供 Authorization 头，则从 authStore 获取 token
    if (headers['authorization'] == undefined && headers['Authorization'] == undefined) {
      const token = getEffectiveToken();

      if (token) {
        headers['authorization'] = `Bearer ${token}`;
      }
    }

    // 创建请求配置对象
    const requestConfig: RequestInit = {
      method,
      headers: formData
        ? { ...headers }
        : {
            'Content-Type': 'application/json',
            ...headers,
          },
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

    const response = await fetchWithTimeout(requestUrl, requestConfig);

    // 检查是否为401错误（未授权）
    if (response.status === 401) {
      // 触发全局token无效事件
      createTokenInvalidEvent();

      // 重试请求
      if (isRetry) {
        syncDelay(500); // 阻塞式延迟
        return sendHttpRequest(config, false);
      }
    }

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
        error: responseData,
      };
    }

    // 检查业务状态码
    if (responseData.code !== 0) {
      console.error(`API错误: ${responseData.message}`);
      return {
        success: false,
        message: responseData.message,
        error: responseData,
      };
    }

    // 直接返回data
    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    console.error('HTTP请求错误:', error);

    // 如果是超时错误且允许重试，则重试一次
    if (isRetry) {
      console.log('HTTP请求超时，正在重试...');
      syncDelay(1000); // 延迟1秒后重试
      return sendHttpRequest(config, false);
    }

    if (config.onError) {
      config.onError(error);
    }
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : '未知错误',
    };
  } finally {
    if (config.onComplete) {
      config.onComplete();
    }
  }
};

/**
 * 验证API密钥
 * @param token API密钥
 * @returns Promise<boolean> 验证是否成功
 */
export const verifyApiKey = async (token: string): Promise<boolean> => {
  const response = await sendHttpRequest(
    {
      url: '/sdk/v1/user',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    false,
  );

  // 如果是401错误，同步延迟500毫秒后返回
  if (!response.success && response.error && response.error.code === 401) {
    // 执行同步延迟
    syncDelay(500);
    return false;
  } else {
    
    configStore.setItem('pcm-sdk-CUser', `${response.data.user}(${response.data.chat_user})`);
    return response.success;
  }
};

/**
 * 获取智能体信息
 * @param botId 智能体ID
 * @returns Promise<any> 智能体信息数据
 */
export const fetchAgentInfo = async (botId: string): Promise<any> => {
  if (!botId) {
    throw new Error('智能体ID不能为空');
  }

  try {
    const response = await sendHttpRequest({
      url: `/sdk/v1/agent/${botId}/info`,
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.message || '获取智能体信息失败');
    }

    return response.data;
  } catch (error) {
    console.error('获取智能体信息失败:', error);
    throw error;
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
  /** 文件扩展名 */
  ext: string;
}

/**
 * 计算文件的SHA256哈希值
 * @param file 要计算哈希值的文件
 * @returns Promise<string> 返回文件的SHA256哈希值
 */
export const calculateFileSHA256 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 带重试机制的文件上传请求
 * @param url 上传URL
 * @param file 要上传的文件
 * @param contentType 内容类型
 * @param maxRetries 最大重试次数
 * @returns Promise<Response>
 */
export const uploadFileWithRetry = async (
  url: string, 
  file: File, 
  contentType: string = 'application/octet-stream', 
  maxRetries: number = 2
): Promise<Response> => {
  let retries = 0;
  
  while (true) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'PUT',
        body: file, // 直接发送文件内容，不使用FormData
        headers: {
          'Content-Type': contentType,
        }
      });
      
      if (!response.ok) {
        throw new Error(`文件上传失败: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      retries++;
      console.error(`文件上传错误(尝试 ${retries}/${maxRetries}):`, error);
      
      // 如果已达到最大重试次数，则抛出错误
      if (retries >= maxRetries) {
        throw error;
      }
      
      // 重试前延迟，每次重试增加延迟时间
      const delayTime = 1000 * retries;
      syncDelay(delayTime);
    }
  }
};

/**
 * 通过后端API上传文件
 * @param file 要上传的文件
 * @param headers 可选的请求头
 * @param params 可选的额外参数
 * @returns Promise 包含上传结果
 */
export const uploadFileToBackend = async (file: File, headers?: Record<string, string>, params?: Record<string, any>): Promise<FileUploadResponse> => {
  try {
    // 计算文件的SHA256哈希值
    const sha256 = await calculateFileSHA256(file);

    // 第一步：获取腾讯云上传URL
    const uploadUrlResponse = await sendHttpRequest<{
      upload_url: string;
      content_type: string;
      filetype: string;
      is_deleted: number;
      cos: {
        cos_key: string;
      };
      filename: string;
      filesize: string;
    }>({
      url: '/sdk/v1/files/generate-upload-url',
      method: 'POST',
      data: {
        ...params,
        filename: file.name,
        filesize: file.size,
        sha256: sha256,
      },
      headers,
    });

    if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
      throw new Error(uploadUrlResponse.message || '获取上传URL失败');
    }
    const generate = uploadUrlResponse.data;

    if (generate.is_deleted != 1) {
      // 第二步：使用带重试机制的方法上传文件到腾讯云
      const uploadResponse = await uploadFileWithRetry(
        generate.upload_url,
        file,
        generate.content_type || 'application/octet-stream'
      );

      if (!uploadResponse.ok) {
        throw new Error(`文件上传到腾讯云失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // 第三步：标记上传完成
      sendHttpRequest({
        url: '/sdk/v1/files/mark-as-upload',
        method: 'POST',
        data: {
          cos_key: generate.cos.cos_key,
        },
        headers,
      });
    }

    // 返回文件信息
    return {
      cos_key: generate.cos.cos_key,
      file_name: generate.filename,
      file_size: generate.filesize,
      ext: generate.filetype,
    };
  } catch (error) {
    console.error('文件上传错误:', error);
    throw error;
  }
};

/**
 * 合成语音音频
 * @param text 要转换为语音的文本
 * @param token API密钥（可选，如果不提供则从 authStore 获取）
 * @param isRetry 是否为重试请求
 * @returns Promise<string> 返回音频的Blob URL
 */
export const synthesizeAudio = async (text: string, token?: string, isRetry = false): Promise<string> => {
  // 如果没有提供 token，则从 authStore 获取
  const effectiveToken = token || getEffectiveToken();

  if (!effectiveToken) {
    throw new Error('API密钥不能为空');
  }

  try {
    const response = await fetchWithTimeout(`${API_DOMAIN}/sdk/v1/tts/synthesize_audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': 'Bearer ' + effectiveToken,
      },
      body: JSON.stringify({ text }),
    });

    // 检查是否为401错误（未授权）
    if (response.status === 401) {
      // 触发全局token无效事件
      createTokenInvalidEvent();

      // 如果不是重试请求，则使用同步延迟500毫秒后重试一次
      if (!isRetry) {
        syncDelay(500); // 阻塞式延迟
        return synthesizeAudio(text, token, true);
      }
    }

    if (!response.ok) {
      throw new Error('语音合成失败');
    }

    // 获取音频数据并创建Blob URL
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('语音合成错误:', error);

    // 如果是超时错误且不是重试请求，则重试一次
    if (!isRetry) {
      console.log('语音合成请求超时，正在重试...');
      syncDelay(1000); // 延迟1秒后重试
      return synthesizeAudio(text, token, true);
    }

    throw error;
  }
};

/**
 * 获取COS文件的预签名URL
 * @param cosKey COS文件key
 * @param headers 可选的请求头
 * @returns Promise<string | null> 返回预签名URL，失败时返回null
 */
export const getCosPresignedUrl = async (cosKey: string, headers?: Record<string, string>): Promise<string | null> => {
  try {
    const response = await sendHttpRequest<{ file_url: string }>({
      url: '/sdk/v1/files/presigned-url',
      method: 'GET',
      params: {
        cos_key: cosKey
      },
      headers
    });

    if (response.success && response.data?.file_url) {
      return response.data.file_url;
    }
    return null;
  } catch (error) {
    console.error('获取预签名URL失败:', error);
    return null;
  }
};

/**
 * 获取COS文件的预览URL（用于文档预览）
 * @param cosKey COS文件key
 * @param headers 可选的请求头
 * @returns Promise<string | null> 返回预览URL，失败时返回null
 */
export const getCosPreviewUrl = async (cosKey: string, headers?: Record<string, string>): Promise<string | null> => {
  try {
    const fileUrl = await getCosPresignedUrl(cosKey, headers);
    if (fileUrl) {
      return `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}ci-process=doc-preview&copyable=1&dstType=html`;
    }
    return null;
  } catch (error) {
    console.error('获取预览URL失败:', error);
    return null;
  }
};

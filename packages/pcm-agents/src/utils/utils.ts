import COS from 'cos-js-sdk-v5';

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
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
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
    
    let requestUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // 创建请求配置对象
    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // 只有在非 GET/HEAD 请求时才添加 body
    if (method !== 'GET' && method !== 'HEAD' && data) {
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

/**
 * COS上传配置接口
 */
export interface COSUploadConfig {
  SecretId: string;
  SecretKey: string;
  SecurityToken?: string;
  StartTime?: number;
  ExpiredTime?: number;
  Bucket: string;
  Region: string;
  Key: string;
  file: File;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: COSUploadResult) => void;
  onError?: (error: any) => void;
}

/**
 * COS上传结果接口
 */
export interface COSUploadResult {
  Location: string;
  Bucket: string;
  Key: string;
  ETag: string;
  FileSize: number;
  RequestId: string;
}

/**
 * COS文件上传工具函数
 * @param config 上传配置
 * @returns Promise<COSUploadResult>
 */
export const uploadToCOS = (config: COSUploadConfig): Promise<COSUploadResult> => {
  const cos = new COS({
    SecretId: config.SecretId,
    SecretKey: config.SecretKey,
    SecurityToken: config.SecurityToken,
    StartTime: config.StartTime,
    ExpiredTime: config.ExpiredTime,
  });

  return new Promise((resolve, reject) => {
    cos.uploadFile({
      Bucket: config.Bucket,
      Region: config.Region,
      Key: config.Key,
      Body: config.file,
      SliceSize: 1024 * 1024 * 5, // 分片上传，每片5MB
      onProgress: (progressData) => {
        const percent = Math.floor((progressData.loaded / progressData.total) * 100);
        config.onProgress?.(percent);
      },
    }, (err, data) => {
      if (err) {
        config.onError?.(err);
        reject(err);
      } else {
        const result = {
          Location: data.Location,
          Bucket: config.Bucket,
          Key: config.Key,
          ETag: data.ETag,
          FileSize: config.file.size,
          RequestId: data.RequestId,
        };
        config.onSuccess?.(result);
        resolve(result);
      }
    });
  });
};

/**
 * 简单的文件类型检查工具
 * @param file 文件对象
 * @param allowedTypes 允许的文件类型数组
 * @returns boolean
 */
export const checkFileType = (file: File, allowedTypes: string[]): boolean => {
  const fileType = file.type.toLowerCase();
  return allowedTypes.some(type => fileType.includes(type));
};

/**
 * 文件大小检查工具
 * @param file 文件对象
 * @param maxSize 最大文件大小（单位：MB）
 * @returns boolean
 */
export const checkFileSize = (file: File, maxSize: number): boolean => {
  const fileSize = file.size / 1024 / 1024; // 转换为MB
  return fileSize <= maxSize;
};

/**
 * COS认证信息接口
 */
export interface COSAuthInfo {
  filename?: string;
  filetype?: string;
  filesize?: number;
  cos?: {
    region?: string;
    bucket?: string;
    cos_key?: string;
  };
  auth?: {
    expiredTime?: number;
    expiration?: string;
    requestId?: string;
    startTime?: number;
    credentials?: {
      sessionToken?: string;
      tmpSecretId?: string;
      tmpSecretKey?: string;
    };
  };
}

/**
 * 获取COS上传认证信息
 * @param file 文件对象
 * @param tags 可选的标签数组
 * @returns Promise<COSAuthInfo>
 */
export const getCosAuthInfo = async (file: File, tags?: string[]): Promise<COSAuthInfo> => {
  const data = {
    filename: file.name,
    filesize: file.size,
    filetype: file.type,
    tags,
  };

  const res = await sendHttpRequest<COSAuthInfo>({
    url: '/resource/get-cos-authkey',
    method: 'POST',
    data,
  });

  return res?.data ?? {};
};

/**
 * 文件上传回调
 * @param cos_key COS对象键值
 */
export const uploadCallback = async (cos_key: string): Promise<void> => {
  await sendHttpRequest({
    url: '/resource/mark-as-upload',
    method: 'POST',
    data: { cos_key },
  });
};

/**
 * 知识库文档上传回调
 * @param cos_key COS对象键值
 */
export const knowledgeUploadCallback = async (cos_key: string): Promise<void> => {
  await sendHttpRequest({
    url: '/knowledge_documents/mark-as-upload',
    method: 'POST',
    data: { cos_key },
  });
};

/**
 * 统一的文件上传方法
 */
export const upload = async ({
  file,
  id,
  tags,
}: {
  file: File;
  id?: string;
  tags?: string[];
}): Promise<{
  file_name: string;
  file_size: number;
  file_type: string;
  cos_key: string;
  id?: string;
}> => {
  const cosAuthInfo = await getCosAuthInfo(file, tags);
  
  if (!cosAuthInfo.auth) {
    throw new Error('获取上传秘钥失败');
  }

  return new Promise((resolve, reject) => {
    const cos = new COS({
      SecretId: cosAuthInfo.auth?.credentials?.tmpSecretId,
      SecretKey: cosAuthInfo.auth?.credentials?.tmpSecretKey,
      SecurityToken: cosAuthInfo.auth?.credentials?.sessionToken,
      StartTime: cosAuthInfo.auth?.startTime,
      ExpiredTime: cosAuthInfo.auth?.expiredTime,
    });

    cos.uploadFile({
      Bucket: cosAuthInfo.cos?.bucket,
      Region: cosAuthInfo.cos?.region,
      Key: cosAuthInfo.cos?.cos_key,
      Body: file,
      SliceSize: 1024 * 1024 * 1024,
    }, async (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
         
          await uploadCallback(cosAuthInfo.cos?.cos_key ?? '');
          
          resolve({
            ...data,
            cos_key: cosAuthInfo.cos?.cos_key ?? '',
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            id,
          });
        } catch (error) {
          reject(error);
        }
      }
    });
  });
};

/**
 * 通过后端API上传文件
 * @param file 要上传的文件
 * @returns Promise 包含上传结果
 */
export const uploadFileToBackend = async (file: File): Promise<{id: string, name: string, size: number, type: string}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('https://pcm_api.ylzhaopin.com/external/v1/files/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (result.code !== 0 || !result.data) {
      throw new Error(result.message || '文件上传失败');
    }
    
    return {
      id: result.data.id,
      name: result.data.name || file.name,
      size: result.data.size || file.size,
      type: result.data.type || file.type
    };
  } catch (error) {
    console.error('文件上传错误:', error);
    throw error;
  }
};

import { Component, Prop, h, State, Event, EventEmitter, Element } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest, uploadFileToBackend, API_DOMAIN } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';

@Component({
  tag: 'pcm-app-chat-modal',
  styleUrl: 'pcm-app-chat-modal.css',
  shadow: true,
})
export class ChatAPPModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '在线客服';

  /**
   * API鉴权密钥
   */
  @Prop({ attribute: 'api-key' }) apiKey: string = '';

  /**
   * 是否显示聊天模态框
   */
  @Prop({ mutable: true }) isOpen: boolean = false;

  /**
   * 聊天消息历史
   */
  @State() messages: ChatMessage[] = [];


  /**
   * 当点击模态框关闭时触发
   */
  @Event() modalClosed: EventEmitter<void>;

  /**
   * 应用图标URL
   */
  @Prop() icon?: string;

  /**
   * 聊天框的页面层级
   */
  @Prop() zIndex?: number = 1000;

  /**
   * 是否展示顶部标题栏
   */
  @Prop() isShowHeader: boolean = true;

  /**
   * 是否展示右上角的关闭按钮
   */
  @Prop() isNeedClose: boolean = true;


  /**
   * 会话ID，传入继续对话，否则创建新会话
   */
  @Prop({ mutable: true }) conversationId?: string;

  /**
   * 当前助手回复的消息
   */
  @State() currentAssistantMessage: string = '';

  /**
   * 是否正在加载回复
   */
  @State() isLoading: boolean = false;

  /**
   * 当前正在流式输出的消息
   */
  @State() currentStreamingMessage: ChatMessage | null = null;

  // 添加新的状态控制
  @State() shouldAutoScroll: boolean = true;

  @State() isLoadingHistory: boolean = false;

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  /**
   * 一轮对话结束时的回调
   */
  @Event() streamComplete: EventEmitter<{
    conversation_id: string;
    event: string;
    message_id: string;
    id: string;
  }>;

  /**
   * 新会话开始的回调，只会在一轮对话开始时触发一次
   */
  @Event() conversationStart: EventEmitter<{
    conversation_id: string;
    event: string;
    message_id: string;
    id: string;
  }>;

  @State() selectedFile: File | null = null;
  @State() isUploading: boolean = false;
  @State() uploadedFileInfo: { cos_key: string, filename: string, ext: string, presigned_url: string }[] = [];

  /**
   * 默认查询文本
   */
  @Prop() defaultQuery: string = '';

  // 添加新的状态
  @State() showInitialUpload: boolean = false;


  // 添加视频录制相关状态
  @State() isRecording: boolean = false;
  @State() recordingStream: MediaStream | null = null;
  @State() recordedBlob: Blob | null = null;
  @State() mediaRecorder: MediaRecorder | null = null;
  @State() recordingTimeLeft: number = 0;
  @State() showRecordingUI: boolean = false;
  @State() recordingTimer: any = null;
  @State() recordingStartTime: number = 0;
  @State() recordingMaxTime: number = 120; // 最大录制时间（秒）
  @State() waitingToRecord: boolean = false;
  @State() waitingTimer: any = null;
  @State() waitingTimeLeft: number = 10; // 等待时间（秒）

  // 添加一个新的私有属性来存储视频元素的引用
  private videoRef: HTMLVideoElement | null = null;

  /**
   * 控制对话轮数
   */
  @Prop() totalQuestions: number = 2;

  /**
   * 当前轮数
   */
  @State() currentQuestionNumber: number = 0;


  /**
   * 当聊天完成时触发
   */
  @Event() interviewComplete: EventEmitter<{
    conversation_id: string;
    total_questions: number;
  }>;

  private readonly SCROLL_THRESHOLD = 30;

  /**
   * 视频录制最大时长（秒）
   */
  @Prop() maxRecordingTime: number = 120;

  /**
   * 录制倒计时提醒时间（秒）
   * 当剩余时间小于此值时，显示倒计时警告
   */
  @Prop() countdownWarningTime: number = 30;

  @State() showCountdownWarning: boolean = false;

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  // 添加新的状态来跟踪视频上传
  @State() isUploadingVideo: boolean = false;

  // 添加新的状态和属性
  @State() isPlayingAudio: boolean = false;
  @State() audioUrl: string | null = null;
  private audioElement: HTMLAudioElement | null = null;

  /**
   * 录制错误事件
   */
  @Event() recordingError: EventEmitter<{
    type: string;
    message: string;
    details?: any;
  }>;

  /**
   * 录制状态变化事件
   */
  @Event() recordingStatusChange: EventEmitter<{
    status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
    details?: any;
  }>;

    /**
   * 是否启用语音播报功能
   * true: 启用语音合成
   * false: 禁用语音合成
   */
    @Prop() enableTTS: boolean = false;

  /**
   * 是否自动播放语音问题
   */
  @Prop() enableVoice: boolean = false;

  /**
   * 是否显示题干内容
   * 1: 显示题干内容
   * 0: 不显示题干内容
   */
  @Prop() displayContentStatus: string = "1";


  /**
   * 面试模式
   * video: 视频面试模式
   * text: 文字面试模式
   */
  @Prop() interviewMode: 'video' | 'text' = 'video';

  // 添加文字输入相关状态
  @State() textAnswer: string = '';
  @State() isSubmittingText: boolean = false;

  /**
   * 自定义智能体inputs输入参数
   */
  @Prop() customInputs: Record<string, any> = {};

  /**
   * 机器人ID
   */
  @Prop() botId?: string;



  private handleClose = () => {
    this.stopRecording();
    this.modalClosed.emit();
  };


  private async sendMessageToAPI(message: string, videoUrl?: string) {
    this.isLoading = true;
    let answer = '';
    let llmText = ''; // 添加变量存储 LLMText

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 修改消息处理逻辑，移除文件上传相关代码
    const queryText = message.trim() || '请开始';

    // 检查是否是最后一题
    const isLastQuestion = this.currentQuestionNumber >= this.totalQuestions;

    // 创建新的消息对象
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,  // 消息唯一标识
      time: time,                // 消息时间
      query: queryText,          // 用户输入的消息内容
      answer: '',
      isStreaming: true,        // 是否正在流式输出
      conversation_id: this.conversationId,  // 会话ID
      inputs: this.customInputs,               // 输入参数
      status: "normal",         // 消息状态
      error: null              // 错误信息
    };

    // 设置当前流式消息
    this.currentStreamingMessage = newMessage;

    this.shouldAutoScroll = true;
    // 滚动到底部
    this.scrollToBottom();

    // 如果是最后一题，直接显示结束消息并完成面试
    if (isLastQuestion) {
      this.messages = [...this.messages, newMessage];
      this.currentStreamingMessage = null;
      this.isLoading = false;
      await this.completeInterview();
      this.interviewComplete.emit({
        conversation_id: this.conversationId,
        total_questions: this.totalQuestions
      });
      return;
    }

    // 准备请求数据
    const requestData: any = {
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      query: queryText,
      bot_id: this.botId // 添加 botId 到请求数据中
    };

    // 合并基本输入参数和自定义输入参数
    requestData.inputs = {
      // 合并自定义输入参数
      ...this.customInputs
    };

    // 如果有视频URL，添加到inputs中
    if (videoUrl) {
      requestData.inputs.video_url = videoUrl;
    }

    await sendSSERequest({
      url: `/sdk/v1/chat/chat-messages`,
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + this.apiKey
      },
      data: requestData,
      onMessage: (data) => {
        console.log('收到Stream数据:', data);

        if (data.conversation_id && !this.conversationId) {
          this.conversationId = data.conversation_id;
          this.conversationStart.emit({
            conversation_id: data.conversation_id,
            event: data.event,
            message_id: data.message_id,
            id: data.id,
          });
        }

        // 检查是否有 node_finished 事件和 LLMText
        if (data.event === 'node_finished' && data.data.inputs && data.data.inputs.LLMText) {
          llmText = data.data.inputs.LLMText;
          console.log('获取到 LLMText:', llmText);
        }

        if (data.event === 'message') {
          const inputMessage: UserInputMessageType = { message: message };
          convertWorkflowStreamNodeToMessageRound('message', inputMessage, data);

          if (data.event === 'agent_message' || data.event === 'message') {
            if (data.answer) {
              answer += data.answer;
              const updatedMessage: ChatMessage = {
                ...this.currentStreamingMessage,
                answer,
                isStreaming: true
              };
              this.currentStreamingMessage = updatedMessage;
              this.scrollToBottom();
            }
          }
        }
        if (data.event === "message_end") {
          this.streamComplete.emit({
            conversation_id: data.conversation_id || '',
            event: data.event,
            message_id: data.message_id,
            id: data.id,
          });
        }
      },
      onError: (error) => {
        console.error('发生错误:', error);
        alert(error instanceof Error ? error.message : '消息发送失败，请稍后再试');
        this.messages = [...this.messages, {
          ...newMessage,
          answer: '抱歉，发生了错误，请稍后再试。',
          error: error,
          isStreaming: false
        }];
        this.currentStreamingMessage = null;
        this.isLoading = false;
      },
      onComplete: async () => {
        this.isLoading = false;

        // 获取最新的AI回复内容
        const latestAIMessage = this.currentStreamingMessage;

        // 更新消息列表
        this.messages = [...this.messages, this.currentStreamingMessage];
        this.currentStreamingMessage = null;

        // 如果是初始消息或"下一题"消息，增加题目计数
        if (message === "下一题" || this.currentQuestionNumber === 0) {
          this.currentQuestionNumber++;
        }

        if (latestAIMessage && latestAIMessage.answer) {
          // 优先使用 LLMText，如果没有则使用 answer
          const textForSynthesis = llmText || latestAIMessage.answer;

          if (textForSynthesis && this.enableTTS) {
            // 合成语音
            const audioUrl = await this.synthesizeAudio(textForSynthesis);

            if (this.enableVoice) {
              // 自动播放语音
              await this.playAudio(audioUrl);
              // 自动播放模式下，只在视频模式时开始等待录制
              if (this.interviewMode === 'video') {
                this.startWaitingToRecord();
              }
            } else {
              // 只保存音频URL，不自动播放
              this.audioUrl = audioUrl;
            }
          } else {
            // 如果禁用了语音合成，只在视频模式时开始等待录制
            if (this.interviewMode === 'video') {
              this.startWaitingToRecord();
            }
          }
        }
      }
    });
  }


  // 监听滚动事件，用于控制聊天历史记录的自动滚动行为。
  private handleScroll = () => {
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (!chatHistory) return;

    const { scrollTop, scrollHeight, clientHeight } = chatHistory;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 更新是否应该自动滚动的状态
    this.shouldAutoScroll = distanceFromBottom <= this.SCROLL_THRESHOLD;
  };

  private scrollToBottom() {
    if (!this.shouldAutoScroll) return;
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory && this.isOpen) {
      // 强制浏览器重新计算布局
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }

  // 添加 componentDidRender 生命周期方法，用于在组件渲染后滚动到底部
  componentDidRender() {
    if (this.isLoadingHistory || (this.shouldAutoScroll && this.isOpen)) {
      const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    }
  }


  // 修改 loadHistoryMessages 方法
  private async loadHistoryMessages() {
    if (!this.conversationId) return;

    this.isLoadingHistory = true;
    console.log('加载历史消息...');

    try {
      const result = await sendHttpRequest({
        url: '/sdk/v1/chat/messages',
        method: 'GET',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: {
          conversation_id: this.conversationId,
          bot_id: this.botId,
          limit: 20
        }
      });

      if (result.success && result.data) {
        const historyData = result.data.data || [];
        const formattedMessages: ChatMessage[] = historyData.map(msg => {
          const time = new Date(msg.created_at * 1000);
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;

          // 创建新的消息对象，不包含 inputs 字段
          const { inputs, ...msgWithoutInputs } = msg;

          return {
            ...msgWithoutInputs,
            time: timeStr,
            isStreaming: false,
            status: msg.status === 'error' ? 'error' : 'normal' as const
          };
        });

        this.messages = formattedMessages;
        
        requestAnimationFrame(() => {
          this.shouldAutoScroll = true;
          this.scrollToBottom();
        });
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      alert(error instanceof Error ? error.message : '加载历史消息失败，请刷新重试');
    } finally {
      this.isLoadingHistory = false;
    }
  }

  // 修改 componentDidLoad 生命周期方法
  componentDidLoad() {

    // 添加滚动事件监听器
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory) {
      chatHistory.addEventListener('scroll', this.handleScroll);
    }
  }

  // 添加 componentWillLoad 生命周期方法
  componentWillLoad() {

    // 如果组件加载时已经是打开状态，则直接开始对话
    if (this.isOpen) {
      if (this.conversationId) {
        // 在下一个事件循环中加载历史消息，避免在componentWillLoad中进行异步操作
        setTimeout(() => this.loadHistoryMessages(), 0);
      } else {
        // 在下一个事件循环中发送初始消息，避免在componentWillLoad中进行异步操作
        setTimeout(() => this.sendMessageToAPI(this.defaultQuery), 0);
      }
    }
  }

  // 开始等待录制
  private startWaitingToRecord() {
    // 如果不是视频模式，直接返回
    if (this.interviewMode !== 'video') {
      return;
    }

    // 清除可能存在的计时器
    if (this.waitingTimer) {
      clearInterval(this.waitingTimer);
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }

    this.waitingToRecord = true;
    this.waitingTimeLeft = 10;

    this.waitingTimer = setInterval(() => {
      this.waitingTimeLeft--;
      if (this.waitingTimeLeft <= 0) {
        clearInterval(this.waitingTimer);
        this.waitingTimer = null;
        this.waitingToRecord = false;
        this.startRecording();
      }
    }, 1000);
  }

  // 开始录制视频
  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      this.recordingStream = stream;
      this.showRecordingUI = true;
      this.showCountdownWarning = false;

      // 重置视频引用
      this.videoRef = null;

      // 确保视频元素获取到流
      this.setupVideoPreview(stream);

      // 检测浏览器支持的MIME类型
      const mimeType = this.getSupportedMimeType();

      // 创建MediaRecorder实例
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType
        });
      } catch (e) {
        // 如果指定MIME类型失败，尝试使用默认设置
        console.warn('指定的MIME类型不受支持，使用默认设置:', e);
        try {
          mediaRecorder = new MediaRecorder(stream);
        } catch (recorderError) {
          // 通知父组件录制器创建失败
          this.recordingError.emit({
            type: 'recorder_creation_failed',
            message: '无法创建媒体录制器，您的浏览器可能不支持此功能',
            details: recorderError
          });
          this.showRecordingUI = false;
          return;
        }
      }

      this.mediaRecorder = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        // 通知父组件录制过程中发生错误
        this.recordingError.emit({
          type: 'recording_error',
          message: '录制过程中发生错误',
          details: event
        });
        this.stopRecording();
      };

      mediaRecorder.onstop = () => {
        try {
          // 根据实际使用的MIME类型创建Blob
          const blobType = mimeType || 'video/mp4';
          const blob = new Blob(chunks, { type: blobType });

          if (blob.size === 0) {
            // 通知父组件录制的视频为空
            this.recordingError.emit({
              type: 'empty_recording',
              message: '录制的视频为空'
            });
            this.showRecordingUI = false;
            return;
          }

          this.recordedBlob = blob;

          // 通知父组件录制已完成
          this.recordingStatusChange.emit({
            status: 'stopped',
            details: {
              duration: Math.floor((Date.now() - this.recordingStartTime) / 1000),
              size: blob.size,
              type: blob.type
            }
          });

          this.uploadRecordedVideo();
        } catch (error) {
          // 通知父组件处理录制视频时出错
          this.recordingError.emit({
            type: 'processing_error',
            message: '处理录制视频时出错',
            details: error
          });
          this.showRecordingUI = false;
        }
      };

      // 开始录制
      try {
        mediaRecorder.start();
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.recordingTimeLeft = this.maxRecordingTime;

        // 通知父组件录制已开始
        this.recordingStatusChange.emit({
          status: 'started',
          details: {
            maxDuration: this.maxRecordingTime,
            mimeType: mediaRecorder.mimeType
          }
        });
      } catch (startError) {
        // 通知父组件开始录制失败
        this.recordingError.emit({
          type: 'start_failed',
          message: '开始录制失败，请检查您的设备权限',
          details: startError
        });
        this.showRecordingUI = false;
        return;
      }

      // 设置录制计时器
      this.recordingTimer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        this.recordingTimeLeft = Math.max(0, this.maxRecordingTime - elapsedTime);

        // 检查是否需要显示倒计时警告
        if (this.recordingTimeLeft <= this.countdownWarningTime && !this.showCountdownWarning) {
          this.showCountdownWarning = true;
        }

        // 时间到自动停止录制
        if (this.recordingTimeLeft <= 0) {
          this.stopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('无法访问摄像头或麦克风:', error);
      // 通知父组件无法访问媒体设备
      this.recordingError.emit({
        type: 'media_access_failed',
        message: '无法访问摄像头或麦克风，请确保已授予权限',
        details: error
      });
      this.showRecordingUI = false;
    }
  }

  // 添加新方法来设置视频预览
  private setupVideoPreview(stream: MediaStream) {
    // 延迟执行以确保DOM已更新
    setTimeout(() => {
      const videoElement = this.hostElement.shadowRoot?.querySelector('video') as HTMLVideoElement;
      if (videoElement && stream) {
        // 先尝试使用标准方法
        try {
          videoElement.srcObject = stream;
          videoElement.play().catch(err => {
            console.error('视频播放失败:', err);
          });
        } catch (e) {
          console.warn('设置srcObject失败，尝试替代方法:', e);

          // 对于不支持srcObject的旧浏览器，使用URL.createObjectURL
          try {
            // 使用类型断言解决TypeScript错误
            const objectUrl = URL.createObjectURL(stream as unknown as MediaSource);
            videoElement.src = objectUrl;

            // 确保在视频元素不再使用时释放URL
            videoElement.onended = () => {
              URL.revokeObjectURL(objectUrl);
            };
          } catch (urlError) {
            console.error('创建对象URL失败:', urlError);
          }
        }
      } else {
        console.warn('未找到视频元素或媒体流无效');
      }
    }, 100);
  }

  // 添加一个新方法来检测浏览器支持的MIME类型
  private getSupportedMimeType(): string {
    // 按优先级排列的MIME类型列表
    const mimeTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4',
      'video/mp4;codecs=h264,aac',
      ''  // 空字符串表示使用浏览器默认值
    ];

    // 检查MediaRecorder是否可用
    if (!window.MediaRecorder) {
      console.warn('MediaRecorder API不可用');
      return '';
    }

    // 检查每种MIME类型是否受支持
    for (const type of mimeTypes) {
      if (!type) return ''; // 如果是空字符串，直接返回

      try {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      } catch (e) {
        console.warn(`检查MIME类型支持时出错 ${type}:`, e);
      }
    }

    // 如果没有找到支持的类型，返回空字符串
    console.warn('没有找到支持的MIME类型，将使用浏览器默认值');
    return '';
  }

  // 停止录制
  private stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // 清理计时器
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      // 停止并释放媒体流
      if (this.recordingStream) {
        this.recordingStream.getTracks().forEach(track => track.stop());
        this.recordingStream = null;
      }

      // 清理视频引用
      this.videoRef = null;
    }
  }

  // 修改音频转文字方法
  private async convertAudioToText(cosKey: string): Promise<string | null> {
    try {
      const result = await sendHttpRequest<{ text: string }>({
        url: '/sdk/v1/tts/audio_to_text',
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: {
          cos_key: cosKey
        }
      });
      
      if (result.success && result.data && result.data.text) {
        return result.data.text;
      } else {
        console.warn('音频转文字返回结果格式不正确');
        return null;
      }
    } catch (error) {
      console.error('音频转文字错误:', error);
      return null;
    }
  }

  // 上传录制的视频
  private async uploadRecordedVideo() {
    if (!this.recordedBlob) return;

    try {
      this.isUploadingVideo = true; // 开始上传时设置状态
      this.showRecordingUI = false; // 隐藏视频预览

      // 根据Blob类型确定文件扩展名
      const fileExtension = this.recordedBlob.type.includes('webm') ? 'webm' : 'mp4';
      const fileName = `answer.${fileExtension}`;

      // 创建File对象
      const file = new File([this.recordedBlob], fileName, { type: this.recordedBlob.type });
      
      // 使用uploadFileToBackend上传文件
      const fileInfo = await uploadFileToBackend(file, {
        'authorization': 'Bearer ' + this.apiKey
      });
      
      // 调用音频转文字API
      const transcriptionText = await this.convertAudioToText(fileInfo.cos_key);

      // 发送"下一题"请求，可以附带转录文本
      this.sendMessageToAPI(transcriptionText || "下一题");
    } catch (error) {
      console.error('视频上传或处理错误:', error);
      // 通知父组件视频上传失败
      this.recordingError.emit({
        type: 'upload_failed',
        message: '视频上传或处理失败',
        details: error
      });
    } finally {
      this.isUploadingVideo = false; // 上传完成后重置状态
      this.showRecordingUI = false;
      this.recordedBlob = null;
    }
  }


  /**
   * 发送面试完成请求
   */
  private async completeInterview() {
    if (!this.conversationId) return;

    try {
      const requestData: any = {
        response_mode: 'streaming',
        conversation_id: this.conversationId,
        query: "面试完成",
        inputs: {
          // 合并自定义输入参数
          ...this.customInputs
        }
      };

      // 使用sendHttpRequest发送请求
      sendHttpRequest({
        url: '/sdk/v1/chat/chat-messages',
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: requestData
      }).catch(error => {
        console.error('发送面试完成请求失败:', error);
      });

    } catch (error) {
      console.error('发送面试完成请求失败:', error);
    }
  }

  // 添加TTS合成音频的方法
  private async synthesizeAudio(text: string): Promise<string> {
    try {
      const response = await fetch(`${API_DOMAIN}/sdk/v1/tts/synthesize_audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer ' + this.apiKey
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('语音合成失败');
      }

      // 获取音频数据并创建Blob URL
      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('语音合成错误:', error);
      throw error;
    }
  }

  // 播放音频的方法
  private playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve) => {
      this.isPlayingAudio = true;
      this.audioUrl = audioUrl;

      // 创建音频元素
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }

      this.audioElement.src = audioUrl;
      this.audioElement.onended = () => {
        this.isPlayingAudio = false;
        this.audioUrl = null;
        resolve();
      };

      this.audioElement.onerror = () => {
        console.error('音频播放错误');
        this.isPlayingAudio = false;
        this.audioUrl = null;
        resolve();
      };

      this.audioElement.play().catch(error => {
        console.error('音频播放失败:', error);
        this.isPlayingAudio = false;
        this.audioUrl = null;
        resolve();
      });
    });
  }

  // 修改 componentDidLoad 生命周期方法，确保组件卸载时释放资源
  disconnectedCallback() {
    // 移除滚动事件监听器
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory) {
      chatHistory.removeEventListener('scroll', this.handleScroll);
    }

    // 释放音频资源
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    // 释放 Blob URL
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }

    // 清理其他计时器
    if (this.waitingTimer) {
      clearInterval(this.waitingTimer);
      this.waitingTimer = null;
    }

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    // 停止录制
    this.stopRecording();
  }

  // 修改手动播放音频的方法
  private handlePlayAudio = async () => {
    if (this.audioUrl) {
      await this.playAudio(this.audioUrl);
      // 手动播放完成后只在视频模式时开始等待录制
      if (this.interviewMode === 'video') {
        this.startWaitingToRecord();
      }
    }
  };

  // 处理文本输入变化
  private handleTextInputChange = (event: Event) => {
    const input = event.target as HTMLTextAreaElement;
    this.textAnswer = input.value;
  };

  // 添加处理键盘事件的方法
  private handleKeyDown = (event: KeyboardEvent) => {
    // 如果按下的是回车键
    if (event.key === 'Enter') {
      // 如果同时按下了Ctrl键，允许换行
      if (event.ctrlKey) {
        return; // 不阻止默认行为，允许插入换行符
      } else {
        // 阻止默认的换行行为
        event.preventDefault();
        // 如果文本框不为空且不处于禁用状态，则发送消息
        if (this.textAnswer.trim() && !this.isSubmittingText && !this.isLoading &&
          !this.currentStreamingMessage && !this.waitingToRecord && !this.isPlayingAudio) {
          this.submitTextAnswer();
        }
      }
    }
  };

  // 修改提交文本回答的方法
  private submitTextAnswer = async () => {
    if (!this.textAnswer.trim() || this.isSubmittingText) {
      return;
    }

    this.isSubmittingText = true;

    try {
      // 保存当前输入内容
      const textToSend = this.textAnswer;
      
      // 立即清空文本输入
      this.textAnswer = '';
      
      // 发送用户输入的文本作为查询
      await this.sendMessageToAPI(textToSend);
    } catch (error) {
      console.error('提交文本回答失败:', error);
      alert('提交回答失败，请重试');
    } finally {
      this.isSubmittingText = false;
    }
  };

  render() {
    if (!this.isOpen) return null;

    const modalStyle = {
      zIndex: String(this.zIndex)
    };

    const containerClass = {
      'modal-container': true,
      'fullscreen': this.fullscreen
    };

    const overlayClass = {
      'modal-overlay': true,
      'fullscreen-overlay': this.fullscreen
    };

    const renderVideoPreview = () => (
      <div class="video-preview">
        <video
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
          ref={(el) => {
            if (el && this.recordingStream && !this.videoRef) {
              this.videoRef = el;
              // 不在这里设置srcObject，而是使用setupVideoPreview方法
            }
          }}
        ></video>
        <div class={{
          'recording-status': true,
          'warning': this.showCountdownWarning
        }}>
          <span class="recording-dot"></span>
          <span>
            录制中 {Math.floor(this.recordingTimeLeft / 60)}:{(this.recordingTimeLeft % 60).toString().padStart(2, '0')}
            {this.showCountdownWarning && ` (即将自动完成)`}
          </span>
        </div>
      </div>
    );

    // 渲染占位符状态信息
    const renderPlaceholderStatus = () => {
      // 正在播放音频
      if (this.isPlayingAudio) {
        return (
          <div class="placeholder-status">
            <p>正在播放问题，请听完后准备回答...</p>
          </div>
        );
      }

      // 正在上传视频
      if (this.isUploadingVideo) {
        return (
          <div class="placeholder-status">
            <p>正在上传视频，请稍候...</p>
          </div>
        );
      }

      // 正在加载或等待AI回复
      if (this.isLoading || this.currentStreamingMessage) {
        return (
          <div class="placeholder-status">
            <p>请等待题目...</p>
          </div>
        );
      }

      // 等待开始录制
      if (this.waitingToRecord) {
        return (
          <div class="placeholder-status">
            <p>请准备好，{this.waitingTimeLeft}秒后将开始录制您的回答...</p>
          </div>
        );
      }

      // 添加默认状态
      return (
        <div class="placeholder-status default-status">
          <p>准备中...</p>
        </div>
      );
    };

    // 修改文本输入区域渲染函数
    const renderTextInputArea = () => (
      <div class="text-input-area">
        <textarea
          class="text-answer-input"
          placeholder="请输入...(按回车发送，Ctrl+回车换行)"
          value={this.textAnswer}
          onInput={this.handleTextInputChange}
          onKeyDown={this.handleKeyDown}
          disabled={this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.waitingToRecord || this.isPlayingAudio}
        ></textarea>
        <div class="input-toolbar">
          <div class="toolbar-actions">
            {/* <button class="toolbar-button" title="表情" disabled>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4H7zm1.5-5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
            </button>
            <button class="toolbar-button" title="图片" disabled>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
              </svg>
            </button> */}
          </div>
          <button
            class={{
              'submit-text-button': true,
              'disabled': !this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.waitingToRecord || this.isPlayingAudio
            }}
            disabled={!this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.waitingToRecord || this.isPlayingAudio}
            onClick={this.submitTextAnswer}
          >
            {this.isSubmittingText ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    );

    return (
      <div class={overlayClass} style={modalStyle}>
        <div class={containerClass}>
          {this.isShowHeader && (
            <div class="modal-header">
              <div class="header-left">
                {this.icon && <img src={this.icon} class="header-icon" alt="应用图标" />}
                <div>{this.modalTitle}</div>
              </div>
              {this.isNeedClose && (
                <button class="close-button" onClick={this.handleClose}>
                  <span>×</span>
                </button>
              )}
            </div>
          )}

          <div style={{ height: '100%' }}>
            <div class="chat-history" onScroll={this.handleScroll}>
              {this.isLoadingHistory ? (
                <div class="loading-container">
                  <div class="loading-spinner"></div>
                  <p>加载历史消息中...</p>
                </div>
              ) : (
                <div>
                  {this.messages.map((message) => (
                    <div id={`message_${message.id}`} key={message.id}>
                      <pcm-chat-message
                        message={message}
                        onMessageChange={(event) => {
                          const updatedMessages = this.messages.map(msg =>
                            msg.id === message.id ? { ...msg, ...event.detail } : msg
                          );
                          this.messages = updatedMessages;
                        }}
                      ></pcm-chat-message>
                    </div>
                  ))}
                  {this.currentStreamingMessage && (
                    <div id={`message_${this.currentStreamingMessage.id}`}>
                      <pcm-chat-message
                        message={this.currentStreamingMessage}
                      ></pcm-chat-message>
                    </div>
                  )}
                  {this.messages.length === 0 && !this.currentStreamingMessage && (
                    <div class="empty-state">
                      <p>正在准备面试...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div class="recording-section">
              <div class="recording-container">
                {
                  this.interviewMode === 'text' && (
                    renderTextInputArea()
                  )
                }
                {this.interviewMode === 'video' && (
                  <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div class="video-area">
                      {this.showRecordingUI ? (
                        renderVideoPreview()
                      ) : (
                        <div class="video-preview placeholder">
                          {renderPlaceholderStatus()}
                        </div>
                      )}
                      <div class="progress-container">
                        <div class="progress-bar-container">
                          <div
                            class="progress-bar"
                            style={{
                              width: `${Math.max(0, this.currentQuestionNumber - 1) / this.totalQuestions * 100}%`
                            }}
                          ></div>
                        </div>
                        <div class="progress-text">
                          已完成{Math.max(0, this.currentQuestionNumber - 1)}/{this.totalQuestions}
                        </div>
                      </div>
                    </div>
                    <div class="recording-controls">
                      {this.showRecordingUI ? (
                        <button
                          class="stop-recording-button"
                          onClick={() => this.stopRecording()}
                        >
                          完成本题回答
                        </button>
                      ) : (
                        <div class="waiting-message">
                          {(() => {
                            // 显示播放按钮（当不自动播放且有音频URL时）
                            if (!this.enableVoice && this.audioUrl && !this.isPlayingAudio) {
                              return (
                                <div class="play-audio-container" onClick={this.handlePlayAudio}>
                                  <p>
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                    <span style={{ verticalAlign: 'middle' }}>播放题目</span>
                                  </p>
                                </div>
                              );
                            }

                            // 其他状态下显示禁用的"完成回答"按钮
                            return (
                              <button class="stop-recording-button disabled" disabled>
                                完成回答
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
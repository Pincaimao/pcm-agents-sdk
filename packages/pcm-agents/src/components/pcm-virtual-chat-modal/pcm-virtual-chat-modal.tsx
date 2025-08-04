import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { sendSSERequest, sendHttpRequest, uploadFileToBackend, fetchAgentInfo, getSupportedMimeType, convertAudioToText } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';
import { StreamCompleteEventData, ConversationStartEventData, InterviewCompleteEventData, RecordingErrorEventData, RecordingStatusChangeEventData } from '../../interfaces/events';
import { ErrorEventBus } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store'; // 导入 authStore
import { configStore } from '../../../store/config.store';
import { SentryReporter } from '../../utils/sentry-reporter';

@Component({
  tag: 'pcm-virtual-chat-modal',
  styleUrls: ['pcm-virtual-chat-modal.css'],
  shadow: true,
})
export class ChatVirtualAPPModal {
  /**
   * SDK鉴权密钥
   */
  @Prop({ attribute: 'token' }) token?: string;

  /**
   * 是否显示聊天模态框
   */
  @Prop({ mutable: true }) isOpen: boolean = false;

  /**
   * 聊天消息历史
   */
  @State() messages: ChatMessage[] = [];

  /**
   * 聊天框的页面层级
   */
  @Prop({ mutable: true }) zIndex?: number;

  /**
   * 会话ID，传入继续对话，否则创建新会话
   */
  @Prop({ mutable: true }) conversationId?: string;

  /**
   * 是否正在加载回复
   */
  @State() isLoading: boolean = false;

  /**
   * 当前正在流式输出的消息
   */
  @State() currentStreamingMessage: ChatMessage | null = null;

  @State() isLoadingHistory: boolean = false;

  // 使用 @Element 装饰器获取组件的 host 元素
  @Element() hostElement: HTMLElement;

  /**
   * 一轮对话结束时的回调
   */
  @Event() streamComplete: EventEmitter<StreamCompleteEventData>;

  /**
   * 新会话开始的回调，只会在一轮对话开始时触发一次
   */
  @Event() conversationStart: EventEmitter<ConversationStartEventData>;

  /**
   * 默认发送文本
   */
  @Prop() defaultQuery: string = '你好！聘才猫';

  /**
   * 视频录制最大时长（秒）
   */
  @Prop() maxRecordingTime: number = 120;

  /**
   * 录制倒计时提醒时间（秒）
   * 当剩余时间小于此值时，显示倒计时警告
   */
  @Prop() countdownWarningTime: number = 30;

  // 添加视频录制相关状态
  @State() isRecording: boolean = false;
  @State() recordingStream: MediaStream | null = null;
  @State() recordedBlob: Blob | null = null;
  @State() mediaRecorder: MediaRecorder | null = null;
  @State() recordingTimeLeft: number = 0;
  @State() showRecordingUI: boolean = false;
  @State() recordingTimer: any = null;
  @State() recordingStartTime: number = 0;
  @State() waitingToRecord: boolean = false;
  @State() waitingTimer: any = null;
  @State() waitingTimeLeft: number = 10; // 等待时间（秒）

  // 添加一个新的私有属性来存储视频元素的引用
  private videoRef: HTMLVideoElement | null = null;

  /**
   * 当前轮数
   */
  @State() currentQuestionNumber: number = 0;

  /**
   * 当聊天完成时触发
   */
  @Event() interviewComplete: EventEmitter<InterviewCompleteEventData>;

  @State() showCountdownWarning: boolean = false;

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  // 添加新的状态来跟踪视频上传
  @State() isUploadingVideo: boolean = false;

  /**
   * 数字人视频相关状态
   */
  @State() digitalHumanVideoUrl: string = '';
  @State() digitalHumanDefaultVideoUrl: string = '';
  @State() digitalHumanVirtualmanKey: string = '';
  @State() isPlayingDigitalHumanVideo: boolean = false;
  @State() digitalHumanVideoReady: boolean = false;
  @State() digitalHumanOpeningContents: Array<{ text: string, video_url: string }> = [];
  @State() isPlayingWelcomeVideo: boolean = false;

  // 数字人视频元素引用
  private digitalHumanVideoElement: HTMLVideoElement | null = null;

  // 视频预加载缓存管理
  private preloadedVideos: Set<string> = new Set();
  private preloadingVideos: Map<string, Promise<void>> = new Map();

  /**
   * 是否正在等待数字人视频播放完成
   */
  @State() waitingForDigitalHuman: boolean = false;

  /**
   * 虚拟数字人ID，指定则开启虚拟数字人功能
   */
  @Prop() digitalId?: string;

  /**
   * 数字人开场白索引，用于选择开场白和开场视频（可选：0, 1, 2）
   * 0、您好，我是聘才猫 AI 面试助手。很高兴为你主持这场面试！在开始前，请确保：身处安静、光线充足的环境。网络顺畅，摄像头和麦克风工作正常。现在我正在查看本次面试的相关信息，为您生成专属面试题，马上就好，请稍等片刻。</br>
   * 1、您好，我是您的 AI 面试助手。欢迎参加本次AI面试！为了获得最佳效果，请确认：您在安静、明亮的环境中。您的网络稳定，摄像头和麦克风已开启。我们正在后台为您准备本次专属面试内容，很快开始，请稍候。<br>
   * 2、您好，我是您的 AI 面试助手。面试马上开始。趁此片刻，请快速确认：周围安静吗？光线足够吗？网络没问题？摄像头和麦克风准备好了吗？我们正在为您加载个性化的面试环节，稍等就好！
   */
  @Prop() openingIndex: number = 0;

  /**
   * 录制错误事件
   */
  @Event() recordingError: EventEmitter<RecordingErrorEventData>;

  /**
   * 录制状态变化事件
   */
  @Event() recordingStatusChange: EventEmitter<RecordingStatusChangeEventData>;

  /**
   * SDK密钥验证失败事件
   */
  @Event() tokenInvalid: EventEmitter<void>;

  /**
   * 自定义智能体inputs输入参数
   */
  @Prop({ mutable: true }) customInputs: Record<string, any> = {};

  /**
   * 机器人ID
   */
  @Prop() botId?: string;

  /**
   * 智能体头像URL（从后端获取）
   */
  @State() agentLogo: string = '';

  // 添加新的状态属性来跟踪任务是否已完成
  @State() isTaskCompleted: boolean = false;

  private tokenInvalidListener: () => void;


  @State() deviceError: string | null = null;

  // 添加二次确认相关状态
  @State() showConfirmModal: boolean = false;
  @State() skipConfirmThisInterview: boolean = false;

  @Watch('token')
  handleTokenChange(newToken: string) {
    // 当传入的 token 变化时，更新 authStore 中的 token
    if (newToken && newToken !== authStore.getToken()) {
      authStore.setToken(newToken);
    }
  }

  componentWillLoad() {
    // 将 zIndex 存入配置缓存
    if (this.zIndex) {
      configStore.setItem('modal-zIndex', this.zIndex);
    } else {
      // 如果没有提供 zIndex，尝试从缓存中读取
      const cachedZIndex = configStore.getItem<number>('modal-zIndex');
      if (cachedZIndex) {
        this.zIndex = cachedZIndex;
      } else {
        this.zIndex = 1000;
        configStore.setItem('modal-zIndex', 1000);
      }
    }

    if (this.token) {
      authStore.setToken(this.token);
    }

    // 添加全局token无效事件监听器
    this.tokenInvalidListener = () => {
      this.tokenInvalid.emit();
    };
    document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);

    // 确保 customInputs 是一个对象
    if (!this.customInputs) {
      this.customInputs = {};
    }

    // 如果没有设置助手头像，尝试获取智能体头像
    if (this.botId) {
      this.fetchAgentLogo();
    }

    // 添加数字人初始化日志
    console.log('componentWillLoad - 数字人相关状态:', {
      digitalId: this.digitalId,
      isOpen: this.isOpen,
      conversationId: this.conversationId,
      digitalHumanVirtualmanKey: this.digitalHumanVirtualmanKey,
    });

    // 如果有数字人ID，初始化数字人功能
    if (this.digitalId) {
      console.log('准备初始化数字人功能...');
      this.initializeDigitalHuman();
    }

    // 如果组件加载时已经是打开状态，则直接开始对话
    if (this.isOpen) {
      if (this.conversationId) {
        // 在下一个事件循环中加载历史消息，避免在componentWillLoad中进行异步操作
        setTimeout(() => this.loadHistoryMessages(), 0);
      } else {
        // 在下一个事件循环中发送初始消息，避免在componentWillLoad中进行异步操作
        setTimeout(() => {
          this.sendMessageToAPI(this.defaultQuery);
        }, 0);
      }
    }
  }


  // 添加获取智能体信息的方法
  private async fetchAgentLogo() {
    if (!this.botId) return;

    try {
      const agentInfo = await fetchAgentInfo(this.botId);

      if (agentInfo && agentInfo.logo) {
        this.agentLogo = agentInfo.logo;
      }
    } catch (error) {
      SentryReporter.captureError(error, {
        action: 'fetchAgentLogo',
        component: 'pcm-virtual-chat-modal',
        title: '获取智能体信息失败',
      });
      ErrorEventBus.emitError({
        error: error,
        message: '获取智能体信息失败',
      });
    }
  }

  private async sendMessageToAPI(message: string, videoUrl?: string) {
    // 发送新消息时重置状态
    this.waitingForDigitalHuman = false;
    this.digitalHumanVideoReady = false;

    this.isLoading = true;
    let answer = '';
    let llmText = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 修改消息处理逻辑，移除文件上传相关代码
    const queryText = message.trim() || '请开始';

    // 如果有视频URL，添加到customInputs中
    if (videoUrl) {
      this.customInputs = {
        ...this.customInputs,
        video_url: videoUrl,
      };
    }
    // 如果没有设置url_callback，则使用默认值
    if (!this.customInputs.url_callback) {
      this.customInputs = {
        ...this.customInputs,
        url_callback: 'https://tagents.ylzhaopin.com/agents/api/test/callback',
      };
    }

    // 创建新的消息对象
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // 临时ID，将被服务器返回的ID替换
      conversation_id: this.conversationId, // 会话ID
      inputs: this.customInputs || {}, // 输入参数
      query: queryText, // 用户输入的消息内容
      answer: '', // 初始为空
      message_files: [], // 消息附件
      feedback: {}, // 反馈
      retriever_resources: [], // 检索资源
      created_at: Math.floor(Date.now() / 1000).toString(), // 创建时间
      agent_thoughts: [], // 代理思考过程
      status: 'normal', // 消息状态
      error: null, // 错误信息
      // 添加组件内部使用的字段
      time: time, // 消息时间（显示用）
      isStreaming: true, // 是否正在流式输出
    };

    // 设置当前流式消息
    this.currentStreamingMessage = newMessage;


    // 准备请求数据
    const requestData: any = {
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      query: queryText,
      bot_id: this.botId, // 添加 botId 到请求数据中
    };

    // 合并基本输入参数和自定义输入参数
    requestData.inputs = {
      // 合并自定义输入参数
      ...this.customInputs,
    };

    await sendSSERequest({
      url: '/sdk/v1/chat/chat-messages',
      method: 'POST',
      data: requestData,
      onMessage: data => {
        console.log(new Date().toLocaleString());
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
        }

        // 添加对任务结束的判断
        if (data.event === 'node_finished' && data.data.title && data.data.title.includes('聘才猫任务结束')) {
          console.log('检测到任务结束事件:', data);

          // 设置标志，表示任务已结束
          this.isTaskCompleted = true;

          // 获取当前AI回复内容，优先使用LLMText，否则使用answer
          const aiResponse = llmText || answer || this.currentStreamingMessage?.answer || '';

          // 触发面试完成事件
          this.interviewComplete.emit({
            conversation_id: this.conversationId,
            current_question_number: this.currentQuestionNumber,
            ai_response: aiResponse, // 添加AI回复内容
          });
        }
        if (data.event === 'node_finished' && data.data.title && data.data.title.includes('聘才猫数字人题目')) {
          const digital_human_list = JSON.parse(data.data.process_data.digital_human_list);
          console.log('数字人题目:', digital_human_list);
          this.precreateDigitalHumanVideos(digital_human_list);
        }

        if (data.event === 'message') {
          if (data.event === 'agent_message' || data.event === 'message') {
            if (data.answer) {
              answer += data.answer;
              // 更新消息时保持完整的消息结构
              const updatedMessage: ChatMessage = {
                ...this.currentStreamingMessage,
                answer,
                id: data.message_id || this.currentStreamingMessage.id,
                isStreaming: true,
                // 如果服务器返回了其他字段，也更新它们
                retriever_resources: data.retriever_resources || this.currentStreamingMessage.retriever_resources,
                agent_thoughts: data.agent_thoughts || this.currentStreamingMessage.agent_thoughts,
              };
              this.currentStreamingMessage = updatedMessage;
            }
          }
        }
        if (data.event === 'message_end') {
          this.streamComplete.emit({
            conversation_id: data.conversation_id || '',
            event: data.event,
            message_id: data.message_id,
            id: data.id,
          });
        }
      },
      onError: error => {
        console.error('发生错误:', error);
        ErrorEventBus.emitError({
          error: error,
          message: '消息发送失败，请稍后再试',
        });
        SentryReporter.captureError(error, {
          action: 'sendMessageToAPI',
          component: 'pcm-virtual-chat-modal',
          title: '消息发送失败',
        });

        this.messages = [
          ...this.messages,
          {
            ...newMessage,
            answer: '抱歉，发生了错误，请稍后再试。',
            error: error,
            isStreaming: false,
          },
        ];
        this.currentStreamingMessage = null;
        this.isLoading = false;
      },
      onComplete: async () => {
        this.isLoading = false;
        // 根据currentQuestionNumber判断是否清空customInputs
        if (this.currentQuestionNumber === 0) {
          //  发送第一条消息后，清空指定的 customInputs 字段
          setTimeout(() => {
            if (this.customInputs) {
              // 只清除指定的字段，其他字段保留
              delete this.customInputs.job_info;
              delete this.customInputs.file_url;
              delete this.customInputs.file_name;
            }
          }, 1000); // 给一些时间让第一条消息处理完成
        }

        // 获取最新的AI回复内容
        const latestAIMessage = this.currentStreamingMessage;
        latestAIMessage.isStreaming = false;


        if (this.digitalId && latestAIMessage && latestAIMessage.answer) {
          // 如果开启了数字人功能，生成数字人视频
          console.log('生成数字人视频:', latestAIMessage.answer);
          this.generateDigitalHumanVideo(latestAIMessage.answer);
        }

        this.currentStreamingMessage = null;

        // 更新消息列表
        this.messages = [...this.messages, latestAIMessage];

        // 增加计数
        this.currentQuestionNumber++;

        if (this.isTaskCompleted) {
          return;
        }

        // 如果开启了数字人，等待数字人视频播放完成
        if (this.digitalId) {
          this.waitingForDigitalHuman = true;
          console.log('等待数字人视频播放完成...');
        } else {
          // 没有开启数字人，直接开始录制
          this.startWaitingToRecord();
        }
      },
    });
  }

  // 修改加载历史消息的方法
  private async loadHistoryMessages() {
    if (!this.conversationId) return;

    this.isLoadingHistory = true;
    console.log('加载历史消息...');
    let conversationStatus = false;
    this.digitalHumanVideoReady = true

    try {
      // 首先获取会话状态
      const conversationStatusResponse = await sendHttpRequest({
        url: `/sdk/v1/chat/conversation`,
        method: 'GET',
        data: {
          conversation_id: this.conversationId,
        },
      });
      // 处理会话状态
      if (conversationStatusResponse.success && conversationStatusResponse.data && conversationStatusResponse.data.run_status == '结束') {
        conversationStatus = true;
      }

      // 获取历史消息
      const result = await sendHttpRequest({
        url: '/sdk/v1/chat/messages',
        method: 'GET',
        data: {
          conversation_id: this.conversationId,
          bot_id: this.botId,
          limit: 20,
        },
      });

      if (result.success && result.data) {
        const historyData = result.data.data || [];
        const formattedMessages: ChatMessage[] = historyData.map(msg => {
          const time = new Date(parseInt(msg.created_at) * 1000);
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;

          // 创建完整的消息对象，保持统一结构
          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            inputs: msg.inputs || {},
            query: msg.query || '',
            answer: msg.answer || '',
            message_files: msg.message_files || [],
            feedback: msg.feedback || {},
            retriever_resources: msg.retriever_resources || [],
            created_at: msg.created_at,
            agent_thoughts: msg.agent_thoughts || [],
            status: msg.status || 'normal',
            error: msg.error,
            // 组件内部使用的字段
            time: timeStr,
            isStreaming: false,
          };
        });

        this.messages = formattedMessages;

        // 根据历史消息数量设置currentQuestionNumber
        this.currentQuestionNumber = formattedMessages.length || 0;
      }
    } catch (error) {
      console.error('加载历史消息或会话状态失败:', error);
      SentryReporter.captureError(error, {
        action: 'loadHistoryMessages',
        component: 'pcm-virtual-chat-modal',
        title: '加载历史消息失败',
      });
      ErrorEventBus.emitError({
        error: error,
        message: '加载历史消息失败，请刷新重试',
      });
    } finally {
      this.isLoadingHistory = false;
      setTimeout(async () => {

        // 如果有会话ID且有历史消息，且会话未结束，处理继续对话的逻辑
        if (this.conversationId && this.messages.length > 0 && !conversationStatus) {

          // 开始等待录制
          this.startWaitingToRecord();
        } else if (conversationStatus) {
          // 如果会话已结束，设置任务完成状态
          this.isTaskCompleted = true;
        }
      }, 200);
    }
  }

  // 开始等待录制
  private startWaitingToRecord() {

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
          frameRate: { ideal: 30 },
        },
      });

      // 如果成功获取到媒体流，清除之前的设备错误
      this.deviceError = null;

      this.recordingStream = stream;
      this.showRecordingUI = true;
      this.showCountdownWarning = false;

      // 重置视频引用
      this.videoRef = null;

      // 确保视频元素获取到流
      this.setupVideoPreview(stream);

      // 检测浏览器支持的MIME类型
      const mimeType = getSupportedMimeType();

      // 创建MediaRecorder实例
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 800000, // 800kbps 视频比特率限制
          audioBitsPerSecond: 64000, // 64kbps 音频比特率限制
        });
      } catch (e) {
        // 如果指定MIME类型失败，尝试使用默认设置
        console.warn('指定的MIME类型不受支持，使用默认设置:', e);
        try {
          mediaRecorder = new MediaRecorder(stream, {
            videoBitsPerSecond: 800000, // 即使降级也保持比特率限制
            audioBitsPerSecond: 64000,
          });
        } catch (recorderError) {
          // 最后的降级选项，不设置任何参数
          try {
            mediaRecorder = new MediaRecorder(stream);
          } catch (finalError) {
            // 通知父组件录制器创建失败
            this.recordingError.emit({
              type: 'recorder_creation_failed',
              message: '无法创建媒体录制器，您的浏览器可能不支持此功能',
              details: finalError,
            });
            this.showRecordingUI = false;
            return;
          }
        }
      }

      this.mediaRecorder = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onerror = event => {
        // 通知父组件录制过程中发生错误
        this.recordingError.emit({
          type: 'recording_error',
          message: '录制过程中发生错误',
          details: event,
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
              message: '录制的视频为空',
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
              type: blob.type,
            },
          });

          this.uploadRecordedVideo();
        } catch (error) {
          // 通知父组件处理录制视频时出错
          this.recordingError.emit({
            type: 'processing_error',
            message: '处理录制视频时出错',
            details: error,
          });
          this.showRecordingUI = false;
          SentryReporter.captureError(error, {
            action: 'uploadRecordedVideo',
            component: 'pcm-hr-chat-modal',
            title: '处理录制视频时出错',
          });
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
            mimeType: mediaRecorder.mimeType,
          },
        });
      } catch (startError) {
        // 通知父组件开始录制失败
        this.recordingError.emit({
          type: 'start_failed',
          message: '开始录制失败，请检查您的设备权限',
          details: startError,
        });
        this.showRecordingUI = false;
        SentryReporter.captureError(startError, {
          action: 'startRecording',
          component: 'pcm-hr-chat-modal',
          title: '开始录制失败',
        });
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

      // 设置设备错误状态
      let errorMessage = '设备访问失败';

      if (error.name === 'NotAllowedError') {
        errorMessage = '请允许访问摄像头和麦克风权限';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未检测到摄像头或麦克风设备';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '设备正在被其他应用程序使用';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '摄像头不支持指定的配置';
      } else {
        errorMessage = '无法访问摄像头或麦克风，请检查设备连接';
      }

      this.deviceError = errorMessage;
      this.showRecordingUI = false;
      ErrorEventBus.emitError({
        error: error,
        message: errorMessage,
      });

      SentryReporter.captureError(error, {
        action: 'startRecording',
        component: 'pcm-virtual-chat-modal',
        title: errorMessage,
      });
    }
  }

  // 添加新方法来设置视频预览
  private setupVideoPreview(stream: MediaStream) {
    // 延迟执行以确保DOM已更新
    setTimeout(() => {
      const videoElement = this.hostElement.shadowRoot?.querySelector('.user-video-preview') as HTMLVideoElement;
      if (videoElement && stream) {
        // 先尝试使用标准方法
        try {
          videoElement.srcObject = stream;
          videoElement.play().catch(err => {
            console.error('视频播放失败:', err);
            SentryReporter.captureError(err, {
              action: 'setupVideoPreview',
              component: 'pcm-virtual-chat-modal',
              title: '视频播放失败',
            });
            ErrorEventBus.emitError({
              error: err,
              message: '视频播放失败',
            });
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
            SentryReporter.captureError(urlError, {
              action: 'setupVideoPreview',
              component: 'pcm-virtual-chat-modal',
              title: '创建对象URL失败',
            });
            ErrorEventBus.emitError({
              error: urlError,
              message: '创建对象URL失败',
            });
          }
        }
      } else {
        console.warn('未找到视频元素或媒体流无效');
      }
    }, 100);
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

  // 处理停止录制按钮点击
  private handleStopRecording = () => {
    // 如果已经设置了跳过确认，直接停止录制
    if (this.skipConfirmThisInterview) {
      this.stopRecording();
      return;
    }

    // 否则显示确认模态框
    this.showConfirmModal = true;
  };

  // 处理"本次面试不再提醒"复选框变化
  private handleSkipConfirmChange = (event: Event) => {
    const checkbox = event.target as HTMLInputElement;
    this.skipConfirmThisInterview = checkbox.checked;
  };

  // 处理确认模态框的取消事件
  private handleConfirmModalCancel = () => {
    this.showConfirmModal = false;
  };

  // 处理确认模态框的OK事件
  private handleConfirmModalOk = () => {
    this.showConfirmModal = false;
    this.stopRecording();
  };

  // 处理确认模态框的Cancel事件
  private handleConfirmModalCancelEvent = () => {
    this.showConfirmModal = false;
  };


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
      const fileInfo = await uploadFileToBackend(
        file,
        {},
        {
          tags: ['other'],
        },
      );
      // 使用 cos_key 作为视频标识符
      // 调用音频转文字API
      const transcriptionText = await convertAudioToText(fileInfo.cos_key);

      // 发送"下一题"请求，可以附带转录文本
      this.sendMessageToAPI(transcriptionText || '下一题', fileInfo.cos_key);
    } catch (error) {
      console.error('视频上传或处理错误:', error);
      SentryReporter.captureError(error, {
        action: 'uploadRecordedVideo',
        component: 'pcm-virtual-chat-modal',
        title: '视频上传或处理失败',
      });
      ErrorEventBus.emitError({
        error: error,
        message: '视频上传或处理失败',
      });
    } finally {
      this.isUploadingVideo = false; // 上传完成后重置状态
      this.showRecordingUI = false;
      this.recordedBlob = null;
    }
  }

  // 确保组件卸载时释放资源
  disconnectedCallback() {
    document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);

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

    // 清理视频预加载缓存
    this.preloadedVideos.clear();
    this.preloadingVideos.clear();
  }

  /**
   * 预创建数字人视频
   */
  private async precreateDigitalHumanVideos(digital_human_list: string[]) {
    if (!this.digitalHumanVirtualmanKey) {
      console.warn('VirtualmanKey尚未加载，无法预创建视频。');
      // 可以在此处添加逻辑，等待virtualmanKey加载后再执行
      return;
    }

    for (const text of digital_human_list) {
      if (!text || !text.trim()) continue;
      try {
        // 注意：这里只创建任务，不等待视频生成完成
        await sendHttpRequest({
          url: '/sdk/v1/virtual-human/create-video',
          method: 'POST',
          data: {
            VirtualmanKey: this.digitalHumanVirtualmanKey,
            InputSsml: text,
            SpeechParam: {
              Speed: 1,
            },
            VideoParam: {
              Format: 'TransparentWebm',
            },
            DriverType: 'Text',
          },
        });
      } catch (error) {
        console.error(`为文本 "${text}" 创建视频任务失败:`, error);
        // 可以选择性地报告错误
        SentryReporter.captureError(error, {
          action: 'precreateDigitalHumanVideos',
          component: 'pcm-virtual-chat-modal',
          title: `为文本 "${text}" 创建视频任务失败`,
        });
      }
    }
    console.log('数字人视频预创建任务已全部发送。');
  }


  /**
   * 初始化数字人功能
   */
  private async initializeDigitalHuman() {
    if (!this.digitalId) return;

    try {
      console.log('初始化数字人功能，digitalId:', this.digitalId);
      const response = await sendHttpRequest({
        url: '/sdk/v1/virtual-human/avatar-detail',
        method: 'POST',
        data: {
          avatar_id: this.digitalId
        }
      });

      if (response.success) {
        const { placeholder_video_url, virtualman_key, opening_contents } = response.data;

        if (placeholder_video_url) {
          this.digitalHumanDefaultVideoUrl = placeholder_video_url;
          this.digitalHumanVideoUrl = placeholder_video_url;
        }

        if (virtualman_key) {
          this.digitalHumanVirtualmanKey = virtualman_key;
        }

        // 处理开场白内容（JSON格式）
        if (opening_contents && Array.isArray(opening_contents) && opening_contents.length > 0) {
          this.digitalHumanOpeningContents = opening_contents;
          
          // 验证并调整开场白索引
          const validIndex = Math.max(0, Math.min(2, this.openingIndex || 0)); // 限制索引范围0-2
          const selectedOpeningContent = this.digitalHumanOpeningContents[validIndex] || this.digitalHumanOpeningContents[0];
          
          // 按顺序准备预加载列表：1.选择的欢迎视频 2.默认占位视频 3.其他视频
          const orderedVideosToPreload: string[] = [];
          
          // 1. 首先加载选择的欢迎视频
          if (selectedOpeningContent.video_url) {
            orderedVideosToPreload.push(selectedOpeningContent.video_url);
          }
          
          // 2. 然后加载默认占位视频（如果不同于选择的欢迎视频）
          if (placeholder_video_url && placeholder_video_url !== selectedOpeningContent.video_url) {
            orderedVideosToPreload.push(placeholder_video_url);
          }
          

          console.log('数字人初始化完成:', {
            defaultVideoUrl: this.digitalHumanDefaultVideoUrl,
            virtualmanKey: this.digitalHumanVirtualmanKey,
            openingContents: this.digitalHumanOpeningContents,
            selectedOpeningIndex: validIndex,
            selectedOpeningContent,
            orderedVideosToPreload
          });

          // 使用顺序预加载
          this.handleVideoUrlReceivedSequential(orderedVideosToPreload, '数字人初始化(顺序)');

          // 播放选择的欢迎视频
          if (selectedOpeningContent.video_url) {
            console.log('播放数字人欢迎视频:', selectedOpeningContent.video_url, '索引:', validIndex);
            this.playDigitalHumanVideo(selectedOpeningContent.video_url, true);
          }
        } else {
          // 没有欢迎视频，只预加载默认占位视频
          if (placeholder_video_url) {
            this.handleVideoUrlReceivedSequential([placeholder_video_url], '数字人初始化(仅默认视频)');
          }
        }

      }
    } catch (error) {
      console.error('初始化数字人失败:', error);
      SentryReporter.captureError(error, {
        action: 'initializeDigitalHuman',
        component: 'pcm-virtual-chat-modal',
        title: '数字人初始化失败',
      });
    }
  }

  /**
   * 生成数字人视频
   */
  private async generateDigitalHumanVideo(text: string) {
    if (!text.trim() || !this.digitalHumanVirtualmanKey) {

      // 条件不满足时，取消等待状态并直接开始录制流程
      if (this.waitingForDigitalHuman && !this.isTaskCompleted) {
        console.log('数字人视频生成条件不满足，直接开始录制流程');
        this.waitingForDigitalHuman = false;
        this.startWaitingToRecord();
      }
      return;
    }

    console.log('开始生成数字人视频，文本内容：', text);

    try {
      // 创建视频任务
      const createResponse = await sendHttpRequest({
        url: '/sdk/v1/virtual-human/create-video',
        method: 'POST',
        data: {
          VirtualmanKey: this.digitalHumanVirtualmanKey,
          InputSsml: text,
          SpeechParam: {
            Speed: 1
          },
          VideoParam: {
            Format: 'TransparentWebm',
          },
          DriverType: "Text",
        }
      });

      console.log('数字人视频创建响应:', createResponse);

      if (!createResponse.success) {
        throw new Error(`创建视频任务失败: ${createResponse.message}`);
      }

      const taskId = createResponse.data.Payload.TaskId;
      console.log('视频任务创建成功，TaskId:', taskId);

      // 轮询查询进度
      const videoUrl = await this.pollVideoProgress(taskId);

      if (videoUrl) {
        // 立即预加载新生成的视频（单个视频，不需要顺序处理）
        await this.preloadVideo(videoUrl);
        await this.playDigitalHumanVideo(videoUrl);
        console.log('数字人视频生成完成，视频URL:', videoUrl);
      } else {
        // 如果没有获取到视频URL，抛出错误
        throw new Error('未能获取到数字人视频URL');
      }

    } catch (error) {
      console.error('数字人视频生成失败:', error);
      SentryReporter.captureError(error, {
        action: 'generateDigitalHumanVideo',
        component: 'pcm-virtual-chat-modal',
        title: '数字人视频生成失败',
      });

      // 数字人视频生成失败时，取消等待状态并直接开始录制流程
      if (this.waitingForDigitalHuman && !this.isTaskCompleted) {
        console.log('数字人视频生成失败，直接开始录制流程');
        this.waitingForDigitalHuman = false;
        this.startWaitingToRecord();
      }
    }
  }

  /**
   * 轮询查询视频生成进度
   */
  private async pollVideoProgress(taskId: string): Promise<string | null> {
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await sendHttpRequest({
          url: '/sdk/v1/virtual-human/query-progress',
          method: 'POST',
          data: {
            TaskId: taskId
          }
        });

        if (!response.success) {
          throw new Error(`查询进度失败: ${response.message}`);
        }

        const payload = response.data.Payload;
        console.log(`视频生成进度: ${payload.Progress}%, 状态: ${payload.Status}`);

        if (payload.Status === 'SUCCESS' && payload.Progress === 100) {
          return payload.MediaUrl;
        } else if (payload.Status === 'FAILED') {
          throw new Error(`视频生成失败: ${payload.FailMessage}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error('轮询视频进度失败:', error);
        break;
      }
    }

    throw new Error('视频生成超时');
  }

  /**
   * 播放数字人视频
   */
  private async playDigitalHumanVideo(videoUrl: string, isWelcomeVideo: boolean = false) {
    console.log('开始播放数字人视频:', videoUrl, '是否为欢迎视频:', isWelcomeVideo);

    try {
      // 确保视频已预加载（如果未预加载则立即预加载）
      await this.preloadVideo(videoUrl);

      // 只通过状态来控制video元素
      this.digitalHumanVideoUrl = videoUrl;
      this.isPlayingDigitalHumanVideo = true;
      this.digitalHumanVideoReady = true;
      this.isPlayingWelcomeVideo = isWelcomeVideo;

      console.log('数字人视频状态已更新:', {
        videoUrl: this.digitalHumanVideoUrl,
        isPlaying: this.isPlayingDigitalHumanVideo,
        muted: !this.isPlayingDigitalHumanVideo,
        isWelcomeVideo: this.isPlayingWelcomeVideo
      });

    } catch (error) {
      console.error('播放数字人视频失败:', error);

      // 数字人视频播放失败时，取消等待状态并直接开始录制流程
      if (this.waitingForDigitalHuman && !this.isTaskCompleted) {
        console.log('数字人视频播放失败，直接开始录制流程');
        this.waitingForDigitalHuman = false;
        this.startWaitingToRecord();
      }
    }
  }

  /**
   * 智能视频预加载管理器
   * 确保每个视频只预加载一次，避免重复请求
   */
  private async preloadVideo(videoUrl: string): Promise<void> {
    if (!videoUrl || !videoUrl.trim()) {
      return Promise.resolve();
    }

    const normalizedUrl = videoUrl.trim();
    const fileName = normalizedUrl.split('/').pop() || normalizedUrl;

    // 如果已经预加载过，直接返回
    if (this.preloadedVideos.has(normalizedUrl)) {
      console.log(`💾 视频已预加载，跳过: ${fileName.substring(0, 30)}${fileName.length > 30 ? '...' : ''}`);
      return Promise.resolve();
    }

    // 如果正在预加载中，返回现有的Promise
    if (this.preloadingVideos.has(normalizedUrl)) {
      console.log(`🔄 视频正在预加载中，等待完成: ${fileName.substring(0, 30)}${fileName.length > 30 ? '...' : ''}`);
      return this.preloadingVideos.get(normalizedUrl)!;
    }

    // 创建新的预加载Promise
    const preloadPromise = this.executeVideoPreload(normalizedUrl);
    this.preloadingVideos.set(normalizedUrl, preloadPromise);

    try {
      await preloadPromise;
      // 预加载成功，添加到已预加载集合
      this.preloadedVideos.add(normalizedUrl);
      console.log(`🎯 视频预加载成功: ${fileName.substring(0, 30)}${fileName.length > 30 ? '...' : ''}`);
    } catch (error) {
      console.error(`💥 视频预加载失败: ${fileName.substring(0, 30)}${fileName.length > 30 ? '...' : ''}`, error);
      // 预加载失败时不抛出错误，避免阻塞后续流程
    } finally {
      // 清理正在预加载的记录
      this.preloadingVideos.delete(normalizedUrl);
    }
  }

  /**
   * 执行实际的视频预加载操作
   */
  private async executeVideoPreload(videoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const preloadVideo = document.createElement('video');
      preloadVideo.preload = 'auto';
      preloadVideo.src = videoUrl;
      preloadVideo.muted = true; // 确保可以自动播放
      preloadVideo.crossOrigin = 'anonymous'; // 处理跨域问题

      let isResolved = false;

      const handleSuccess = () => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        console.log('视频预加载完成:', videoUrl);
        resolve();
      };

      const handleError = (event?: any) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        console.error('视频预加载失败:', videoUrl, event);
        reject(new Error('视频预加载失败'));
      };

      const cleanup = () => {
        preloadVideo.removeEventListener('canplaythrough', handleSuccess);
        preloadVideo.removeEventListener('loadeddata', handleSuccess);
        preloadVideo.removeEventListener('error', handleError);
        preloadVideo.removeEventListener('abort', handleError);
        preloadVideo.src = '';
      };

      // 监听多种成功事件，提高兼容性
      preloadVideo.addEventListener('canplaythrough', handleSuccess);
      preloadVideo.addEventListener('loadeddata', handleSuccess);
      
      // 监听错误事件
      preloadVideo.addEventListener('error', handleError);
      preloadVideo.addEventListener('abort', handleError);

      // 设置超时机制，避免长时间等待
      setTimeout(() => {
        if (!isResolved) {
          console.warn('视频预加载超时:', videoUrl);
          handleError('timeout');
        }
      }, 15000); // 15秒超时

      // 开始加载
      preloadVideo.load();
    });
  }

  /**
   * 顺序预加载多个视频
   * 上一个视频加载完毕后立刻加载下一个视频
   */
  private async sequentialPreloadVideos(videoUrls: string[]): Promise<void> {
    if (!videoUrls || videoUrls.length === 0) {
      return;
    }

    const validUrls = videoUrls.filter(url => url && url.trim());
    if (validUrls.length === 0) {
      return;
    }

    console.log('🎬 开始顺序预加载视频:', validUrls);
    console.log('📋 预加载计划:');
    validUrls.forEach((url, index) => {
      const fileName = url.split('/').pop() || url;
      console.log(`  ${index + 1}. ${fileName.substring(0, 50)}${fileName.length > 50 ? '...' : ''}`);
    });

    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      const fileName = url.split('/').pop() || url;
      
      try {
        console.log(`⏳ [${i + 1}/${validUrls.length}] 正在预加载: ${fileName.substring(0, 50)}${fileName.length > 50 ? '...' : ''}`);
        const startTime = Date.now();
        
        await this.preloadVideo(url);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [${i + 1}/${validUrls.length}] 预加载完成 (${duration}ms): ${fileName.substring(0, 50)}${fileName.length > 50 ? '...' : ''}`);
      } catch (error) {
        console.warn(`❌ [${i + 1}/${validUrls.length}] 预加载失败: ${fileName.substring(0, 50)}${fileName.length > 50 ? '...' : ''}`, error);
        // 即使单个视频失败，也继续加载下一个
      }
    }

    console.log('🎉 所有视频顺序预加载处理完成');
  }

  
  /**
   * 顺序视频URL处理器
   * 一旦获得视频URL，按顺序预加载
   */
  private handleVideoUrlReceivedSequential(videoUrls: string[], context: string = ''): void {
    if (!videoUrls || videoUrls.length === 0) return;

    const validUrls = videoUrls.filter(url => url && url.trim());
    if (validUrls.length === 0) return;

    console.log(`📥 收到${validUrls.length}个视频URL，将按顺序预加载 (${context})`);

    // 异步顺序预加载，不阻塞主流程
    this.sequentialPreloadVideos(validUrls).catch(error => {
      console.warn(`⚠️ 顺序预加载视频失败 (${context}):`, error);
    });
  }

  /**
   * 处理数字人视频播放结束
   */
  private handleVideoElementEnded = () => {
    if (this.isPlayingDigitalHumanVideo) {
      console.log('数字人视频播放完成，是否为欢迎视频:', this.isPlayingWelcomeVideo);

      // 只通过状态来控制video元素，恢复默认视频
      this.digitalHumanVideoUrl = this.digitalHumanDefaultVideoUrl;
      this.isPlayingDigitalHumanVideo = false;
      const wasWelcomeVideo = this.isPlayingWelcomeVideo;
      this.isPlayingWelcomeVideo = false;

      console.log('恢复默认视频状态:', {
        videoUrl: this.digitalHumanVideoUrl,
        isPlaying: this.isPlayingDigitalHumanVideo,
        muted: !this.isPlayingDigitalHumanVideo
      });

      // 只有非欢迎视频播放完成后，才开始录制流程
      if (this.waitingForDigitalHuman && !this.isTaskCompleted && !wasWelcomeVideo) {
        this.waitingForDigitalHuman = false;
        this.startWaitingToRecord();
      }
    }
  };

  private renderChatHistory() {
    // 如果正在播放欢迎视频，优先显示欢迎语
    if (this.isPlayingWelcomeVideo) {
      // 验证并调整开场白索引
      const validIndex = Math.max(0, Math.min(2, this.openingIndex || 0)); // 限制索引范围0-2
      const selectedOpeningContent = this.digitalHumanOpeningContents[validIndex] || this.digitalHumanOpeningContents[0];
      const welcomeText = selectedOpeningContent.text;

      return (
        <div class="ai-message-item">
          <div class="ai-message-content">{welcomeText}</div>
        </div>
      );
    }

    // 优先显示正在流式输出的消息
    if (this.currentStreamingMessage && this.currentStreamingMessage.answer) {
      return (
        <div class="ai-message-item streaming">
          <div class="ai-message-content" innerHTML={this.currentStreamingMessage.answer}></div>
          {this.currentStreamingMessage.isStreaming && (
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      );
    }

    // 找到最后一条有AI回复的消息
    const lastMessageWithAnswer = [...this.messages].reverse().find(msg => msg.answer && msg.answer.trim());

    if (lastMessageWithAnswer) {
      return (
        <div class="ai-message-item">
          <div class="ai-message-content" innerHTML={lastMessageWithAnswer.answer}></div>
        </div>
      );
    }

    return (
      <div class="ai-message-item">
        <div class="ai-message-content">请稍等，我查看一下本次面试的信息...</div>
      </div>
    );
  }

  render() {
    if (!this.isOpen) return null;

    const modalStyle = {
      zIndex: String(this.zIndex),
    };

    const containerClass = {
      'modal-container': true,
      'fullscreen': this.fullscreen,
      'digital-human-mode': !!this.digitalId,
    };

    const overlayClass = {
      'modal-overlay': true,
      'fullscreen-overlay': this.fullscreen,
    };

    return (
      <div class={overlayClass} style={modalStyle}>
        <div class={containerClass}>
          {/* 数字人全屏背景视频层 */}
          {this.digitalId && this.digitalHumanVideoUrl && (
            <div class="digital-human-background">
              <video
                autoplay
                playsinline
                loop={!this.isPlayingDigitalHumanVideo}
                muted={!this.isPlayingDigitalHumanVideo}
                src={this.digitalHumanVideoUrl}
                class="digital-human-background-video"
                ref={el => (this.digitalHumanVideoElement = el)}
                onEnded={this.handleVideoElementEnded}
                onLoadedData={() => console.log('视频数据加载完成:', this.digitalHumanVideoUrl)}
                onPlay={() => console.log('视频开始播放:', this.digitalHumanVideoUrl, '静音:', !this.isPlayingDigitalHumanVideo)}
                onVolumeChange={() => console.log('音量变化:', this.digitalHumanVideoElement?.muted, this.digitalHumanVideoElement?.volume)}
              />
            </div>
          )}

          {this.renderVideoPreview()}

          {/* 内容层 */}
          <div class="modal-content-layer">
            <div class="main-content">
              {/* 聊天历史记录 */}
              <div class="chat-history-section">{this.renderChatHistory()}</div>
              {this.renderRecordingStatusBar()}
            </div>
          </div>

          {/* 二次确认模态框 */}
          <div style={{ position: 'relative', zIndex: '100' }}>
            <pcm-confirm-modal
              isOpen={this.showConfirmModal}
              modalTitle="确认完成回答？"
              okText="确认完成"
              cancelText="继续录制"
              okType="danger"
              onOk={this.handleConfirmModalOk}
              onCancel={this.handleConfirmModalCancelEvent}
              onClosed={this.handleConfirmModalCancel}
            >
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#1890ff',
                    fontWeight: '500',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                >
                  当前录制时长：
                  {(() => {
                    const elapsedSeconds = this.recordingStartTime > 0 ? Math.floor((Date.now() - this.recordingStartTime) / 1000) : 0;
                    const minutes = Math.floor(elapsedSeconds / 60);
                    const seconds = elapsedSeconds % 60;
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                  })()}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: '#fff7e6',
                    border: '1px solid #ffec99',
                    borderRadius: '6px',
                    color: '#d46b08',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <span>注意：录制仍在进行中</span>
                </div>

                <div
                  style={{
                    fontSize: '16px',
                    color: '#595959',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                  }}
                >
                  点击"确认完成"将结束本题回答
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '8px 0',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#1890ff',
                      cursor: 'pointer',
                      margin: '0',
                    }}
                    checked={this.skipConfirmThisInterview}
                    onChange={this.handleSkipConfirmChange}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#595959',
                      cursor: 'pointer',
                      lineHeight: '1.4',
                    }}
                  >
                    本次面试不再提醒
                  </span>
                </label>
              </div>
            </pcm-confirm-modal>
          </div>
        </div>
      </div>
    );
  }

  private renderVideoPreview() {
    if (!this.showRecordingUI) {
      return null;
    }
    return (
      <div class="recording-preview-top-right">
        <video
          class="user-video-preview"
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
          ref={el => {
            if (el && this.recordingStream && !this.videoRef) {
              this.videoRef = el;
            }
          }}
        />
      </div>
    );
  }

  private renderRecordingStatusBar() {
    if (this.showRecordingUI) {
      const minutes = Math.floor(this.recordingTimeLeft / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (this.recordingTimeLeft % 60).toString().padStart(2, '0');

      return (
        <div class="recording-status-bar">
          <div class="audio-waveform">
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
            <div class="waveform-bar"></div>
          </div>
          <span class="recording-timer">
            {minutes}:{seconds}
          </span>
          <button class="finish-recording-btn" onClick={() => this.handleStopRecording()}>
            <img
              src="https://pcm-resource-1312611446.cos.ap-guangzhou.myqcloud.com/sdk/icon/gou.png"
              width="16"
              height="16"
              alt="完成"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </button>
        </div>
      );
    }

    return <div class="recording-status-bar">{this.renderStatusIndicator()}</div>;
  }

  private renderStatusIndicator() {
    // 优先显示设备错误
    if (this.deviceError) {
      return (
        <div class="status-indicator-text error">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <span>{this.deviceError}</span>
        </div>
      );
    }

    // 任务完成
    if (this.isTaskCompleted) {
      return (
        <div class="status-indicator-text">
          <span>面试已完成</span>
        </div>
      );
    }

    // 等待数字人
    if (this.waitingForDigitalHuman && this.digitalId) {
      return (
        <div class="status-indicator-text loading">
          <div class="loading-spinner-small"></div>
          <span>AI正在查看面试信息...</span>
        </div>
      );
    }

    // 上传视频中
    if (this.isUploadingVideo) {
      return (
        <div class="status-indicator-text loading">
          <div class="loading-spinner-small"></div>
          <span>正在分析...</span>
        </div>
      );
    }

    // 等待题目
    if (this.isLoading || this.currentStreamingMessage) {
      return (
        <div class="status-indicator-text loading">
          <div class="loading-spinner-small"></div>
          <span>等待题目...</span>
        </div>
      );
    }

    // 等待录制
    if (this.waitingToRecord) {
      return (
        <div class="status-indicator-text">
          <span>{this.waitingTimeLeft} 秒后开始</span>
        </div>
      );
    }

    // 准备就绪
    return (
      <div class="status-indicator-text ready">
        <img
          src="https://pcm-resource-1312611446.cos.ap-guangzhou.myqcloud.com/sdk/icon/gou.png"
          width="16"
          height="16"
          alt="准备就绪"
        />
        <span>准备就绪</span>
      </div>
    );
  }
}

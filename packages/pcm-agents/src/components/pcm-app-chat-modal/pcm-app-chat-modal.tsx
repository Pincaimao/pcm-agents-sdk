import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest, uploadFileToBackend, fetchAgentInfo, synthesizeAudio } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';
import {
  StreamCompleteEventData,
  ConversationStartEventData,
  InterviewCompleteEventData,
  RecordingErrorEventData,
  RecordingStatusChangeEventData
} from '../../interfaces/events';
import { marked } from 'marked';
import { ErrorEventBus } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store'; // 导入 authStore

@Component({
  tag: 'pcm-app-chat-modal',
  styleUrls: ['pcm-app-chat-modal.css','../../global/markdown.css', ],
  shadow: true,
})
export class ChatAPPModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '在线客服';

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
  @Event() streamComplete: EventEmitter<StreamCompleteEventData>;

  /**
   * 新会话开始的回调，只会在一轮对话开始时触发一次
   */
  @Event() conversationStart: EventEmitter<ConversationStartEventData>;

  @State() isUploading: boolean = false;

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
   * 是否通过对话轮数控制结束
   */
  @Prop() isControlByQuestionNumber: boolean = false;

  /**
   * 控制对话轮数
   */
  @Prop() totalQuestions: number = 10;

  /**
   * 当前轮数
   */
  @State() currentQuestionNumber: number = 0;


  /**
   * 当聊天完成时触发
   */
  @Event() interviewComplete: EventEmitter<InterviewCompleteEventData>;

  private readonly SCROLL_THRESHOLD = 30;



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

  // 添加语音输入相关状态
  @State() isRecordingAudio: boolean = false;
  @State() audioRecorder: MediaRecorder | null = null;
  @State() audioChunks: BlobPart[] = [];
  @State() isConvertingAudio: boolean = false;
  @State() audioRecordingTimeLeft: number = 60; // 最大录音时间（秒）
  @State() audioRecordingTimer: any = null;
  @State() audioRecordingStartTime: number = 0;

  /**
   * 语音录制最大时长（秒）
   */
  @Prop() maxAudioRecordingTime: number = 60;

  /**
   * 用户头像URL
   */
  @Prop() userAvatar?: string = "https://pub.pincaimao.com/static/common/i_pcm_logo.png";

  /**
   * 助手头像URL
   */
  @Prop() assistantAvatar?: string;

  /**
   * 智能体头像URL（从后端获取）
   */
  @State() agentLogo: string = '';

  /**
   * 是否显示进度条
   * true: 显示进度条
   * false: 隐藏进度条
   */
  @Prop() showProgressBar: boolean = true;

  // 添加新的状态属性来跟踪任务是否已完成
  @State() isTaskCompleted: boolean = false;

  private tokenInvalidListener: () => void;

  /**
   * 是否显示复制按钮
   */
  @Prop() showCopyButton: boolean = true;

  /**
   * 是否显示点赞点踩按钮
   */
  @Prop() showFeedbackButtons: boolean = true;

  /**
   * 附件预览模式
   * 'drawer': 在右侧抽屉中预览
   * 'window': 在新窗口中打开
   */
  @Prop() filePreviewMode: 'drawer' | 'window' = 'window';

  // 添加新的状态来管理抽屉
  @State() isDrawerOpen: boolean = false;
  @State() previewUrl: string = '';
  @State() previewFileName: string = '';

  // 添加内容类型状态
  @State() previewContentType: 'file' | 'markdown' | 'text' = 'file';
  @State() previewContent: string = '';

  @Watch('token')
  handleTokenChange(newToken: string) {
    // 当传入的 token 变化时，更新 authStore 中的 token
    if (newToken && newToken !== authStore.getToken()) {
      authStore.setToken(newToken);
    }
  }

  constructor() {
    // 配置 marked 选项
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

  private handleClose = () => {
    this.stopRecording();
    this.modalClosed.emit();
  };

  // 添加获取智能体信息的方法
  private async fetchAgentLogo() {
    if (!this.botId) return;

    try {
      const agentInfo = await fetchAgentInfo(this.botId);
      
      if (agentInfo && agentInfo.logo) {
        this.agentLogo = agentInfo.logo;
      }
    } catch (error) {
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[fetchAgentLogo]',
        error: error,
        message: '获取智能体信息失败',
        type: 'network'
      });
      console.error('获取智能体信息失败:', error);
    }
  }

  private async sendMessageToAPI(message: string, videoUrl?: string) {
    this.isLoading = true;
    let answer = '';
    let llmText = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 修改消息处理逻辑，移除文件上传相关代码
    const queryText = message.trim() || '请开始';

    // 检查是否是最后一题
    const isLastQuestion = this.currentQuestionNumber >= this.totalQuestions;

    // 创建新的消息对象，统一对齐消息结构
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,  // 临时ID，将被服务器返回的ID替换
      conversation_id: this.conversationId,  // 会话ID
      parent_message_id: "00000000-0000-0000-0000-000000000000", // 默认父消息ID
      inputs: this.customInputs || {},  // 输入参数
      query: queryText,  // 用户输入的消息内容
      answer: '',  // 初始为空
      message_files: [],  // 消息附件
      feedback: {},  // 反馈
      retriever_resources: [],  // 检索资源
      created_at: Math.floor(Date.now() / 1000).toString(),  // 创建时间
      agent_thoughts: [],  // 代理思考过程
      status: "normal",  // 消息状态
      error: null,  // 错误信息
      // 添加组件内部使用的字段
      time: time,  // 消息时间（显示用）
      isStreaming: true  // 是否正在流式输出
    };

    // 设置当前流式消息
    this.currentStreamingMessage = newMessage;

    this.shouldAutoScroll = true;
    // 滚动到底部
    this.scrollToBottom();

    // 如果是最后一题，直接显示结束消息并完成面试
    if (isLastQuestion && this.isControlByQuestionNumber) {
      this.messages = [...this.messages, newMessage];
      this.currentStreamingMessage = null;
      this.isLoading = false;
      await this.completeInterview();
      this.interviewComplete.emit({
        conversation_id: this.conversationId,
        current_question_number: this.currentQuestionNumber,
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
      url: '/sdk/v1/chat/chat-messages',
      method: 'POST',
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
        }

        // 添加对任务结束的判断
        if (data.event === 'node_finished' && data.data.title && data.data.title.includes('聘才猫任务结束')) {
          console.log('检测到任务结束事件:', data);

          // 设置标志，表示任务已结束
          this.isTaskCompleted = true;

          // 触发面试完成事件
          this.interviewComplete.emit({
            conversation_id: this.conversationId,
            current_question_number: this.currentQuestionNumber,
            total_questions: this.totalQuestions
          });
        }

        if (data.event === 'message') {
          const inputMessage: UserInputMessageType = { message: message };
          convertWorkflowStreamNodeToMessageRound('message', inputMessage, data);

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
                parent_message_id: data.parent_message_id || this.currentStreamingMessage.parent_message_id,
                retriever_resources: data.retriever_resources || this.currentStreamingMessage.retriever_resources,
                agent_thoughts: data.agent_thoughts || this.currentStreamingMessage.agent_thoughts
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
        ErrorEventBus.emitError({
          source: 'pcm-app-chat-modal[sendMessageToAPI]',
          error: error,
          message: '消息发送失败，请稍后再试',
          type: 'network'
        });
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
        // 发送第一条消息后，清空 customInputs
        setTimeout(() => {
          if (this.customInputs) {
            Object.keys(this.customInputs).forEach(key => {
              delete this.customInputs[key];
            });
          }
        }, 1000); // 给一些时间让第一条消息处理完成

        // 获取最新的AI回复内容
        const latestAIMessage = this.currentStreamingMessage;
        latestAIMessage.isStreaming = false;
        // 更新消息列表
        this.messages = [...this.messages, latestAIMessage];

        this.currentStreamingMessage = null;

        // 增加题目计数
        this.currentQuestionNumber++;

        if (this.isTaskCompleted) {
          return;
        }

        if (latestAIMessage && latestAIMessage.answer) {
          // 优先使用 LLMText，如果没有则使用 answer
          const textForSynthesis = llmText || latestAIMessage.answer;

          if (textForSynthesis && this.enableTTS) {
            // 使用工具函数合成语音
            const audioUrl = await synthesizeAudio(textForSynthesis);

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


  // 修改加载历史消息的方法
  private async loadHistoryMessages() {
    if (!this.conversationId) return;

    this.isLoadingHistory = true;
    console.log('加载历史消息...');

    try {
      const result = await sendHttpRequest({
        url: '/sdk/v1/chat/messages',
        method: 'GET',
        data: {
          conversation_id: this.conversationId,
          bot_id: this.botId,
          limit: 20
        }
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
            parent_message_id: msg.parent_message_id || "00000000-0000-0000-0000-000000000000",
            inputs: msg.inputs || {},
            query: msg.query || "",
            answer: msg.answer || "",
            message_files: msg.message_files || [],
            feedback: msg.feedback || {},
            retriever_resources: msg.retriever_resources || [],
            created_at: msg.created_at,
            agent_thoughts: msg.agent_thoughts || [],
            status: msg.status || "normal",
            error: msg.error,
            // 组件内部使用的字段
            time: timeStr,
            isStreaming: false
          };
        });

        this.messages = formattedMessages;
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[loadHistoryMessages]',
        error: error,
        message: '加载历史消息失败，请刷新重试',
        type: 'network'
      });
    } finally {
      this.isLoadingHistory = false;
      requestAnimationFrame(() => {
        this.shouldAutoScroll = true;
        this.scrollToBottom();
      });
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

  // 修改 componentWillLoad 生命周期方法
  componentWillLoad() {
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
    if (!this.assistantAvatar && this.botId) {
      
      this.fetchAgentLogo();
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
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[startRecording]',
        error: error,
        message: '无法访问摄像头或麦克风，请确保已授予权限',
        type: 'network'
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
            ErrorEventBus.emitError({
              source: 'pcm-app-chat-modal[setupVideoPreview]',
              error: err,
              message: '视频播放失败',
              type: 'ui'
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
            ErrorEventBus.emitError({
              source: 'pcm-app-chat-modal[setupVideoPreview]',
              error: urlError,
              message: '创建对象URL失败',
              type: 'network'
            });
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
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[convertAudioToText]',
        error: error,
        message: '音频转文字错误',
        type: 'network'
      });
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
        
      }, {
        'tags': 'other'
      });
      // 使用 cos_key 作为视频标识符
      // 调用音频转文字API
      const transcriptionText = await this.convertAudioToText(fileInfo.cos_key);

      // 发送"下一题"请求，可以附带转录文本
      this.sendMessageToAPI(transcriptionText || "下一题", fileInfo.cos_key);

    } catch (error) {
      console.error('视频上传或处理错误:', error);
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[uploadRecordedVideo]',
        error: error,
        message: '视频上传或处理失败',
        type: 'network'
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
        query: "我已经回答完毕，请结束面试",
        inputs: {
          // 合并自定义输入参数
          ...this.customInputs
        }
      };

      // 使用sendHttpRequest发送请求
      sendHttpRequest({
        url: '/sdk/v1/chat/chat-messages',
        method: 'POST',
        data: requestData
      }).catch(error => {
        console.error('发送面试完成请求失败:', error);
        ErrorEventBus.emitError({
          source: 'pcm-app-chat-modal[completeInterview]',
          error: error,
          message: '发送面试完成请求失败',
          type: 'network'
        });
      });

    } catch (error) {
      console.error('发送面试完成请求失败:', error);
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
        ErrorEventBus.emitError({
          source: 'pcm-app-chat-modal[playAudio]',
          error: '音频播放错误',
          message: '音频播放错误',
          type: 'ui'
        });
        this.isPlayingAudio = false;
        this.audioUrl = null;
        resolve();
      };

      this.audioElement.play().catch(error => {
        console.error('音频播放失败:', error);
        ErrorEventBus.emitError({
          source: 'pcm-app-chat-modal[playAudio]',
          error: error,
          message: '音频播放失败',
          type: 'ui'
        });
        this.isPlayingAudio = false;
        this.audioUrl = null;
        resolve();
      });
    });
  }

  // 修改 componentDidLoad 生命周期方法，确保组件卸载时释放资源
  disconnectedCallback() {
    document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);
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

    // 清理音频录制计时器
    if (this.audioRecordingTimer) {
      clearInterval(this.audioRecordingTimer);
      this.audioRecordingTimer = null;
    }

    // 停止录制
    this.stopRecording();

    // 停止音频录制
    this.stopAudioRecording();
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
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[submitTextAnswer]',
        error: error,
        message: '提交文本回答失败',
        type: 'network'
      });
    } finally {
      this.isSubmittingText = false;
    }
  };

  // 处理语音输入按钮点击
  private handleVoiceInputClick = () => {
    if (this.isRecordingAudio) {
      this.stopAudioRecording();
    } else {
      // 直接在用户交互事件处理程序中请求权限
      // 不使用 async/await，而是使用 Promise 链
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // 权限已获取，开始录音
          this.startRecordingWithStream(stream);
        })
        .catch(error => {
          console.error('麦克风权限请求失败:', error);
          ErrorEventBus.emitError({
            source: 'pcm-app-chat-modal[handleVoiceInputClick]',
            error: error,
            message: '麦克风权限请求失败',
            type: 'ui'
          });
        });
    }
  };

  // 新方法：使用已获取的媒体流开始录音
  private startRecordingWithStream(stream: MediaStream) {
    try {
      // 检测浏览器支持的音频MIME类型
      const mimeType = this.getSupportedAudioMimeType();

      // 创建MediaRecorder实例
      let audioRecorder;
      try {
        audioRecorder = new MediaRecorder(stream, {
          mimeType: mimeType
        });
      } catch (e) {
        console.warn('指定的音频MIME类型不受支持，使用默认设置:', e);
        try {
          audioRecorder = new MediaRecorder(stream);
        } catch (recorderError) {
          // 停止并释放媒体流
          stream.getTracks().forEach(track => track.stop());
          console.error('无法创建音频录制器:', recorderError);
          ErrorEventBus.emitError({
            source: 'pcm-app-chat-modal[startRecordingWithStream]',
            error: recorderError,
            message: '无法创建音频录制器',
            type: 'ui'
          });
          return;
        }
      }

      this.audioRecorder = audioRecorder;
      this.audioChunks = [];
      this.isRecordingAudio = true;
      this.audioRecordingStartTime = Date.now();
      this.audioRecordingTimeLeft = this.maxAudioRecordingTime;

      // 设置数据可用事件处理
      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 设置录制停止事件处理
      audioRecorder.onstop = () => {
        // 停止并释放媒体流
        stream.getTracks().forEach(track => track.stop());

        // 处理录制的音频
        this.processAudioRecording();
      };

      // 开始录制
      audioRecorder.start(100); // 每100毫秒获取一次数据

      // 设置录制计时器
      this.audioRecordingTimer = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - this.audioRecordingStartTime) / 1000);
        this.audioRecordingTimeLeft = Math.max(0, this.maxAudioRecordingTime - elapsedTime);

        // 时间到自动停止录制
        if (this.audioRecordingTimeLeft <= 0) {
          this.stopAudioRecording();
        }
      }, 1000);

    } catch (error) {
      // 停止并释放媒体流
      stream.getTracks().forEach(track => track.stop());
      console.error('开始录音失败:', error);
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[startRecordingWithStream]',
        error: error,
        message: '开始录音失败，请确保麦克风设备正常工作',
        type: 'ui'
      });
    }
  }

  // 处理录制的音频
  private async processAudioRecording() {
    if (this.audioChunks.length === 0) {
      console.warn('没有录制到音频数据');
      return;
    }

    try {
      this.isConvertingAudio = true;

      // 创建音频Blob
      const audioType = this.getSupportedAudioMimeType() || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: audioType });

      if (audioBlob.size === 0) {
        console.warn('录制的音频为空');
        this.isConvertingAudio = false;
        return;
      }

      // 创建File对象
      const fileExtension = audioType.includes('webm') ? 'webm' : 'mp3';
      const fileName = `audio_input.${fileExtension}`;
      const audioFile = new File([audioBlob], fileName, { type: audioType });

      // 上传音频文件
      const fileInfo = await uploadFileToBackend(audioFile, {
       
      }, {
        'tags': 'audio'
      });

      // 调用音频转文字API
      const transcriptionText = await this.convertAudioToText(fileInfo.cos_key);

      // 将转录文本追加到文本框，而不是替换
      if (transcriptionText) {
        // 保存当前光标位置
        const textArea = this.hostElement.shadowRoot?.querySelector('.text-answer-input') as HTMLTextAreaElement;
        const cursorPosition = textArea?.selectionStart || this.textAnswer.length;

        // 在光标位置插入识别的文本
        const beforeCursor = this.textAnswer.substring(0, cursorPosition);
        const afterCursor = this.textAnswer.substring(cursorPosition);

        // 如果当前文本不为空且不以空格结尾，添加一个空格
        const spacer = (beforeCursor.length > 0 && !beforeCursor.endsWith(' ')) ? ' ' : '';

        // 更新文本
        this.textAnswer = beforeCursor + spacer + transcriptionText + afterCursor;

        // 设置新的光标位置
        setTimeout(() => {
          if (textArea) {
            const newPosition = cursorPosition + spacer.length + transcriptionText.length;
            textArea.focus();
            textArea.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      } else {
        console.warn('未能识别语音内容');
        alert('未能识别语音内容，请重试或直接输入文字');
      }
    } catch (error) {
      console.error('处理音频录制失败:', error);
      ErrorEventBus.emitError({
        source: 'pcm-app-chat-modal[processAudioRecording]',
        error: error,
        message: '语音识别失败，请重试',
        type: 'ui'
      });
    } finally {
      this.isConvertingAudio = false;
      this.audioChunks = [];
    }
  }

  // 获取支持的音频MIME类型
  private getSupportedAudioMimeType(): string {
    // 按优先级排列的音频MIME类型列表
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
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
        console.warn(`检查音频MIME类型支持时出错 ${type}:`, e);
      }
    }

    // 如果没有找到支持的类型，返回空字符串
    console.warn('没有找到支持的音频MIME类型，将使用浏览器默认值');
    return '';
  }

  // 停止录制音频
  private stopAudioRecording() {
    if (this.audioRecorder && this.isRecordingAudio) {
      this.audioRecorder.stop();
      this.isRecordingAudio = false;

      // 清理计时器
      if (this.audioRecordingTimer) {
        clearInterval(this.audioRecordingTimer);
        this.audioRecordingTimer = null;
      }
    }
  }

  // 修改事件处理方法
  private handleFilePreviewRequest = (event: CustomEvent<{
    url?: string, 
    fileName: string, 
    content?: string,
    contentType: 'file' | 'markdown' | 'text'
  }>) => {
    const { url, fileName, content, contentType } = event.detail;
    
    this.previewFileName = fileName || '内容预览';
    this.previewContentType = contentType;
    this.previewUrl = url;
    this.previewContent = content || '';
    this.isDrawerOpen = true;
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
      // 任务已完成
      if (this.isTaskCompleted) {
        return (
          <div class="placeholder-status">
            <p>面试已完成，感谢您的参与！</p>
          </div>
        );
      }

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
          placeholder="发消息"
          value={this.textAnswer}
          onInput={this.handleTextInputChange}
          onKeyDown={this.handleKeyDown}
          disabled={this.isRecordingAudio || this.isConvertingAudio}
        ></textarea>
        <div class="input-toolbar">
          <div class="toolbar-actions">
            <button
              class={{
                'toolbar-button': true,
                'recording': this.isRecordingAudio,
                'converting': this.isConvertingAudio
              }}
              title={this.isRecordingAudio ? '点击停止录音' : this.isConvertingAudio ? '正在识别语音...' : '语音输入'}
              onClick={this.handleVoiceInputClick}
              disabled={this.isConvertingAudio || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.waitingToRecord || this.isPlayingAudio}
            >
              {this.isRecordingAudio ? (
                <div>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    <circle cx="12" cy="11" r="4" fill="red" />
                  </svg>
                  {/* <span class="recording-time">{this.audioRecordingTimeLeft}s</span> */}
                </div>
              ) : this.isConvertingAudio ? (
                <div class="converting-indicator">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                  </svg>
                </div>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          </div>
          <div
            class={{
              'send-button': true,
              'disabled': !this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.waitingToRecord || this.isPlayingAudio || this.isRecordingAudio || this.isConvertingAudio
            }}
            onClick={() => {
              if (!this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.waitingToRecord || this.isPlayingAudio || this.isRecordingAudio || this.isConvertingAudio) {
                return;
              }
              this.submitTextAnswer();
            }}
          >
            <img src="https://pcm-pub-1351162788.cos.ap-guangzhou.myqcloud.com/sdk/image/i_send.png" alt="发送" />
          </div>
        </div>
      </div>
    );


    // 确定要使用的助手头像
    const effectiveAssistantAvatar = this.assistantAvatar || this.agentLogo;

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

          <div class="chat-container">
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
                        botId={this.botId}
                        message={message}
                        userAvatar={this.userAvatar}
                        assistantAvatar={effectiveAssistantAvatar}
                        showCopyButton={this.showCopyButton}
                        showFeedbackButtons={this.showFeedbackButtons}
                        filePreviewMode={this.filePreviewMode}
                        onFilePreviewRequest={this.handleFilePreviewRequest}
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
                        botId={this.botId}
                        message={this.currentStreamingMessage}
                        userAvatar={this.userAvatar}
                        assistantAvatar={effectiveAssistantAvatar}
                        showCopyButton={this.showCopyButton}
                        showFeedbackButtons={this.showFeedbackButtons}
                        filePreviewMode={this.filePreviewMode}
                        onFilePreviewRequest={this.handleFilePreviewRequest}
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
                  <div class="video-container">
                    <div class="video-area">
                      {this.showRecordingUI ? (
                        renderVideoPreview()
                      ) : (
                        <div class="video-preview placeholder">
                          {renderPlaceholderStatus()}
                        </div>
                      )}
                      {this.showProgressBar && (
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
                      )}
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

          {/* 添加预览抽屉 */}
          <pcm-drawer
            isOpen={this.isDrawerOpen}
            drawerTitle={this.previewFileName}
            width="80%"
            zIndex={this.zIndex + 10}
            onClosed={() => {
              this.isDrawerOpen = false;
              this.previewUrl = '';
              this.previewContent = '';
            }}
          >
            {this.previewContentType === 'file' && this.previewUrl && (
              <div class="file-preview-container">
                <iframe 
                  src={this.previewUrl} 
                  frameborder="0" 
                  width="100%" 
                  height="100%"
                  style={{ border: 'none', height: 'calc(100vh - 120px)' }}
                ></iframe>
              </div>
            )}
            
            {this.previewContentType === 'markdown' && this.previewContent && (
              <div class="markdown-preview-container markdown-body" innerHTML={marked(this.previewContent)}></div>
            )}
            
            {this.previewContentType === 'text' && this.previewContent && (
              <div class="text-preview-container">
                <pre>{this.previewContent}</pre>
              </div>
            )}
          </pcm-drawer>
        </div>
      </div>
    );
  }
}
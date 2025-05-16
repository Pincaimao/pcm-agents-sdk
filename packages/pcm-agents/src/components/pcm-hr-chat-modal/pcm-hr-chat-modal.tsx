import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest, uploadFileToBackend, FileUploadResponse, synthesizeAudio, verifyApiKey } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';
import { ConversationStartEventData, InterviewCompleteEventData, StreamCompleteEventData } from '../../components';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';

@Component({
  tag: 'pcm-hr-chat-modal',
  styleUrl: 'pcm-hr-chat-modal.css',
  shadow: true,
})
export class ChatHRModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '金牌HR大赛';

  /**
   * SDK鉴权密钥
   */
  @Prop({ attribute: 'token' }) token!: string;

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

  @State() selectedFile: File | null = null;
  @State() isUploading: boolean = false;
  @State() uploadedFileInfo: FileUploadResponse[] = [];

  /**
   * 首次对话提问文本
   */
  @Prop() defaultQuery: string = '请开始出题';

  // 添加新的状态
  @State() showInitialUpload: boolean = true;
  @State() selectedJobCategory: string = '';
  @State() jobCategories: string[] = [
    '人力资源学生(实习)',
    '人力资源专员',
    '人力资源主管',
    '人力资源经理',
    '人力资源总监'
  ];

  @State() dimensions: string[] = [
    '人力资源规划',
    '招聘与配置',
    '员工关系',
    '培训与开发',
    '薪酬与绩效',
    '组织与人才发展'
  ];

  @State() selectedDimensions: string[] = [];

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
   * 总题目数量
   */
  @Prop() totalQuestions: number = 2;

  /**
   * 当前题目序号
   */
  @State() currentQuestionNumber: number = 0;


  /**
   * 当面试完成时触发
   */
  @Event() interviewComplete: EventEmitter<InterviewCompleteEventData>;

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
   * 接收报告的邮箱地址（toEmail和callbackUrl不能同时为空）
   */
  @Prop() toEmail: string = '';

  /**
   * 回调地址，用于接收报告的通知（toEmail和callbackUrl不能同时为空，举例：https://www.example.com/callback）
   */
  @Prop() callbackUrl: string = '';

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  // 添加新的状态来跟踪视频上传
  @State() isUploadingVideo: boolean = false;

  /**
   * 是否需要上传简历
   */
  @Prop() requireResume: boolean = false;

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
     * SDK密钥验证失败事件
     */
  @Event() tokenInvalid: EventEmitter<void>;

  /**
   * 是否自动播放语音问题
   */
  @Prop() enableVoice: boolean = true;

  /**
   * 是否显示题干内容
   */
  @Prop() displayContentStatus: boolean = true;

  private tokenInvalidListener: () => void;

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
  }

    // 添加全局token无效事件监听器
    this.tokenInvalidListener = () => {
      this.tokenInvalid.emit();
    };
    document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);
  }


  private handleClose = () => {
    this.stopRecording();
    this.modalClosed.emit();
  };

  private handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  };

  private async uploadFile() {
    if (!this.selectedFile || this.uploadedFileInfo.length > 0) return;

    this.isUploading = true;

    try {
      const result = await uploadFileToBackend(this.selectedFile, {
      }, {
        'tags': 'resume'
      });

      if (result) {
        this.uploadedFileInfo = [{
          cos_key: result.cos_key,
          file_name: result.file_name,
          file_size: result.file_size,
          presigned_url: result.presigned_url,
          ext: result.ext
        }];
      }
    } catch (error) {
      console.error('文件上传错误:', error);
      this.clearSelectedFile();
      alert(error instanceof Error ? error.message : '文件上传失败，请重试');
    } finally {
      this.isUploading = false;
    }
  }

  private handleUploadClick = () => {
    const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    fileInput?.click();
  };

  private clearSelectedFile = () => {
    this.selectedFile = null;
    this.uploadedFileInfo = [];
    const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  private async sendMessageToAPI(message: string) {
    this.isLoading = true;
    let answer = '';
    let llmText = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 如果消息为空但有文件，使用默认文本
    const queryText = message.trim() || (this.uploadedFileInfo.length > 0 ? '请分析这个文件' : '');

    // 获取上一条AI消息的回答内容
    const lastAIMessage = this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;

    // 保存AI提问和用户回答
    if (lastAIMessage && this.conversationId && message !== "下一题") {
      this.saveAnswer(
        this.conversationId,
        lastAIMessage.answer, // AI的提问作为question
        queryText // 用户的输入作为answer
      );
    }

    // 检查是否是最后一题的"下一题"请求
    const isLastQuestion = (this.currentQuestionNumber >= this.totalQuestions) && message === "下一题";

    // 创建新的消息对象
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,  // 消息唯一标识
      time: time,                // 消息时间
      query: queryText,          // 用户输入的消息内容
      answer: '',
      isStreaming: true,        // 是否正在流式输出
      conversation_id: this.conversationId,  // 会话ID
      inputs: {},               // 输入参数
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
      this.currentQuestionNumber++;
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
      bot_id: "3022316191018880"
    };
    requestData.inputs = {
      job_info: this.selectedJobCategory,
      dimensional_info: this.selectedDimensions.join(','),
      email: this.toEmail,
      callback_url: this.callbackUrl,
      display_content_status: this.displayContentStatus ? "1" : "0"
    };


    // 如果有上传的文件，添加到inputs参数
    if (this.uploadedFileInfo.length > 0) {
      const fileUrls = this.uploadedFileInfo.map(fileInfo => fileInfo.cos_key).join(',');
      requestData.inputs.file_urls = fileUrls;
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
        console.log('请求完成');
        this.isLoading = false;

        // 获取最新的AI回复内容
        const latestAIMessage = this.currentStreamingMessage;

        // 更新消息列表
        this.messages = [...this.messages, this.currentStreamingMessage];
        this.currentStreamingMessage = null;

        // 增加题目计数
        this.currentQuestionNumber++;

        if (latestAIMessage && latestAIMessage.answer) {
          // 优先使用 LLMText，如果没有则使用 answer
          const textForSynthesis = llmText || latestAIMessage.answer;

          if (textForSynthesis) {
            // 合成语音
            const audioUrl = await synthesizeAudio(textForSynthesis);

            if (this.enableVoice) {
              // 自动播放语音
              await this.playAudio(audioUrl);
              // 自动播放模式下，播放完成后立即开始等待录制
              this.startWaitingToRecord();
            } else {
              // 只保存音频URL，不自动播放
              this.audioUrl = audioUrl;
              // 非自动播放模式下，不立即开始等待录制
            }
          }
        }
      }
    });
  }

  // 保存答案的方法
  private async saveAnswer(conversationId: string, question: string, answer: string) {
    try {
      await sendHttpRequest({
        url: '/sdk/v1/hr_competition/answer',
        method: 'POST',
        data: {
          conversation_id: conversationId,
          question: question,
          answer: answer
        },
      });
    } catch (error) {
      console.error('保存答案失败:', error);
    }
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
      const response = await sendHttpRequest({
        url: '/sdk/v1/chat/messages',
        method: 'GET',
        data: {
          conversation_id: this.conversationId,
          bot_id: "3022316191018880",
          limit: 20
        }
      });

      if (response.success && response.data) {
        const historyData = response.data.data || [];
        const formattedMessages: ChatMessage[] = historyData.map(msg => {
          const time = new Date(msg.created_at * 1000);
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;

          const { inputs, ...msgWithoutInputs } = msg;

          return {
            ...msgWithoutInputs,
            time: timeStr,
            isStreaming: false,
            status: msg.status === 'error' ? 'error' : 'normal' as const
          };
        });

        this.messages = formattedMessages;
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
      alert(error instanceof Error ? error.message : '加载历史消息失败，请刷新重试');
    } finally {
      this.isLoadingHistory = false;
      requestAnimationFrame(() => {
        this.shouldAutoScroll = true;
        this.scrollToBottom();
      });
    }
  }

  // 修改 isOpen 的 watch 方法
  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      await verifyApiKey(this.token);
      if (this.conversationId) {
        await this.loadHistoryMessages();
      }
    }
  }


  private handleJobCategorySelect = (category: string) => {
    this.selectedJobCategory = category;
  };

  private handleDimensionSelect = (dimension: string) => {
    if (this.selectedDimensions.includes(dimension)) {
      this.selectedDimensions = this.selectedDimensions.filter(d => d !== dimension);
    } else {
      this.selectedDimensions = [...this.selectedDimensions, dimension];
    }
  };

  private handleInitialSubmit = async () => {
    // 修改验证逻辑
    if (this.requireResume && !this.selectedFile) {
      alert('请上传简历');
      return;
    }

    if (!this.selectedJobCategory) {
      alert('请选择职能类别');
      return;
    }

    if (this.selectedDimensions.length === 0) {
      alert('请至少选择一个关注模块');
      return;
    }

    // 不再显示欢迎确认对话框，因为已经在组件打开时显示了
    // 直接询问用户是否准备好开始面试
    const confirmed = confirm('如果您已做好准备请点击"确定"开始面试。');

    if (!confirmed) {
      return;
    }

    // 修改文件上传逻辑
    if (this.requireResume) {
      await this.uploadFile();
      if (this.uploadedFileInfo.length === 0) {
        return;
      }
    }

    this.showInitialUpload = false;
    const message = `我是一名${this.selectedJobCategory}，请您开始提问`;
    this.sendMessageToAPI(message);
  };

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
          console.log('使用支持的MIME类型:', type);
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

  // 修改上传录制的视频的方法
  private async uploadRecordedVideo() {
    if (!this.recordedBlob) return;

    try {
      this.isUploadingVideo = true;
      this.showRecordingUI = false;

      // 根据Blob类型确定文件扩展名
      const fileExtension = this.recordedBlob.type.includes('webm') ? 'webm' : 'mp4';
      const fileName = `answer.${fileExtension}`;

      // 创建File对象
      const videoFile = new File([this.recordedBlob], fileName, { type: this.recordedBlob.type });

      // 使用uploadFileToBackend上传视频
      const result = await uploadFileToBackend(videoFile, {
      }, {
        'tags': 'other'
      });

      if (result) {
        // 使用 FileUploadResponse 类型的字段
        await this.saveVideoAnswer(result.cos_key);
        this.sendNextQuestion();
      } else {
        throw new Error('视频上传失败');
      }
    } catch (error) {
      console.error('视频上传错误:', error);
      this.recordingError.emit({
        type: 'upload_failed',
        message: '视频上传失败',
        details: error
      });
    } finally {
      this.isUploadingVideo = false;
      this.showRecordingUI = false;
      this.recordedBlob = null;
    }
  }

  // 修改保存视频答案的方法
  private async saveVideoAnswer(cosKey: string) {
    if (!this.conversationId) return;

    try {
      const lastAIMessage = this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;

      if (!lastAIMessage) return;

      await sendHttpRequest({
        url: '/sdk/v1/hr_competition/answer',
        method: 'POST',
        data: {
          conversation_id: this.conversationId,
          question: lastAIMessage.answer,
          file_url: cosKey
        },
      });
    } catch (error) {
      console.error('保存视频答案失败:', error);
    }
  }

  // 发送"下一题"请求
  private sendNextQuestion() {
    this.sendMessageToAPI("下一题");
  }

  /**
   * 发送面试完成请求
   */
  private async completeInterview() {
    if (!this.conversationId) return;

    try {
      await sendHttpRequest({
        url: `/sdk/v1/hr_competition/${this.conversationId}/end`,
        method: 'POST',
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
    document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);
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
      // 手动播放完成后开始等待录制
      this.startWaitingToRecord();
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

          {this.showInitialUpload ? (
            <div class="initial-upload">
              <div class="upload-section">
                {/* 根据 requireResume 条件渲染简历上传部分 */}
                {this.requireResume && (
                  <>
                    <h3>开始前，请上传您的简历</h3>
                    <div class="upload-area" onClick={this.handleUploadClick}>
                      {this.selectedFile ? (
                        <div class="file-item">
                          <div class="file-item-content">
                            <span class="file-icon">📝</span>
                            <span class="file-name">{this.selectedFile.name}</span>
                          </div>
                          <button class="remove-file" onClick={(e) => {
                            e.stopPropagation();
                            this.clearSelectedFile();
                          }}>×</button>
                        </div>
                      ) : (
                        <div class="upload-placeholder">
                          <img src='https://pub.pincaimao.com/static/web/images/home/i_upload.png'></img>
                          <p class='upload-text'>点击上传简历</p>
                          <p class="upload-hint">支持 txt、 markdown、 pdf、 docx、  md 格式</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div class="category-select">
                  <h3>请选择您的职能类别（单选）</h3>
                  <div class="category-options">
                    {this.jobCategories.map(category => (
                      <button
                        class={{
                          'category-button': true,
                          'selected': this.selectedJobCategory === category
                        }}
                        onClick={() => this.handleJobCategorySelect(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div class="dimension-select">
                  <h3>请选择关注的模块（可多选）</h3>
                  <div class="dimension-options">
                    {this.dimensions.map(dimension => (
                      <button
                        class={{
                          'dimension-button': true,
                          'selected': this.selectedDimensions.includes(dimension)
                        }}
                        onClick={() => this.handleDimensionSelect(dimension)}
                      >
                        {dimension}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  class="submit-button"
                  disabled={
                    (this.requireResume && !this.selectedFile) ||
                    !this.selectedJobCategory ||
                    this.selectedDimensions.length === 0 ||
                    (this.requireResume && this.isUploading)
                  }
                  onClick={this.handleInitialSubmit}
                >
                  {this.requireResume && this.isUploading ? '上传中...' : '开始面试'}
                </button>
              </div>
              {this.requireResume && (
                <input
                  type="file"
                  class="file-input"
                  onChange={this.handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
              )}
            </div>
          ) : (
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
                        <p>请上传简历开始面试</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div class="recording-section">
                <div class="recording-container">
                  <div class="video-area">
                    {this.showRecordingUI ? (
                      renderVideoPreview()
                    ) : (
                      <div class="video-preview placeholder">
                        {renderPlaceholderStatus()}
                      </div>
                    )}
                  </div>
                  {/* 添加进度条和数字进度 */}
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
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';

@Component({
  tag: 'pcm-hr-chat-modal',
  styleUrl: 'pcm-hr-chat-modal.css',
  shadow: true,
})
export class ChatHRModal {
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
   * 当前输入的消息
   */
  @State() currentMessage: string = '';

  /**
   * 当发送消息时触发
   */
  @Event() messageSent: EventEmitter<string>;

  /**
   * 当模态框关闭时触发
   */
  @Event() modalClosed: EventEmitter<void>;

  /**
   * 应用图标URL
   */
  @Prop() icon?: string;

  /**
   * 聊天框窗口的布局风格
   */
  @Prop() layout: 'mobile' | 'pc' = 'pc';

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
   * 机器人ID
   */
  @Prop() botId: string;

  /**
   * 会话ID
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

  // 添加新的 Event
  @Event() streamComplete: EventEmitter<{
    conversation_id: string;
    event: string;
    message_id: string;
    id: string;
  }>;

  @State() suggestedQuestions: string[] = [];
  @State() suggestedQuestionsLoading: boolean = false;
  private stopSuggestedQuestionsRef: { current: boolean } = { current: false };

  @State() selectedFile: File | null = null;
  @State() isUploading: boolean = false;
  @State() uploadedFileInfo: { cos_key: string, filename: string, ext: string, presigned_url: string }[] = [];

  /**
   * 默认查询文本
   */
  @Prop() defaultQuery: string = '';

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
  @State() recordingMaxTime: number = 120; // 最大录制时间（秒）
  @State() waitingToRecord: boolean = false;
  @State() waitingTimer: any = null;
  @State() waitingTimeLeft: number = 10; // 等待时间（秒）

  // 添加一个新的私有属性来存储视频元素的引用
  private videoRef: HTMLVideoElement | null = null;

  /**
   * 总题目数量
   */
  @Prop() totalQuestions: number = 5;

  /**
   * 当前题目序号
   */
  @State() currentQuestionNumber: number = 0;

  /**
   * 面试是否已完成
   */
  @State() isInterviewComplete: boolean = false;

  /**
   * 当面试完成时触发
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
   * 用户邮箱
   */
  @Prop() email: string = '';

  private handleClose = () => {
    this.isOpen = false;
    this.modalClosed.emit();
  };


  private handleStopSuggestedQuestions = () => {
    this.suggestedQuestions = [];
    this.stopSuggestedQuestionsRef.current = true;
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
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const response = await fetch('https://pcm_api.ylzhaopin.com/external/v1/files/upload', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        body: formData
      });

      const result = await response.json();
      console.log('result', result);
      if (result) {
        this.uploadedFileInfo = [{
          cos_key: result.cos_key,
          filename: result.filename,
          ext: result.ext,
          presigned_url: result.presigned_url
        }];
      }
    } catch (error) {
      console.error('文件上传错误:', error);
      this.clearSelectedFile();
      alert('文件上传失败，请重试');
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
    this.handleStopSuggestedQuestions();
    console.log('开始发送消息:', message);
    this.isLoading = true;
    let answer = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 如果消息为空但有文件，使用默认文本
    const queryText = message.trim() || (this.uploadedFileInfo.length > 0 ? '请分析这个文件' : '');

    // 获取上一条AI消息的回答内容
    const lastAIMessage = this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;

    // 保存AI提问和用户回答
    if (lastAIMessage && this.conversationId && message !== "下一题") {
      console.log('保存上一轮对话');
      console.log('AI提问:', lastAIMessage.answer);
      console.log('用户回答:', queryText);
      this.saveAnswer(
        this.conversationId,
        '1234567890',
        lastAIMessage.answer, // AI的提问作为question
        queryText // 用户的输入作为answer
      );
    }

    // 创建新的消息对象时确保必填字段都有值
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,  // id 必填
      time: time,                // time 必填
      query: queryText,
      answer: '',
      bot_id: this.botId,
      isStreaming: true,
      conversation_id: this.conversationId,
      parent_message_id: this.messages.length > 0
        ? this.messages[this.messages.length - 1].id
        : "00000000-0000-0000-0000-000000000000",
      inputs: {},
      message_files: [],
      feedback: null,
      retriever_resources: [],
      agent_thoughts: [],
      status: "normal",
      error: null
    };

    // 设置当前流式消息
    this.currentStreamingMessage = newMessage;

    this.shouldAutoScroll = true;
    // 滚动到底部
    this.scrollToBottom();

    // 准备请求数据
    const requestData: any = {
      bot_id: this.botId,
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      query: queryText,
      user: '1234567890'
    };

    // 如果有上传的文件，添加到inputs参数
    if (this.uploadedFileInfo.length > 0) {
      const fileUrls = this.uploadedFileInfo.map(fileInfo => fileInfo.cos_key).join(',');

      requestData.inputs = {
        file_urls: fileUrls,
        job_info: this.selectedJobCategory,
        dimensional_info: this.selectedDimensions.join(','),
        email: this.email,
      };
    }

    await sendSSERequest({
      url: `https://pcm_api.ylzhaopin.com/external/v1/chat-messages`,
      method: 'POST',
      headers: {
        'authorization': 'Bearer ' + this.apiKey
      },
      data: requestData,
      onMessage: (data) => {
        console.log('收到Stream数据:', data);

        if (data.conversation_id && !this.conversationId) {
          this.conversationId = data.conversation_id;
          this.updateUrlWithConversationId(data.conversation_id);
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
        this.messages = [...this.messages, this.currentStreamingMessage];
        this.currentStreamingMessage = null;

        // 如果是初始消息或"下一题"消息，增加题目计数
        if (message === "下一题" || this.currentQuestionNumber === 0) {
          this.currentQuestionNumber++;
        }

        // 检查是否完成所有题目
        if (this.currentQuestionNumber >= this.totalQuestions) {
          this.isInterviewComplete = true;
          // 发送面试完成请求
          await this.completeInterview();
          // 触发完成事件
          this.interviewComplete.emit({
            conversation_id: this.conversationId,
            total_questions: this.totalQuestions
          });
          return;
        }

        // 如果不是"下一题"消息，则开始等待录制
        if (message !== "下一题") {
          this.startWaitingToRecord();
        } else {
          // 当AI回复"下一题"的消息完成后，开始新一轮等待录制
          setTimeout(() => {
            this.startWaitingToRecord();
          }, 1000);
        }
      }
    });
  }

  // 添加保存答案的方法
  private async saveAnswer(conversationId: string, user: string, question: string, answer: string) {
    try {
      await sendSSERequest({
        url: 'https://pcm_api.ylzhaopin.com/agents/hr_competition/answer',
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: {
          conversation_id: conversationId,
          user: user,
          question: question,
          answer: answer
        },
        onMessage: () => { },
        onError: (error) => {
          console.error('保存答案失败:', error);
        },
        onComplete: () => {
          console.log('保存答案完成');
        }
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
    console.log('chatHistory', chatHistory);
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

  private updateUrlWithConversationId(conversationId: string) {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('conversation_id')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('conversation_id', conversationId);
      window.history.replaceState({}, '', newUrl);
    }
  }


  // 修改 loadHistoryMessages 方法
  private async loadHistoryMessages() {
    if (!this.conversationId) return;

    this.isLoadingHistory = true;

    try {
      await sendSSERequest({
        url: `https://pcm_api.ylzhaopin.com/external/v1/messages`,
        method: 'GET',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: {
          conversation_id: this.conversationId,
          bot_id: this.botId,
          user: '1234567890',
          limit: 20
        },
        onMessage: (data) => {
          if (data.data) {
            const historyData = data.data.data || [];
            const formattedMessages: ChatMessage[] = historyData.map(msg => {
              const time = new Date(msg.created_at * 1000);
              const timeStr = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;

              return {
                ...msg,
                time: timeStr,
                bot_id: this.botId,
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
        },
        onError: (error) => {
          console.error('加载历史消息失败:', error);
        },
        onComplete: () => {
          this.isLoadingHistory = false;
        }
      });
    } catch (error) {
      console.error('加载历史消息失败:', error);
      this.isLoadingHistory = false;
    }
  }


  // 添加 isOpen 的 watch 方法
  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      if (this.conversationId) {
        await this.loadHistoryMessages();
      }
    }
  }

  @Watch('defaultQuery')
  handleDefaultQueryChange(newValue: string) {
    if (newValue && !this.currentMessage) {
      this.currentMessage = newValue;
    }
  }

  componentWillLoad() {
    // 组件加载时设置默认查询
    if (this.defaultQuery) {
      this.currentMessage = this.defaultQuery;
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
    if (!this.selectedFile || !this.selectedJobCategory) {
      alert('请上传简历并选择职能类别');
      return;
    }

    await this.uploadFile();
    if (this.uploadedFileInfo.length > 0) {
      this.showInitialUpload = false;
      const message = `我是一名${this.selectedJobCategory}，这是我的简历`;
      this.sendMessageToAPI(message);
    }
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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      this.mediaRecorder = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        this.recordedBlob = blob;
        this.uploadRecordedVideo();
      };

      // 开始录制
      mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.recordingTimeLeft = this.maxRecordingTime;

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
      alert('无法访问摄像头或麦克风，请确保已授予权限并重试。');
      this.showRecordingUI = false;
    }
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

  // 上传录制的视频
  private async uploadRecordedVideo() {
    if (!this.recordedBlob) return;

    try {
      const formData = new FormData();
      formData.append('file', this.recordedBlob, 'answer.webm');

      const response = await fetch('https://pcm_api.ylzhaopin.com/external/v1/files/upload', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        body: formData
      });

      const result = await response.json();
      console.log('视频上传结果:', result);

      if (result && result.cos_key) {
        // 保存视频答案
        await this.saveVideoAnswer(result.cos_key);

        // 发送"下一题"请求
        this.sendNextQuestion();
      } else {
        throw new Error('视频上传失败');
      }
    } catch (error) {
      console.error('视频上传错误:', error);
      alert('视频上传失败，请重试');
    } finally {
      this.showRecordingUI = false;
      this.recordedBlob = null;
    }
  }

  // 保存视频答案
  private async saveVideoAnswer(cosKey: string) {
    if (!this.conversationId) return;

    try {
      const lastAIMessage = this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;

      if (!lastAIMessage) return;

      await sendSSERequest({
        url: 'https://pcm_api.ylzhaopin.com/agents/hr_competition/answer',
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: {
          conversation_id: this.conversationId,
          user: '1234567890',
          question: lastAIMessage.answer,
          file_url: cosKey
        },
        onMessage: () => { },
        onError: (error) => {
          console.error('保存视频答案失败:', error);
        },
        onComplete: () => {
          console.log('保存视频答案完成');
        }
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
        url: 'https://pcm_api.ylzhaopin.com/agents/hr_competition/complete',
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + this.apiKey
        },
        data: {
          conversation_id: this.conversationId,
          user: '1234567890'
        }
      });
      
      // 显示完成消息
      this.messages = [...this.messages, {
        id: `system-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        query: '',
        answer: '面试已完成，感谢您的参与！',
        bot_id: this.botId,
        isStreaming: false,
        conversation_id: this.conversationId,
        parent_message_id: "00000000-0000-0000-0000-000000000000",
        inputs: {},
        message_files: [],
        feedback: null,
        retriever_resources: [],
        agent_thoughts: [],
        status: "normal",
        error: null
      }];
    } catch (error) {
      console.error('发送面试完成请求失败:', error);
    }
  }

  render() {
    if (!this.isOpen) return null;

    const modalStyle = {
      zIndex: String(this.zIndex)
    };

    const containerClass = {
      'modal-container': true,
      'mobile-layout': this.layout === 'mobile',
      'pc-layout': this.layout === 'pc'
    };

    const renderVideoPreview = () => (
      <div class="video-preview">
        <video
          autoPlay
          muted
          playsInline
          ref={(el) => {
            if (el && this.recordingStream && !this.videoRef) {
              this.videoRef = el;
              el.srcObject = this.recordingStream;
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

    return (
      <div class="modal-overlay" style={modalStyle}>
        <div class={containerClass}>
          {this.isShowHeader && (
            <div class="modal-header">
              <div class="header-left">
                {this.icon && <img src={this.icon} class="header-icon" alt="应用图标" />}
                <h3>{this.modalTitle}</h3>
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
                <h3>开始前，请上传您的简历</h3>
                <div class="upload-area" onClick={this.handleUploadClick}>
                  {this.selectedFile ? (
                    <div class="file-info">
                      <span>{this.selectedFile.name}</span>
                      <button class="remove-file" onClick={(e) => {
                        e.stopPropagation();
                        this.clearSelectedFile();
                      }}>×</button>
                    </div>
                  ) : (
                    <div class="upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m0-16l-4 4m4-4l4 4" />
                      </svg>
                      <p>点击上传简历</p>
                      <p class="upload-hint">支持 txt、 markdown、 pdf、 docx、  md 格式</p>
                    </div>
                  )}
                </div>

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
                  disabled={!this.selectedFile || !this.selectedJobCategory || this.isUploading}
                  onClick={this.handleInitialSubmit}
                >
                  {this.isUploading ? '上传中...' : '开始分析'}
                </button>
              </div>
              <input
                type="file"
                class="file-input"
                onChange={this.handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>
          ) : (
            <>
              <div class="chat-history" onScroll={this.handleScroll}>
                {this.isLoadingHistory ? (
                  <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>加载历史消息中...</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}


              </div>


              <div class="recording-section">
                <div class="recording-container">
                  <div class="video-area">
                    {this.showRecordingUI ? (
                      renderVideoPreview()
                    ) : (
                      <div class="video-preview placeholder">
                        {this.isLoading || this.currentStreamingMessage ? (
                          <div class="waiting-message loading">
                            <p>请等待题目...</p>
                          </div>
                        ) : (
                          this.waitingToRecord && (
                            <div class="waiting-message">
                              <p>请准备好，{this.waitingTimeLeft}秒后将开始录制您的回答...</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  {this.showRecordingUI && (
                    <button
                      class="stop-recording-button"
                      onClick={() => this.stopRecording()}
                    >
                      完成回答
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
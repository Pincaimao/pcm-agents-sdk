import { Component, Prop, h, State, Event, EventEmitter, Element, Watch } from '@stencil/core';
import { convertWorkflowStreamNodeToMessageRound, UserInputMessageType, sendSSERequest, sendHttpRequest, uploadFileToBackend, verifyApiKey } from '../../utils/utils';
import { ChatMessage } from '../../interfaces/chat';
import { ConversationStartEventData, StreamCompleteEventData } from '../../components';
import { authStore } from '../../../store/auth.store';

/**
 * 知识库问答助手
 */


// 添加引用文档接口
interface Reference {
  doc_info: {
    doc_name: string;
    doc_id: string;
  };
  content: string;
}

// 添加智能体详情接口
interface EmployeeDetails {
  id: number;
  name: string;
  description: string;
  avatar: string;
  default_greeting: string;
  quick_questions: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  dify_app_key: string | null;
  last_conversation_id: string | null;
  workflow_id: string;
  agent_name: string;
}

@Component({
  tag: 'pcm-zsk-chat-modal',
  styleUrl: 'pcm-zsk-chat-modal.css',
  shadow: true,
})
export class ChatKBModal {
  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '在线客服';

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
  @Event() conversationStart: EventEmitter<ConversationStartEventData>;;


  /**
     * SDK密钥验证失败事件
     */
  @Event() tokenInvalid: EventEmitter<void>;


  private readonly SCROLL_THRESHOLD = 30;

  /**
   * 是否以全屏模式打开，移动端建议设置为true
   */
  @Prop() fullscreen: boolean = false;

  // 添加文字输入相关状态
  @State() textAnswer: string = '';
  @State() isSubmittingText: boolean = false;

  /**
   * 自定义智能体inputs输入参数:
   * 1. show_suggested_questions: 是否显示推荐问题
   */
  @Prop() customInputs: Record<string, any> = {
    show_suggested_questions: false,
  };


  // 添加推荐问题和引用文档状态
  @State() suggestedQuestions: string[] = [];
  @State() suggestedQuestionsLoading: boolean = false;
  @State() currentRefs: Reference[] = [];

  /**
   * 是否显示引用文档
   */
  @Prop() showReferences: boolean = true;


  /**
   * 数字员工ID，从聘才猫开发平台创建数字员工后，点击导出获取
   */
  @Prop() employeeId!: string;


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
   * 智能体详情
   */
  @State() employeeDetails: EmployeeDetails | null = null;

  /**
   * 是否正在加载智能体详情
   */
  @State() isLoadingEmployeeDetails: boolean = false;

  /**
   * 预设问题列表
   */
  @State() quickQuestions: string[] = [];

  private tokenInvalidListener: () => void;

  @Watch('token')
  handleTokenChange(newToken: string) {
    // 当传入的 token 变化时，更新 authStore 中的 token
    if (newToken && newToken !== authStore.getToken()) {
      authStore.setToken(newToken);
    }
  }

  componentWillLoad() {
    // 添加全局token无效事件监听器
    this.tokenInvalidListener = () => {
      this.tokenInvalid.emit();
    };
    document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);
  }


  private handleClose = () => {
    this.modalClosed.emit();
  };


  private async sendMessageToAPI(message: string) {
    // 验证 employeeId 是否存在
    if (!this.employeeId) {
      alert('请提供有效的数字员工ID');
      return;
    }

    this.isLoading = true;
    let answer = '';

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 修改消息处理逻辑，移除文件上传相关代码
    const queryText = message.trim() || '请开始';

    // 重置推荐问题和引用文档
    this.suggestedQuestions = [];
    this.currentRefs = [];

    // 创建新的消息对象
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

    // 准备请求数据
    const requestData: any = {
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      query: queryText,
      employee_id: this.employeeId,
    };

    // 合并基本输入参数和自定义输入参数
    requestData.inputs = {
      // 合并自定义输入参数
      ...this.customInputs,
    };

    await sendSSERequest({
      url: `/sdk/v1/knowledge/chat/chat-messages`,
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

        // 处理问题建议
        if (data.event === 'node_started' && data.data.title.includes('聘才猫推荐开始')) {
          this.suggestedQuestionsLoading = true;
        }

        // 处理问题建议
        if (data.event === 'node_finished' && data.data.title.includes('聘才猫推荐结束')) {
          let suggestions: string[] = [];

          try {
            // 清理 markdown 代码块标记并解析 JSON
            let textContent = data.data.outputs.text;
            if (typeof textContent === 'string') {
              // 移除 markdown 代码块标记
              textContent = textContent.replace(/```json\n/, '').replace(/```/, '').trim();
              const suggestionData = JSON.parse(textContent);

              // 处理标准格式的建议问题
              if (suggestionData.status === 'success' && Array.isArray(suggestionData.items)) {
                suggestions = suggestionData.items.map((item: any) => item.question);
              }
            } else {
              // 如果已经是对象，直接使用
              const suggestionData = textContent;
              if (suggestionData.status === 'success' && Array.isArray(suggestionData.items)) {
                suggestions = suggestionData.items.map((item: any) => item.question);
              }
            }
          } catch (e) {
            console.warn('解析问题建议失败:', e);
          }

          this.suggestedQuestions = suggestions;
          this.suggestedQuestionsLoading = false;
        }

        // 处理引用文档
        if (data.event === 'node_finished' && data.data?.inputs?.documents) {
          const refs: Reference[] = [];

          // 遍历 documents 数组
          data.data.inputs.documents.forEach((arg: any) => {
            // 遍历每个 arg 中的 result_list
            if (arg.result_list && Array.isArray(arg.result_list)) {
              arg.result_list.forEach((result: any) => {
                if (result.doc_info && result.content) {
                  refs.push({
                    doc_info: {
                      doc_name: result.doc_info.doc_name,
                      doc_id: result.doc_info.doc_id
                    },
                    content: result.content
                  });
                }
              });
            }
          });

          // 去重处理
          const uniqueRefs = new Map();
          refs.forEach((ref: Reference) => {
            if (ref.doc_info && ref.doc_info.doc_id) {
              uniqueRefs.set(ref.doc_info.doc_id, ref);
            }
          });

          this.currentRefs = Array.from(uniqueRefs.values());
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
        const latestAIMessage = this.currentStreamingMessage;
        latestAIMessage.isStreaming = false;
        // 更新消息列表
        this.messages = [...this.messages, latestAIMessage];
        this.currentStreamingMessage = null;

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
        url: '/sdk/v1/knowledge/chat/conversation-history',
        method: 'GET',
        data: {
          conversation_id: this.conversationId,
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
      return null;
    }
  }


  // 添加获取智能体详情的方法
  private async fetchEmployeeDetails() {
    if (!this.employeeId || !this.token) return;

    this.isLoadingEmployeeDetails = true;

    try {
      const result = await sendHttpRequest({
        url: `/sdk/v1/knowledge/chat/employee/${this.employeeId}`,
        method: 'GET',
      });
      if (result.success && result.data) {
        this.employeeDetails = result.data;

        // 设置预设问题
        if (this.employeeDetails.quick_questions) {
          this.quickQuestions = this.employeeDetails.quick_questions
            .split(',')
            .map(q => q.trim())
            .filter(q => q);
        }

        // 如果有上次会话ID，加载历史消息
        if (this.conversationId) {
          await this.loadHistoryMessages();
        }
      } else {
        alert('获取智能体详情失败，请检查token和employeeId是否正确');
      }
    } catch (error) {
      console.error('获取智能体详情失败:', error);
    } finally {
      this.isLoadingEmployeeDetails = false;
    }
  }

  // 修改 isOpen 的 watch 方法
  @Watch('isOpen')
  async handleIsOpenChange(newValue: boolean) {
    if (newValue) {
      // 验证 employeeId 是否存在
      if (!this.employeeId) {
        console.error('未提供数字员工ID (employeeId)');
        setTimeout(() => alert('请提供有效的数字员工ID'), 0);
        return;
      }
      await verifyApiKey(this.token);

      // 获取智能体详情
      await this.fetchEmployeeDetails();
    }
  }


  // 修改 componentDidLoad 生命周期方法，确保组件卸载时释放资源
  disconnectedCallback() {
    // 组件销毁时移除事件监听器
    document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);

    // 移除滚动事件监听器
    const chatHistory = this.hostElement.shadowRoot?.querySelector('.chat-history');
    if (chatHistory) {
      chatHistory.removeEventListener('scroll', this.handleScroll);
    }
    // 清理音频录制计时器
    if (this.audioRecordingTimer) {
      clearInterval(this.audioRecordingTimer);
      this.audioRecordingTimer = null;
    }

    // 停止音频录制
    this.stopAudioRecording();

  }


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
          !this.currentStreamingMessage) {
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

          // 根据错误类型提供更具体的提示
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('麦克风访问被拒绝。\n\n在Mac上，请前往系统偏好设置 > 安全性与隐私 > 隐私 > 麦克风，确保您的浏览器已被允许访问麦克风。');
          } else {
            alert('无法访问麦克风，请确保已授予权限并且麦克风设备正常工作。');
          }
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
          alert('您的浏览器不支持音频录制功能');
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
      alert('开始录音失败，请确保麦克风设备正常工作');
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
      alert('语音识别失败，请重试');
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

  // 添加处理推荐问题点击的方法
  private handleSuggestedQuestionClick = (question: string) => {
    if (this.isLoading || this.currentStreamingMessage) return;
    this.textAnswer = question;
    this.submitTextAnswer();
  };

  // 添加文档下载方法
  private async handleDocumentDownload(ref: Reference) {
    try {
      console.log('下载文档:', ref);

      // 从文档ID中提取数字部分
      const docIdMatch = ref.doc_info.doc_id.match(/docID_(\d+)/);
      if (!docIdMatch || !docIdMatch[1]) {
        alert('无法解析文档ID');
        return;
      }
      const docId = docIdMatch[1];
      // 获取文档详细信息
      const result = await sendHttpRequest({
        url: `/sdk/v1/files/${docId}/info`,
        method: 'GET',
      });


      if (result.success && result.data?.file_url) {
        // 构建预览URL
        const baseUrl = result.data.file_url;
        const previewUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ci-process=doc-preview&copyable=1&dstType=html`;

        // 打开预览链接
        window.open(previewUrl, '_blank');
      } else {
        alert('获取文档链接失败');
      }
    } catch (error) {
      console.error('下载文档失败:', error);
      alert('下载文档失败，请稍后再试');
    }
  }

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

    // 修改渲染引用文档组件的方法
    const renderReferences = () => {
      // 只有当没有正在流式输出的消息且有引用文档时才显示
      if (!this.showReferences || this.currentRefs.length === 0 || this.currentStreamingMessage) return null;

      return (
        <div class="references-section">
          <h3 class="references-title">引用文档</h3>
          <div class="references-list">
            {this.currentRefs.map((ref, index) => (
              <div
                class="reference-item"
                key={`ref-${index}`}
                onClick={() => this.handleDocumentDownload(ref)}
              >
                <div class="reference-header">
                  <span class="reference-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                  </span>
                  <span class="reference-name">{ref.doc_info.doc_name}</span>
                  <span class="download-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // 渲染推荐问题组件
    const renderSuggestedQuestions = () => {
      // 只有当没有正在流式输出的消息时才显示推荐问题
      if (this.currentStreamingMessage) return null;

      if (this.suggestedQuestionsLoading) {
        return (
          <div class="loading-suggestions">
            <div class="loading-spinner-small"></div>
          </div>
        );
      }

      if (this.suggestedQuestions.length === 0) return null;

      return (
        <div class="suggested-questions">
          <h3 class="suggested-title">推荐问题</h3>
          {this.suggestedQuestions.map((question, index) => (
            <div
              class="suggested-question"
              key={`question-${index}`}
              onClick={() => this.handleSuggestedQuestionClick(question)}
            >
              <span>{question}</span>
              <span class="arrow-right">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      );
    };

    // 渲染预设问题组件
    const renderQuickQuestions = () => {
      // 只有在没有会话ID且有预设问题且没有正在流式输出的消息时才显示
      if (this.conversationId || this.quickQuestions.length === 0 || this.currentStreamingMessage) return null;

      return (
        <div class="suggested-questions">
          <h3 class="suggested-title">常见问题</h3>
          {this.quickQuestions.map((question, index) => (
            <div
              class="suggested-question"
              key={`preset-question-${index}`}
              onClick={() => this.handleSuggestedQuestionClick(question)}
            >
              <span>{question}</span>
              <span class="arrow-right">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </div>
          ))}
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
              disabled={this.isConvertingAudio || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage}
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
              'disabled': !this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.isRecordingAudio || this.isConvertingAudio
            }}
            onClick={() => {
              if (!this.textAnswer.trim() || this.isSubmittingText || this.isLoading || !!this.currentStreamingMessage || this.isRecordingAudio || this.isConvertingAudio) {
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
                        message={message}
                        showFeedbackButtons={false}
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
                        showFeedbackButtons={false}
                      ></pcm-chat-message>
                    </div>
                  )}
                  {this.messages.length === 0 && !this.currentStreamingMessage && (
                    <div class="empty-state">
                      {this.isLoadingEmployeeDetails ? (
                        <p>加载中...</p>
                      ) : this.employeeDetails?.default_greeting ? (
                        <p>{this.employeeDetails.default_greeting}</p>
                      ) : (
                        <p>请输入...</p>
                      )}
                    </div>
                  )}

                  {/* 添加引用文档和推荐问题组件 */}
                  {renderReferences()}
                  {renderSuggestedQuestions()}
                  {renderQuickQuestions()}
                </div>
              )}
            </div>

            <div class="recording-section">
              <div class="recording-container">
                {renderTextInputArea()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
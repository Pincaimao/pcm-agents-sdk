import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import {FileUploadResponse } from '../../utils/utils';
import { 
  StreamCompleteEventData, 
  ConversationStartEventData, 
  InterviewCompleteEventData,
  RecordingErrorEventData,
} from '../../interfaces/events';

/**
 * 模拟面试
 */

@Component({
    tag: 'pcm-1zhanshi-mnms-modal',
    styleUrls: ['pcm-1zhanshi-mnms-modal.css', '../../global/global.css'],
    shadow: true,
})
export class ZhanshiMnmsModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '模拟面试';

    /**
     * SDK鉴权密钥
     */
    @Prop({ attribute: 'token' }) token!: string;

    /**
     * 是否显示聊天模态框
     */
    @Prop({ mutable: true }) isOpen: boolean = false;

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
     * 默认查询文本
     */
    @Prop() defaultQuery: string = '请开始模拟面试';

    /**
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 自定义输入参数，传入customInputs.job_info时，会隐藏JD输入区域
     */
    @Prop() customInputs: Record<string, any> = {};

    /**
     * 上传成功事件
     */
    @Event() uploadSuccess: EventEmitter<FileUploadResponse>;

    /**
     * 流式输出完成事件
     */
    @Event() streamComplete: EventEmitter<StreamCompleteEventData>;

    /**
     * 新会话开始的回调，只会在一轮对话开始时触发一次
     */
    @Event() conversationStart: EventEmitter<ConversationStartEventData>;

    /**
     * 当聊天完成时触发
     */
    @Event() interviewComplete: EventEmitter<InterviewCompleteEventData>;

    /**
     * SDK密钥验证失败事件
     */
    @Event() tokenInvalid: EventEmitter<void>;

    /**
     * 面试模式：text - 文本模式，video - 视频模式
     */
    @Prop() interviewMode: 'text' | 'video' = 'text';

    /**
     * 录制错误事件
     */
    @Event() recordingError: EventEmitter<RecordingErrorEventData>;

    @State() selectedFile: File | null = null;
    @State() isUploading: boolean = false;
    @State() uploadedFileInfo: FileUploadResponse | null = null;
    @State() showChatModal: boolean = false;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    @State() jobDescription: string = '';
    @State() isSubmitting: boolean = false;

    private tokenInvalidListener: () => void;

    componentWillLoad() {
        // 添加全局token无效事件监听器
        this.tokenInvalidListener = () => {
            this.tokenInvalid.emit();
        };
        document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);
    }

    disconnectedCallback() {
        // 组件销毁时移除事件监听器
        document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);
    }

    private handleClose = () => {
        this.isOpen = false;
        this.modalClosed.emit();
    };


    @Watch('isOpen')
    handleIsOpenChange(newValue: boolean) {
        if (!newValue) {
            // 重置状态
            this.showChatModal = false;
            this.jobDescription = '';

        } else {
            this.showChatModal = true;
        }
    }


    // 处理流式输出完成事件
    private handleStreamComplete = (event: CustomEvent) => {
        // 将事件转发出去
        this.streamComplete.emit(event.detail);
    };

    // 处理会话开始事件
    private handleConversationStart = (event: CustomEvent) => {
        this.conversationStart.emit(event.detail);
    };

    // 处理面试完成事件
    private handleInterviewComplete = (event: CustomEvent) => {
        this.interviewComplete.emit(event.detail);
    };


    private handleRecordingError = (event: CustomEvent) => {
        this.recordingError.emit(event.detail);
    };

    // 添加处理 tokenInvalid 事件的方法
    private handleTokenInvalid = () => {
        this.tokenInvalid.emit();
    };

    render() {
        if (!this.isOpen) return null;

        const modalStyle = {
            zIndex: String(this.zIndex)
        };

        console.log('showChatModal:', this.showChatModal);

        const containerClass = {
            'modal-container': true,
            'fullscreen': this.fullscreen,
            'pc-layout': true,
        };

        const overlayClass = {
            'modal-overlay': true,
            'fullscreen-overlay': this.fullscreen
        };

        // 检查是否有会话ID，如果有则直接显示聊天模态框
        if (this.conversationId && !this.showChatModal) {
            this.showChatModal = true;
        }


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

                    {/* 聊天界面 - 在显示聊天模态框时显示 */}
                    {this.showChatModal && (
                        <div >
                            <pcm-app-chat-modal
                                isOpen={true}
                                modalTitle={this.modalTitle}
                                icon={this.icon}
                                token={this.token}
                                isShowHeader={this.isShowHeader}
                                isNeedClose={this.isShowHeader}
                                zIndex={this.zIndex}
                                fullscreen={this.fullscreen}
                                botId="3022316191018903"
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                enableVoice={false}
                                customInputs={this.conversationId ? {} : {
                                    ...this.customInputs,
                                    file_url: this.uploadedFileInfo?.cos_key,
                                    file_name: this.uploadedFileInfo?.file_name,
                                }}
                                interviewMode={this.interviewMode}
                                showProgressBar={false}
                                onModalClosed={this.handleClose}
                                onStreamComplete={this.handleStreamComplete}
                                onConversationStart={this.handleConversationStart}
                                onInterviewComplete={this.handleInterviewComplete}
                                onRecordingError={this.handleRecordingError}
                                onTokenInvalid={this.handleTokenInvalid}
                            ></pcm-app-chat-modal>
                        </div>
                    )}
                </div>
            </div>
        );
    }
} 
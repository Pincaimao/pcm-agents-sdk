import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { FileUploadResponse, verifyApiKey } from '../../utils/utils';
import {
    StreamCompleteEventData,
    ConversationStartEventData,
    InterviewCompleteEventData,
    RecordingErrorEventData,
} from '../../interfaces/events';
import { ErrorEventBus, ErrorEventDetail } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';

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
     * 视频录制最大时长（秒）默认120
     */
    @Prop() maxRecordingTime: number = 120;

    /**
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 自定义输入参数，传入customInputs.job_info时，会隐藏JD输入区域<br>
     */
    @Prop() customInputs: Record<string, string> = {};

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
     * 是否启用全屏虚拟数字人模式，此模式下面试结果只会通过interviewComplete事件返回或者通过url_callback回调返回
     */
    @Prop() enableVirtualHuman: boolean = false;

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
     * 错误事件
     */
    @Event() someErrorEvent: EventEmitter<ErrorEventDetail>;

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
    private removeErrorListener: () => void;

    @Watch('token')
    handleTokenChange(newToken: string) {
        // 当传入的 token 变化时，更新 authStore 中的 token
        if (newToken && newToken !== authStore.getToken()) {
            authStore.setToken(newToken);
        }
    }


    @Watch('isOpen')
    async handleIsOpenChange(newValue: boolean) {
        if (!newValue) {
            // 重置状态
            this.showChatModal = false;
            this.jobDescription = '';
        } else {
            await verifyApiKey(this.token);
            this.showChatModal = true;
        }
    }

    componentWillLoad() {

        // 将 zIndex 存入配置缓存
        if (this.zIndex) {
            configStore.setItem('modal-zIndex', this.zIndex);
        }

        if (this.token) {
            authStore.setToken(this.token);
        }

        // 添加全局token无效事件监听器
        this.tokenInvalidListener = () => {
            this.tokenInvalid.emit();
        };
        // 添加全局错误监听
        this.removeErrorListener = ErrorEventBus.addErrorListener((errorDetail) => {
            this.someErrorEvent.emit(errorDetail);
        });
        document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);
    }

    disconnectedCallback() {
        // 组件销毁时移除事件监听器
        document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);
        // 移除错误监听器
        if (this.removeErrorListener) {
            this.removeErrorListener();
        }
    }

    private handleClose = () => {
        this.modalClosed.emit();
    };





    render() {
        if (!this.isOpen) return null;

        const modalStyle = {
            zIndex: String(this.zIndex)
        };

        const containerClass = {
            'modal-container': true,
            'fullscreen': this.fullscreen,
            'pc-layout': true,
        };

        const overlayClass = {
            'modal-overlay': true,
            'fullscreen-overlay': this.fullscreen
        };

        // 显示加载状态
        const isLoading = this.conversationId && !this.showChatModal;


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

                    {/* 加载状态 - 在有会话ID但聊天模态框尚未显示时展示 */}
                    {isLoading && (
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                            <p class="loading-text">正在加载对话...</p>
                        </div>
                    )}

                    {/* 聊天界面 - 在显示聊天模态框时显示 */}
                    {this.showChatModal && (
                        <div >
                            {this.enableVirtualHuman ? (
                                <pcm-virtual-chat-modal
                                    isOpen={true}
                                    fullscreen={this.fullscreen}
                                    botId="3022316191018903"
                                    digitalId={this.digitalId}
                                    openingIndex={this.openingIndex}
                                    conversationId={this.conversationId}
                                    defaultQuery={this.defaultQuery}
                                    customInputs={{
                                        ...this.customInputs,
                                        file_url: this.customInputs?.file_url || this.uploadedFileInfo?.cos_key,
                                        file_name: this.customInputs?.file_name || this.uploadedFileInfo?.file_name,
                                        job_info: this.customInputs?.job_info || this.jobDescription,
                                        interview_type: "1"
                                    }}
                                ></pcm-virtual-chat-modal>
                            ) : (
                                <pcm-app-chat-modalW
                                    isOpen={true}
                                    modalTitle={this.modalTitle}
                                    icon={this.icon}
                                    isShowHeader={this.isShowHeader}
                                    isNeedClose={this.isShowHeader}
                                    fullscreen={this.fullscreen}
                                    botId="3022316191018903"
                                    conversationId={this.conversationId}
                                    defaultQuery={this.defaultQuery}
                                    maxRecordingTime={this.maxRecordingTime}
                                    customInputs={{
                                        ...this.customInputs,
                                        file_url: this.uploadedFileInfo?.cos_key,
                                        file_name: this.uploadedFileInfo?.file_name,
                                    }}
                                    interviewMode='video'
                                ></pcm-app-chat-modalW>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
} 
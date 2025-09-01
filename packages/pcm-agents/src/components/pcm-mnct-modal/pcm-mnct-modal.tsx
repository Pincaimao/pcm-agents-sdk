import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse, verifyApiKey } from '../../utils/utils';
import { ConversationStartEventData, InterviewCompleteEventData, StreamCompleteEventData } from '../../components';
import { ErrorEventBus, ErrorEventDetail } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';
import { SentryReporter } from '../../utils/sentry-reporter';

/**
 * 模拟出题大师
 */

@Component({
    tag: 'pcm-mnct-modal',
    styleUrls: ['pcm-mnct-modal.css', '../../global/global.css', '../../global/host.css'],
    shadow: true,
})
export class MnctModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '面试出题大师';

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
    @Prop() defaultQuery: string = '请开始出题';

    /**
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 自定义输入参数<br>
     * 传入customInputs.job_info时，会隐藏JD输入区域。<br>
     * 传入customInputs.file_url时，会隐藏简历上传区域。<br>
     * 传入customInputs.file_url和customInputs.job_info时，会直接开始聊天。<br>
     * 传入customInputs.question_number时，会设置面试题数量。<br>
     * 传入customInputs.can_outputAnalysis时，会设置是否需要参考答案。<br>
     */
    @Prop() customInputs: Record<string, string> = {};

    /**
     * 是否显示工作区历史会话按钮
     */
    @Prop() showWorkspaceHistory: boolean = false;

    /**
     * 面试题数量，默认6题（范围：3-20题）
     */
    @Prop({ mutable: true }) questionNumber: number = 6;

    /**
     * 是否需要参考答案，默认开启
     */
    @Prop({ mutable: true }) canOutputAnalysis: boolean = true;

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
     * 附件预览模式
     * 'drawer': 在右侧抽屉中预览
     * 'window': 在新窗口中打开
     */
    @Prop() filePreviewMode: 'drawer' | 'window' = 'window';

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
            this.clearSelectedFile();
            this.showChatModal = false;
            this.jobDescription = '';

        } else {
            if (this.customInputs && this.customInputs.job_info) {
                this.jobDescription = this.customInputs.job_info;
            }

            await verifyApiKey(this.token);

            // 如果有会话ID或者同时有file_url和job_info，直接显示聊天模态框
            if (this.conversationId || (this.customInputs?.file_url && this.customInputs?.job_info)) {
                this.showChatModal = true;
            }
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

    private handleFileChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    };

    private handleUploadClick = () => {
        const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
        fileInput?.click();
    };

    private clearSelectedFile = () => {
        this.selectedFile = null;
        this.uploadedFileInfo = null;
        const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    private async uploadFile() {
        if (!this.selectedFile) return;

        this.isUploading = true;

        try {
            // 使用 uploadFileToBackend 工具函数上传文件
            const result = await uploadFileToBackend(this.selectedFile, {
            }, {
                'tags': ['resume']
            });

            this.uploadedFileInfo = result;
            this.uploadSuccess.emit(result);
        } catch (error) {
            console.error('文件上传错误:', error);
            this.clearSelectedFile();
            SentryReporter.captureError(error, {
                action: 'uploadFile',
                component: 'pcm-mnct-modal',
                title: '文件上传失败'
            });
            ErrorEventBus.emitError({
                error: error,
                message: '文件上传失败，请重试'
            });
        } finally {
            this.isUploading = false;
        }
    }

    private handleJobDescriptionChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.jobDescription = textarea.value;
    };

    private handleQuestionNumberChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        const value = parseInt(input.value);
        this.questionNumber = (value >= 3 && value <= 20) ? value : 6;
    };

    private handleAnalysisToggle = (event: Event) => {
        const input = event.target as HTMLInputElement;
        this.canOutputAnalysis = input.checked;
    };

    private handleStartInterview = async () => {
        if (!this.selectedFile) {
            alert('请上传简历');
            return;
        }

        // 如果没有预设的job_info，则需要检查用户输入
        if (!this.customInputs?.job_info && !this.jobDescription.trim()) {
            alert('请输入职位描述');
            return;
        }

        this.isSubmitting = true;

        try {
            // 如果还没上传，先上传文件
            if (!this.uploadedFileInfo) {
                await this.uploadFile();
                if (!this.uploadedFileInfo) {
                    this.isSubmitting = false;
                    return; // 上传失败
                }
            }

            // 直接显示聊天模态框
            this.showChatModal = true;
        } catch (error) {
            console.error('开始面试时出错:', error);
            SentryReporter.captureError(error, {
                action: 'handleStartInterview',
                component: 'pcm-mnct-modal',
                title: '开始面试时出错'
            });
            ErrorEventBus.emitError({
                error: error,
                message: '开始面试时出错，请重试'
            });
        } finally {
            this.isSubmitting = false;
        }
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

        // 判断是否隐藏JD输入区域
        const hideJdInput = Boolean(this.customInputs && this.customInputs.job_info);
        
        // 判断是否隐藏简历上传区域
        const hideResumeUpload = Boolean(this.customInputs && this.customInputs.file_url);
        
        // 判断是否同时提供了file_url和job_info
        const hasFileAndJob = Boolean(this.customInputs?.file_url && this.customInputs?.job_info);

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

                    {/* 上传界面 - 仅在不显示聊天模态框且没有会话ID且没有同时提供file_url和job_info时显示 */}
                    {!this.showChatModal && !this.conversationId && !hasFileAndJob && (
                        <div class="input-container">
                            {/* JD输入区域 - 仅在没有customInputs.job_info时显示 */}
                            {!hideJdInput && (
                                <div class="jd-input-section">
                                    <label htmlFor="job-description">请输入职位描述 (JD)</label>
                                    <textarea
                                        id="job-description"
                                        class="job-description-textarea"
                                        placeholder="请输入职位描述，包括职责、要求等信息..."
                                        rows={6}
                                        value={this.jobDescription}
                                        onInput={this.handleJobDescriptionChange}
                                    ></textarea>
                                </div>
                            )}

                            {/* 简历上传区域 - 仅在没有customInputs.file_url时显示 */}
                            {!hideResumeUpload && (
                                <div class="resume-upload-section">
                                    <label>上传简历</label>
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
                                                <p class="upload-hint">支持 txt、markdown、pdf、docx、doc、md 格式</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 面试设置区域 */}
                            <div class="interview-settings-section">
                                <div class="settings-row">
                                    <div class="question-number-section">
                                        <label class="settings-label">面试题数量：</label>
                                        <div class="slider-container">
                                            <input
                                                type="range"
                                                min="3"
                                                max="20"
                                                value={this.questionNumber}
                                                class="question-slider"
                                                onInput={this.handleQuestionNumberChange}
                                            />
                                            <div class="slider-value">{this.questionNumber}题</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="settings-row">
                                    <div class="analysis-toggle-section">
                                        <label class="settings-label">是否需要参考答案：</label>
                                        <div class="toggle-container">
                                            <label class="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={this.canOutputAnalysis}
                                                    onChange={this.handleAnalysisToggle}
                                                />
                                                <span class="toggle-slider"></span>
                                            </label>
                                            <span class="toggle-text">{this.canOutputAnalysis ? '开启' : '关闭'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                class="submit-button"
                                disabled={((!hideResumeUpload && !this.selectedFile) || 
                                           (!hideJdInput && !this.jobDescription.trim())) || 
                                           this.isUploading || this.isSubmitting}
                                onClick={this.handleStartInterview}
                            >
                                {this.isUploading ? '上传中...' : this.isSubmitting ? '处理中...' : '开始分析'}
                            </button>

                            <div class="ai-disclaimer">
                                <p>所有内容均由AI生成仅供参考</p>
                                <p class="beian-info">
                                    <span>中央网信办生成式人工智能服务备案号</span>：
                                    <a href="https://www.pincaimao.com" target="_blank" rel="noopener noreferrer">Hunan-PinCaiMao-202412310003</a>
                                </p>
                            </div>

                            <input
                                type="file"
                                class="file-input"
                                onChange={this.handleFileChange}
                            />
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
                        <div>
                            <pcm-app-chat-modal
                                isOpen={true}
                                modalTitle={this.modalTitle}
                                icon={this.icon}
                                isShowHeader={this.isShowHeader}
                                isNeedClose={this.isShowHeader}
                                fullscreen={this.fullscreen}
                                showWorkspaceHistory={this.showWorkspaceHistory}
                                botId="3022316191018876"
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                filePreviewMode={this.filePreviewMode}
                                customInputs={{
                                    ...this.customInputs,
                                    file_url: this.customInputs?.file_url || this.uploadedFileInfo?.cos_key,
                                    file_name: this.customInputs?.file_name || this.uploadedFileInfo?.file_name,
                                    job_info: this.customInputs?.job_info || this.jobDescription,
                                    question_number: this.questionNumber,
                                    can_outputAnalysis: this.canOutputAnalysis ? 'true' : 'false',
                                }}
                                interviewMode="text"
                            ></pcm-app-chat-modal>
                        </div>
                    )}
                </div>
            </div>
        );
    }
} 
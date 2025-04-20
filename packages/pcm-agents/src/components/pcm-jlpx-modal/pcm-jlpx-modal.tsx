import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse, sendHttpRequest } from '../../utils/utils';

@Component({
    tag: 'pcm-jlpx-modal',
    styleUrls: ['pcm-jlpx-modal.css','../../global/global.css'],
    shadow: true,
})
export class JlpxModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '简历剖析助手';

    /**
     * API鉴权密钥
     */
    @Prop({ attribute: 'token' }) token: string = '';

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
    @Prop() defaultQuery: string = '';

    /**
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;


    /**
     * 自定义输入参数，传入job_info时，会隐藏JD输入区域
     */
    @Prop() customInputs: { [key: string]: any } = {};

    /**
     * 上传成功事件
     */
    @Event() uploadSuccess: EventEmitter<FileUploadResponse>;

    /**
     * 流式输出完成事件
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

    /**
     * 当聊天完成时触发
     */
    @Event() interviewComplete: EventEmitter<{
        conversation_id: string;
        total_questions: number;
    }>;

    /**
     * API密钥验证失败事件
     */
    @Event() apiKeyInvalid: EventEmitter<void>;

    @State() selectedFile: File | null = null;
    @State() isUploading: boolean = false;
    @State() uploadedFileInfo: FileUploadResponse | null = null;
    @State() showChatModal: boolean = false;
    @State() jobDescription: string = '';
    @State() isSubmitting: boolean = false;

    // 添加新的状态来控制过渡动画
    @State() isTransitioning: boolean = false;
    @State() transitionTimer: any = null;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    private handleClose = () => {
        this.isOpen = false;
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

    private handleJobDescriptionChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.jobDescription = textarea.value;
    };

    private async uploadFile() {
        if (!this.selectedFile) return;

        this.isUploading = true;

        try {
            const result = await uploadFileToBackend(this.selectedFile, {
                'authorization': 'Bearer ' + this.token
            });

            this.uploadedFileInfo = result;
            // 触发上传成功事件
            this.uploadSuccess.emit(result);
        } catch (error) {
            console.error('文件上传错误:', error);
            this.clearSelectedFile();
            alert(error instanceof Error ? error.message : '文件上传失败，请重试');
        } finally {
            this.isUploading = false;
        }
    }

    private handleStartAnalysis = async () => {
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

            // 使用预设的job_info或用户输入的jobDescription
            const jobInfo = this.customInputs?.job_info || this.jobDescription;

            console.log('传递的customInputs:', {
                ...this.customInputs,
                file_url: this.uploadedFileInfo.cos_key,
                job_info: jobInfo
            });

            // 直接显示聊天模态框
            this.showChatModal = true;
        } catch (error) {
            console.error('开始分析时出错:', error);
            alert('开始分析时出错，请重试');
        } finally {
            this.isSubmitting = false;
        }
    };

    @Watch('isOpen')
    handleIsOpenChange(newValue: boolean) {
        if (!newValue) {
            // 重置状态
            this.clearSelectedFile();
            this.showChatModal = false;
            this.jobDescription = '';
            
            // 清除可能存在的计时器
            if (this.transitionTimer) {
                clearTimeout(this.transitionTimer);
                this.transitionTimer = null;
            }
        } else {
            // 当模态框打开时，验证API密钥
            this.verifyApiKey();
            
            if (this.conversationId) {
                // 如果有会话ID，直接显示聊天模态框
                this.showChatModal = true;
            }
        }
    }

    /**
     * 验证API密钥
     */
    private async verifyApiKey() {
        if (!this.token) {
            this.apiKeyInvalid.emit();
            return;
        }
        try {
            const response = await sendHttpRequest({
                url: '/sdk/v1/user',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.success) {
                throw new Error(response.message || 'API密钥验证失败');
            }
            
            // 验证成功，继续正常流程
        } catch (error) {
            console.error('API密钥验证错误:', error);
            // 通知父组件API密钥无效
            this.apiKeyInvalid.emit();
        } 
    }

    componentWillLoad() {
        // 检查 customInputs 中是否有 job_info
        if (this.customInputs && this.customInputs.job_info) {
            this.jobDescription = this.customInputs.job_info;
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

        // 检查是否有会话ID，如果有则直接显示聊天模态框
        if (this.conversationId && !this.showChatModal) {
            this.showChatModal = true;
        }

        // 修正这里的逻辑，确保当 customInputs.job_info 存在时，hideJdInput 为 true
        const hideJdInput = Boolean(this.customInputs && this.customInputs.job_info);

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

                    {/* 输入界面 - 仅在不显示聊天模态框且没有会话ID时显示 */}
                    {!this.showChatModal && !this.conversationId && (
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
                            
                            {/* 简历上传区域 */}
                            <div class="resume-upload-section">
                                <label>上传简历</label>
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
                                            <p class="upload-hint">支持 txt、markdown、pdf、docx、md 格式</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                class="submit-button"
                                disabled={!this.selectedFile || (!hideJdInput && !this.jobDescription.trim()) || this.isUploading || this.isSubmitting}
                                onClick={this.handleStartAnalysis}
                            >
                                {this.isUploading ? '上传中...' : this.isSubmitting ? '处理中...' : '开始分析'}
                            </button>

                            <input
                                type="file"
                                class="file-input"
                                onChange={this.handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,.md"
                            />
                        </div>
                    )}

                    {/* 聊天界面 - 在显示聊天模态框时显示 */}
                    {this.showChatModal && (
                        <div class="chat-modal-container">
                            <pcm-app-chat-modal
                                isOpen={true}
                                modalTitle={this.modalTitle}
                                icon={this.icon}
                                token={this.token}
                                isShowHeader={this.isShowHeader} 
                                isNeedClose={this.isShowHeader} 
                                zIndex={this.zIndex}
                                fullscreen={this.fullscreen}
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                enableTTS={false}
                                enableVoice={false}
                                botId="3022316191018881"
                                customInputs={this.conversationId ? undefined : {
                                    ...this.customInputs,
                                    file_url: this.uploadedFileInfo?.cos_key,
                                    job_info: this.customInputs?.job_info || this.jobDescription
                                }}
                                interviewMode="text"
                                onModalClosed={this.handleClose}
                                onStreamComplete={this.handleStreamComplete}
                                onConversationStart={this.handleConversationStart}
                                onInterviewComplete={this.handleInterviewComplete}
                            ></pcm-app-chat-modal>
                        </div>
                    )}
                </div>
            </div>
        );
    }
} 
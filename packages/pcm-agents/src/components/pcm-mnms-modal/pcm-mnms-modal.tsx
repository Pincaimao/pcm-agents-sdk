import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';

@Component({
    tag: 'pcm-mnms-modal',
    styleUrl: 'pcm-mnms-modal.css',
    shadow: true,
})
export class MnmsModal {
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
     * 会话ID
     */
    @Prop({ mutable: true }) conversationId?: string;

    /**
     * 默认查询文本
     */
    @Prop() defaultQuery: string = '';

    /**
     * 是否以全屏模式打开
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 是否为移动端布局
     */
    @Prop() isMobile: boolean = false;

    /**
     * 自定义输入参数
     */
    @Prop() customInputs: { [key: string]: any } = {};

    /**
     * 上传成功事件
     */
    @Event() uploadSuccess: EventEmitter<{
        cos_key: string;
        filename: string;
        ext: string;
        presigned_url: string;
    }>;

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

    @State() selectedFile: File | null = null;
    @State() isUploading: boolean = false;
    @State() uploadedFileInfo: { cos_key: string, filename: string, ext: string, presigned_url: string } | null = null;
    @State() showChatModal: boolean = false;

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

    private async uploadFile() {
        if (!this.selectedFile) return;

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
            if (!response.ok) {
                throw new Error(result.message || '文件上传失败');
            }

            if (result) {
                this.uploadedFileInfo = {
                    cos_key: result.cos_key,
                    filename: result.filename,
                    ext: result.ext,
                    presigned_url: result.presigned_url
                };

                // 触发上传成功事件
                this.uploadSuccess.emit(this.uploadedFileInfo);
            }
        } catch (error) {
            console.error('文件上传错误:', error);
            this.clearSelectedFile();
            alert(error instanceof Error ? error.message : '文件上传失败，请重试');
        } finally {
            this.isUploading = false;
        }
    }

    private handleStartInterview = async () => {
        if (!this.selectedFile) {
            alert('请上传简历');
            return;
        }

        // 如果还没上传，先上传文件
        if (!this.uploadedFileInfo) {
            await this.uploadFile();
            if (!this.uploadedFileInfo) {
                return; // 上传失败
            }
        }

        console.log('传递的customInputs:', {
            ...this.customInputs,
            file_url: this.uploadedFileInfo.cos_key
        });

        // 直接显示聊天模态框，不使用过渡动画
        this.showChatModal = true;
    };

    @Watch('isOpen')
    handleIsOpenChange(newValue: boolean) {
        if (!newValue) {
            // 重置状态
            this.clearSelectedFile();
            this.showChatModal = false;
            
            // 清除可能存在的计时器
            if (this.transitionTimer) {
                clearTimeout(this.transitionTimer);
                this.transitionTimer = null;
            }
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

        console.log('showChatModal:', this.showChatModal);

        const containerClass = {
            'modal-container': true,
            'fullscreen': this.fullscreen,
            'pc-layout': !this.isMobile,
            'mobile-layout': this.isMobile
        };
        
        const overlayClass = {
            'modal-overlay': true,
            'fullscreen-overlay': this.fullscreen
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

                    {/* 上传界面 - 仅在不显示聊天模态框时显示 */}
                    {!this.showChatModal && (
                        <div class="upload-container">
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
                                        <p class="upload-hint">支持 txt、 markdown、 pdf、 docx、 md 格式</p>
                                    </div>
                                )}
                            </div>

                            <button
                                class="submit-button"
                                disabled={!this.selectedFile || this.isUploading}
                                onClick={this.handleStartInterview}
                            >
                                {this.isUploading ? '上传中...' : '开始面试'}
                            </button>

                            <input
                                type="file"
                                class="file-input"
                                onChange={this.handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,.md"
                            />
                        </div>
                    )}

                    {/* 聊天界面 - 仅在显示聊天模态框时显示 */}
                    {this.showChatModal && this.uploadedFileInfo && (
                        <div class="chat-modal-container">
                            <pcm-app-chat-modal
                                isOpen={true}
                                modalTitle={this.modalTitle}
                                icon={this.icon}
                                apiKey={this.apiKey}
                                isShowHeader={this.isShowHeader} // 不显示内部的标题栏，因为外部已有
                                isNeedClose={this.isShowHeader} // 不显示内部的关闭按钮，因为外部已有
                                zIndex={this.zIndex}
                                fullscreen={this.fullscreen}
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                enableVoice={false}
                                customInputs={{
                                    ...this.customInputs,
                                    file_url: this.uploadedFileInfo?.cos_key
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
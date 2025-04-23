import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse, verifyApiKey } from '../../utils/utils';

/**
 * 劳动合同卫士
 */

@Component({
    tag: 'pcm-htws-modal',
    styleUrls: ['pcm-htws-modal.css', '../../global/global.css'],
    shadow: true,
})
export class HtwsModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '劳动合同卫士';

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
    @Prop() defaultQuery: string = '请开始分析';

    /**
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 自定义输入参数，传入input时，会自动切换到自由输入模式
     * 
     * htwsModal.customInputs = {
     *      input: "负责市场营销策略制定与执行；开展市场调研，分析竞争对手情况；"
     * };
     */
    @Prop() customInputs: Record<string, any> = {};

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
     * SDK密钥验证失败事件
     */
    @Event() tokenInvalid: EventEmitter<void>;

    @State() selectedFile: File | null = null;
    @State() isUploading: boolean = false;
    @State() uploadedFileInfo: FileUploadResponse | null = null;
    @State() showChatModal: boolean = false;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    @State() isSubmitting: boolean = false;

    // 添加输入模式状态
    @State() inputMode: 'upload' | 'free' = 'upload';
    
    // 自由输入模式的文本
    @State() freeInputText: string = '';

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
            // 使用 uploadFileToBackend 工具函数上传文件
            const result = await uploadFileToBackend(this.selectedFile, {
                'authorization': 'Bearer ' + this.token
            }, {
                'tags': 'other'
            });

            this.uploadedFileInfo = result;
            this.uploadSuccess.emit(result);
        } catch (error) {
            console.error('文件上传错误:', error);
            this.clearSelectedFile();
            alert(error instanceof Error ? error.message : '文件上传失败，请重试');
        } finally {
            this.isUploading = false;
        }
    }

    // 添加切换输入模式的方法
    private handleToggleInput = () => {
        this.inputMode = this.inputMode === 'upload' ? 'free' : 'upload';
    };

    // 添加自由输入文本变更处理方法
    private handleFreeInputChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.freeInputText = textarea.value;
    };

    private handleStartInterview = async () => {
        if (this.inputMode === 'upload' && !this.selectedFile) {
            alert('请上传合同文件');
            return;
        }

        if (this.inputMode === 'free' && !this.freeInputText.trim()) {
            alert('请输入合同内容');
            return;
        }

        this.isSubmitting = true;

        try {
            if (this.inputMode === 'upload') {
                // 如果还没上传，先上传文件
                if (!this.uploadedFileInfo) {
                    await this.uploadFile();
                    if (!this.uploadedFileInfo) {
                        this.isSubmitting = false;
                        return; // 上传失败
                    }
                }
            }

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
            this.freeInputText = '';
            this.inputMode = 'upload'; // 重置为默认上传模式
        } else {
            // 当模态框打开时，验证API密钥
            this.verifyApiKey();
            
            if (this.conversationId) {
                // 如果有会话ID，直接显示聊天模态框
                this.showChatModal = true;
            }
        }
    }

    componentWillLoad() {
        // 检查 customInputs 中是否有 input
        if (this.customInputs && this.customInputs.input) {
            // 如果有 input，直接切换到自由输入模式并填充内容
            this.inputMode = 'free';
            this.freeInputText = this.customInputs.input;
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

    /**
     * 验证API密钥
     */
    private async verifyApiKey() {
        try {
            const isValid = await verifyApiKey(this.token);
            
            if (!isValid) {
                throw new Error('API密钥验证失败');
            }
        } catch (error) {
            console.error('API密钥验证错误:', error);
            // 通知父组件API密钥无效
            this.tokenInvalid.emit();
        }
    }

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

                    {/* 输入界面 - 仅在不显示聊天模态框且没有会话ID时显示 */}
                    {!this.showChatModal && !this.conversationId && (
                        <div class="input-container">
                            {/* 输入模式切换 */}
                            <div class="input-mode-toggle">
                                <span>合同内容</span>
                                <button 
                                    class="toggle-button" 
                                    onClick={this.handleToggleInput}
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    切换输入
                                </button>
                            </div>

                            {/* 上传模式 */}
                            {this.inputMode === 'upload' && (
                                <div class="resume-upload-section">
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
                                                <p>点击上传合同</p>
                                                <p class="upload-hint">支持markdown、pdf、docx、doc、md 格式</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 自由输入模式 */}
                            {this.inputMode === 'free' && (
                                <div class="free-input">
                                    <div class="textarea-container">
                                        <textarea
                                            id="free-input-text"
                                            placeholder="请输入合同内容"
                                            rows={8}
                                            value={this.freeInputText}
                                            onInput={this.handleFreeInputChange}
                                        ></textarea>
                                    </div>

                                    <div class="input-guide">
                                        <div class="guide-title">输入提示：</div>
                                        <div class="guide-content">
                                            <div>• 请输入完整的劳动合同内容</div>
                                            <div>• 包括甲方（公司）、乙方（员工）信息</div>
                                            <div>• 合同期限、工作内容、工作地点</div>
                                            <div>• 工作时间、休息休假、劳动报酬</div>
                                            <div>• 社会保险、劳动保护、劳动条件</div>
                                            <div>• 合同变更、解除和终止条件等</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                class="submit-button"
                                disabled={(this.inputMode === 'upload' && !this.selectedFile) || 
                                         (this.inputMode === 'free' && !this.freeInputText.trim()) || 
                                         this.isUploading || 
                                         this.isSubmitting}
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

                    {/* 聊天界面 - 在显示聊天模态框时显示 */}
                    {this.showChatModal && (
                        <div>
                            <pcm-app-chat-modal
                                isOpen={true}
                                modalTitle={this.modalTitle}
                                icon={this.icon}
                                token={this.token}
                                isShowHeader={this.isShowHeader}
                                isNeedClose={this.isShowHeader}
                                zIndex={this.zIndex}
                                fullscreen={this.fullscreen}
                                botId="3022316191018882"
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                enableVoice={false}
                                customInputs={this.conversationId ? undefined : {
                                    ...this.customInputs,
                                    file_url: this.inputMode === 'upload' ? this.uploadedFileInfo?.cos_key : undefined,
                                    input: this.inputMode === 'free' ? this.freeInputText : undefined
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
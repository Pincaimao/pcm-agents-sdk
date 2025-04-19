import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse } from '../../utils/utils';

/**
 * 职业规划类型枚举
 */
export type CareerPlanType = '长期规划' | '转行建议' | '晋升路径';

@Component({
    tag: 'pcm-zygh-modal',
    styleUrls: ['pcm-zygh-modal.css','../../global/global.css'],
    shadow: true,
})
export class ZyghModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '职业规划助手';

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
    @Event() planningComplete: EventEmitter<{
        conversation_id: string;
        plan_type: CareerPlanType;
    }>;

    @State() selectedFile: File | null = null;
    @State() isUploading: boolean = false;
    @State() uploadedFileInfo: FileUploadResponse | null = null;
    @State() showChatModal: boolean = false;
    @State() isSubmitting: boolean = false;
    @State() selectedPlanType: CareerPlanType = '长期规划';

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

    private handlePlanTypeChange = (type: CareerPlanType) => {
        this.selectedPlanType = type;
    };

    private async uploadFile() {
        if (!this.selectedFile) return;

        this.isUploading = true;

        try {
            const result = await uploadFileToBackend(this.selectedFile, {
                'authorization': 'Bearer ' + this.apiKey
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

    private handleStartPlanning = async () => {
        if (!this.selectedFile) {
            alert('请上传简历');
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

            console.log('传递的customInputs:', {
                ...this.customInputs,
                file_url: this.uploadedFileInfo.cos_key,
                plan_type: this.selectedPlanType
            });

            // 直接显示聊天模态框
            this.showChatModal = true;
        } catch (error) {
            console.error('开始规划时出错:', error);
            alert('开始规划时出错，请重试');
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
            
            // 清除可能存在的计时器
            if (this.transitionTimer) {
                clearTimeout(this.transitionTimer);
                this.transitionTimer = null;
            }
        } else if (this.conversationId) {
            // 如果有会话ID，直接显示聊天模态框
            this.showChatModal = true;
        }
    }

    componentWillLoad() {
        // 检查 customInputs 中是否有 plan_type
        if (this.customInputs && this.customInputs.plan_type) {
            this.selectedPlanType = this.customInputs.plan_type;
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

    // 处理规划完成事件
    private handlePlanningComplete = (event: CustomEvent) => {
        this.planningComplete.emit({
            ...event.detail,
            plan_type: this.selectedPlanType
        });
    };

    render() {
        if (!this.isOpen) return null;

        const modalStyle = {
            zIndex: String(this.zIndex)
        };

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
                            
                            {/* 规划类型选择 */}
                            <div class="plan-type-section">
                                <label>选择规划类型</label>
                                <div class="plan-type-options">
                                    <div 
                                        class={`plan-type-option ${this.selectedPlanType === '长期规划' ? 'selected' : ''}`}
                                        onClick={() => this.handlePlanTypeChange('长期规划')}
                                    >
                                        <div class="option-icon">📈</div>
                                        <div class="option-label">长期规划</div>
                                    </div>
                                    <div 
                                        class={`plan-type-option ${this.selectedPlanType === '转行建议' ? 'selected' : ''}`}
                                        onClick={() => this.handlePlanTypeChange('转行建议')}
                                    >
                                        <div class="option-icon">🔄</div>
                                        <div class="option-label">转行建议</div>
                                    </div>
                                    <div 
                                        class={`plan-type-option ${this.selectedPlanType === '晋升路径' ? 'selected' : ''}`}
                                        onClick={() => this.handlePlanTypeChange('晋升路径')}
                                    >
                                        <div class="option-icon">🚀</div>
                                        <div class="option-label">晋升路径</div>
                                    </div>
                                </div>
                            </div>
                            
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
                                disabled={!this.selectedFile || this.isUploading || this.isSubmitting}
                                onClick={this.handleStartPlanning}
                            >
                                {this.isUploading ? '上传中...' : this.isSubmitting ? '处理中...' : '开始规划'}
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
                                apiKey={this.apiKey}
                                isShowHeader={this.isShowHeader} 
                                isNeedClose={this.isShowHeader} 
                                zIndex={this.zIndex}
                                botId="3022316191018898"
                                fullscreen={this.fullscreen}
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                enableVoice={false}
                                customInputs={this.conversationId ? undefined : {
                                    ...this.customInputs,
                                    file_url: this.uploadedFileInfo?.cos_key,
                                    type: this.selectedPlanType
                                }}
                                interviewMode="text"
                                onModalClosed={this.handleClose}
                                onStreamComplete={this.handleStreamComplete}
                                onConversationStart={this.handleConversationStart}
                                onInterviewComplete={this.handlePlanningComplete}
                            ></pcm-app-chat-modal>
                        </div>
                    )}
                </div>
            </div>
        );
    }
} 
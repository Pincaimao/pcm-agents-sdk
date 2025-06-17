import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse, verifyApiKey } from '../../utils/utils';
import { ConversationStartEventData, ErrorEventDetail, InterviewCompleteEventData, StreamCompleteEventData } from '../../components';
import { ErrorEventBus } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';
import { SentryReporter } from '../../utils/sentry-reporter';

/**
 * 简历筛选
 */

// 定义简历记录接口
interface ResumeRecord {
    id: string;
    fileName: string;
    talentInfo: string;
    score: number;
    scoreDetail: string;
    uploadTime: Date;
    fileInfo: FileUploadResponse;
}

@Component({
    tag: 'pcm-jlsx-modal',
    styleUrls: ['pcm-jlsx-modal.css', '../../global/global.css'],
    shadow: true,
})
export class JlsxModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '简历筛选精灵';

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
     * 自定义输入参数
     */
    @Prop() customInputs: Record<string, string> = {};

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

    // State 管理
    @State() currentStep: 'input' | 'task' = 'input'; // 当前步骤
    @State() jobDescription: string = '';
    @State() evaluationCriteria: string = '';
    @State() isSubmitting: boolean = false;
    @State() isUploading: boolean = false;
    @State() resumeRecords: ResumeRecord[] = [];
    @State() selectedFiles: File[] = [];
    @State() showJdDrawer: boolean = false;
    @State() showCriteriaDrawer: boolean = false;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

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
            this.resetStates();
        } else {
            if (this.customInputs && this.customInputs.job_info) {
                this.jobDescription = this.customInputs.job_info;
            }
            await verifyApiKey(this.token);
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

    private resetStates = () => {
        this.currentStep = 'input';
        this.jobDescription = '';
        this.evaluationCriteria = '';
        this.isSubmitting = false;
        this.isUploading = false;
        this.resumeRecords = [];
        this.selectedFiles = [];
        this.showJdDrawer = false;
        this.showCriteriaDrawer = false;
    };

    private handleClose = () => {
        this.modalClosed.emit();
    };

    private handleJobDescriptionChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.jobDescription = textarea.value;
    };

    private handleEvaluationCriteriaChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.evaluationCriteria = textarea.value;
    };

    private handleCreateTask = async () => {
        if (!this.jobDescription.trim()) {
            alert('请输入职位描述');
            return;
        }

        if (!this.evaluationCriteria.trim()) {
            alert('请输入评分标准');
            return;
        }

        this.isSubmitting = true;

        try {
            // 这里可以添加创建任务的API调用
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
            
            // 切换到任务界面
            this.currentStep = 'task';
        } catch (error) {
            console.error('创建任务时出错:', error);
            SentryReporter.captureError(error, {
                action: 'handleCreateTask',
                component: 'pcm-jlsx-modal',
                title: '创建任务时出错'
            });
            ErrorEventBus.emitError({
                error: error,
                message: '创建任务时出错，请重试'
            });
        } finally {
            this.isSubmitting = false;
        }
    };

    private handleFileChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFiles = Array.from(input.files);
        }
    };

    private handleUploadClick = () => {
        const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
        fileInput?.click();
    };

    private removeFile = (index: number) => {
        this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    };

    private async uploadResumes() {
        if (this.selectedFiles.length === 0) {
            alert('请选择简历文件');
            return;
        }

        this.isUploading = true;

        try {
            const uploadPromises = this.selectedFiles.map(async (file) => {
                const result = await uploadFileToBackend(file, {}, { 'tags': ['resume'] });
                
                // 创建新的简历记录
                const record: ResumeRecord = {
                    id: Date.now() + Math.random().toString(),
                    fileName: file.name,
                    talentInfo: '分析中...',
                    score: 0,
                    scoreDetail: '评估中...',
                    uploadTime: new Date(),
                    fileInfo: result
                };

                return record;
            });

            const newRecords = await Promise.all(uploadPromises);
            this.resumeRecords = [...this.resumeRecords, ...newRecords];
            this.selectedFiles = [];

            // 清空文件输入
            const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }

            // 开始分析简历
            this.analyzeResumes(newRecords);

        } catch (error) {
            console.error('文件上传错误:', error);
            SentryReporter.captureError(error, {
                action: 'uploadResumes',
                component: 'pcm-jlsx-modal',
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

    private async analyzeResumes(records: ResumeRecord[]) {
        // 模拟分析过程
        for (const record of records) {
            setTimeout(() => {
                const recordIndex = this.resumeRecords.findIndex(r => r.id === record.id);
                if (recordIndex !== -1) {
                    this.resumeRecords[recordIndex] = {
                        ...this.resumeRecords[recordIndex],
                        talentInfo: '张三 | 5年工作经验 | 本科学历',
                        score: Math.floor(Math.random() * 40) + 60, // 60-100分
                        scoreDetail: '技能匹配度85%，经验符合要求，学历背景良好'
                    };
                    this.resumeRecords = [...this.resumeRecords]; // 触发重新渲染
                }
            }, Math.random() * 3000 + 1000); // 1-4秒随机延迟
        }
    }

    private toggleJdDetail = () => {
        this.showJdDrawer = true;
    };

    private toggleCriteriaDetail = () => {
        this.showCriteriaDrawer = true;
    };

    private closeJdDrawer = () => {
        this.showJdDrawer = false;
    };

    private closeCriteriaDrawer = () => {
        this.showCriteriaDrawer = false;
    };

    private renderInputStep() {
        return (
            <div class="input-container">
                <div class="step-header">
                    <h3>创建简历筛选任务</h3>
                    <p class="step-description">请输入职位描述和评分标准</p>
                </div>

                <div class="jd-input-section">
                    <label htmlFor="job-description">职位描述 (JD) *</label>
                    <textarea
                        id="job-description"
                        class="job-description-textarea"
                        placeholder="请输入职位描述，包括职责、要求等信息..."
                        rows={6}
                        value={this.jobDescription}
                        onInput={this.handleJobDescriptionChange}
                    ></textarea>
                </div>

                <div class="criteria-input-section">
                    <label htmlFor="evaluation-criteria">评分标准 *</label>
                    <textarea
                        id="evaluation-criteria"
                        class="job-description-textarea"
                        placeholder="请输入评分标准，如技能要求、经验要求、学历要求等..."
                        rows={4}
                        value={this.evaluationCriteria}
                        onInput={this.handleEvaluationCriteriaChange}
                    ></textarea>
                </div>

                <button
                    class="submit-button"
                    disabled={!this.jobDescription.trim() || !this.evaluationCriteria.trim() || this.isSubmitting}
                    onClick={this.handleCreateTask}
                >
                    {this.isSubmitting ? '创建中...' : '创建任务'}
                </button>

                <div class="ai-disclaimer">
                    <p>所有内容均由AI生成仅供参考</p>
                    <p class="beian-info">
                        <span>中央网信办生成式人工智能服务备案号</span>：
                        <a href="https://www.pincaimao.com" target="_blank" rel="noopener noreferrer">Hunan-PinCaiMao-202412310003</a>
                    </p>
                </div>
            </div>
        );
    }

    private renderTaskStep() {
        return (
            <div class="task-container">
                {/* 任务信息展示区域 */}
                <div class="task-info-section">
                    <div class="info-cards">
                        <div class="info-card">
                            <div class="card-header" onClick={this.toggleJdDetail}>
                                <span class="card-title">职位描述</span>
                                <button class="toggle-btn">查看</button>
                            </div>
                            <div class="card-preview">
                                <p class="preview-text">{this.jobDescription}</p>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="card-header" onClick={this.toggleCriteriaDetail}>
                                <span class="card-title">评分标准</span>
                                <button class="toggle-btn">查看</button>
                            </div>
                            <div class="card-preview">
                                <p class="preview-text">{this.evaluationCriteria}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 简历上传区域 */}
                <div class="upload-section">
                    <div class="section-header">
                        <h4>上传简历</h4>
                    </div>
                    
                    <div class="upload-area" onClick={this.handleUploadClick}>
                        {this.selectedFiles.length > 0 ? (
                            <div class="selected-files">
                                {this.selectedFiles.map((file, index) => (
                                    <div class="file-item" key={index}>
                                        <div class="file-item-content">
                                            <span class="file-icon">📝</span>
                                            <span class="file-name">{file.name}</span>
                                        </div>
                                        <button class="remove-file" onClick={(e) => {
                                            e.stopPropagation();
                                            this.removeFile(index);
                                        }}>×</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div class="upload-placeholder">
                                <img src='https://pub.pincaimao.com/static/web/images/home/i_upload.png'></img>
                                <p class='upload-text'>点击上传简历</p>
                                <p class="upload-hint">支持 txt、markdown、pdf、docx、doc、md 格式，可批量上传</p>
                            </div>
                        )}
                    </div>

                    {this.selectedFiles.length > 0 && (
                        <button
                            class="upload-btn"
                            disabled={this.isUploading}
                            onClick={this.uploadResumes}
                        >
                            {this.isUploading ? '上传中...' : `上传 ${this.selectedFiles.length} 个文件`}
                        </button>
                    )}
                </div>

                {/* 简历列表表格 */}
                <div class="resume-table-section">
                    <div class="section-header">
                        <h4>简历列表</h4>
                    </div>

                    <div class="table-container">
                        <table class="resume-table">
                            <thead>
                                <tr>
                                    <th>简历文件名</th>
                                    <th>人才信息</th>
                                    <th>评估分数</th>
                                    <th>评估详情</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.resumeRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="empty-row">
                                            <div class="empty-state">
                                                <p>暂无简历数据</p>
                                                <p class="empty-hint">请上传简历开始筛选</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    this.resumeRecords.map(record => (
                                        <tr key={record.id}>
                                            <td class="filename-cell">
                                                <span class="file-icon">📝</span>
                                                <span title={record.fileName}>{record.fileName}</span>
                                            </td>
                                            <td class="talent-info-cell">{record.talentInfo}</td>
                                            <td class="score-cell">
                                                <span class={`score-badge ${this.getScoreClass(record.score)}`}>
                                                    {record.score > 0 ? record.score : '--'}
                                                </span>
                                            </td>
                                            <td class="detail-cell" title={record.scoreDetail}>
                                                {record.scoreDetail}
                                            </td>
                                            <td class="action-cell">
                                                <button class="action-btn view-btn" onClick={() => this.viewResume(record)}>
                                                    查看
                                                </button>
                                                <button class="action-btn delete-btn" onClick={() => this.deleteRecord(record.id)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <input
                    type="file"
                    class="file-input"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={this.handleFileChange}
                />
            </div>
        );
    }

    private getScoreClass(score: number): string {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        if (score >= 60) return 'below-average';
        return 'poor';
    }

    private viewResume = (record: ResumeRecord) => {
        // 这里可以实现查看简历的逻辑
        console.log('查看简历:', record);
    };

    private deleteRecord = (id: string) => {
        if (confirm('确定要删除这条记录吗？')) {
            this.resumeRecords = this.resumeRecords.filter(record => record.id !== id);
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
            'pc-layout': this.currentStep === 'input',
            'task-layout': this.currentStep === 'task',
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
                                {this.currentStep === 'input' && (
                                    <span class="step-indicator">创建任务</span>
                                )}
                                {this.currentStep === 'task' && (
                                    <span class="step-indicator">任务管理</span>
                                )}
                            </div>
                            {this.isNeedClose && (
                                <button class="close-button" onClick={this.handleClose}>
                                    <span>×</span>
                                </button>
                            )}
                        </div>
                    )}

                    {this.currentStep === 'input' ? this.renderInputStep() : this.renderTaskStep()}
                </div>

                {/* 职位描述抽屉 */}
                <pcm-drawer
                    isOpen={this.showJdDrawer}
                    drawerTitle="职位描述"
                    width="500px"
                    onClosed={this.closeJdDrawer}
                >
                    <div class="drawer-content">
                        <div class="drawer-text-content">
                            {this.jobDescription}
                        </div>
                    </div>
                </pcm-drawer>

                {/* 评分标准抽屉 */}
                <pcm-drawer
                    isOpen={this.showCriteriaDrawer}
                    drawerTitle="评分标准"
                    width="500px"
                    onClosed={this.closeCriteriaDrawer}
                >
                    <div class="drawer-content">
                        <div class="drawer-text-content">
                            {this.evaluationCriteria}
                        </div>
                    </div>
                </pcm-drawer>
            </div>
        );
    }
} 
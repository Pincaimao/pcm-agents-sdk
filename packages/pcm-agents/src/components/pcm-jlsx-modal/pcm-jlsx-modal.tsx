import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { uploadFileToBackend, FileUploadResponse, verifyApiKey, sendHttpRequest, sendSSERequest, getCosPreviewUrl } from '../../utils/utils';
import { ConversationStartEventData, ErrorEventDetail, InterviewCompleteEventData, StreamCompleteEventData } from '../../components';
import { ErrorEventBus } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';
import { SentryReporter } from '../../utils/sentry-reporter';
import { marked } from 'marked';
import extendedTables from 'marked-extended-tables';

/**
 * 简历筛选
 */

// 定义评分标准接口
interface EvaluationCriteria {
    name: string;
    value: number;
    description: string;
}

// 定义任务接口
interface FilterTask {
    id: number;
    jd_id: number;
    user_id: number;
    extra: string; // JSON字符串格式的评分标准
    create_at: string;
    update_at: string;
}

// 定义简历记录接口
interface ResumeRecord {
    id: string;
    fileName: string;
    talentInfo: string;
    score: number;
    scoreDetail: string;
    uploadTime: Date;
    fileInfo?: FileUploadResponse;
    task_id?: number;
    file_url?: string;
    analysis_result?: string;
    status?: 'pending' | 'analyzing' | 'completed' | 'failed';
    // 添加API返回的原始字段
    user_id?: number;
    jd_id?: number;
    job_info?: string;
    resume_file_url?: string;
    resume_file_name?: string;
    resume_data?: string;
    evaluate?: string;
    evaluate_status?: any;
    resume_raw?: any;
    create_at?: string;
    app_code?: any;
    app_task_id?: any;
    initial_filter_passed?: any;
    ai_interview_cid?: any;
    ai_interview_report_status?: any;
    ai_interview_report?: any;
    ai_interview_report_readed?: any;
    ai_interview_has_notice?: any;
    ai_interview_notice_type?: any;
    ai_interview_has_submit?: number;
    error_info?: any;
}

// 定义简历分页数据接口
interface ResumePageData {
    total: number;
    page: number;
    size: number;
    pages: number;
    records: ResumeRecord[];
}

@Component({
    tag: 'pcm-jlsx-modal',
    styleUrls: ['pcm-jlsx-modal.css', '../../global/global.css', '../../global/markdown.css'],
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

    /**
     * 智能体ID，用于简历筛选
     */
    @Prop() botId: string = '3022316191018874';

    // State 管理
    @State() currentStep: 'input' | 'task' = 'input'; // 当前步骤
    @State() jobDescription: string = '';
    @State() evaluationCriteria: EvaluationCriteria[] = [
        { name: '基础信息', value: 10, description: '评估简历中姓名、联系方式、性别、年龄等基础信息是否完整且准确。完整准确的基础信息有助于招聘方快速识别和联系求职者，是简历的基本要素。若基础信息缺失或有误，可能影响后续沟通与评估流程。' },
        { name: '教育背景', value: 20, description: '主要考察毕业院校、专业、入学及毕业时间、学历层次等内容。毕业院校的知名度与专业的匹配度，一定程度上反映求职者的知识储备基础和专业素养。学历层次及相关课程成绩，能辅助判断求职者在专业领域的学习深度与能力水平。' },
        { name: '职业履历', value: 30, description: '重点评估过往工作经历的连贯性、职位晋升轨迹、工作内容与目标岗位的相关性。丰富且相关的职业履历，展现出求职者在实际工作场景中的实践经验与解决问题能力，连贯的工作经历能体现其稳定性与忠诚度。' },
        { name: '专业技能', value: 20, description: '评估求职者所掌握的专业技能，包括软件操作能力、语言能力、专业资质证书等。这些技能直接反映求职者在特定领域的专业程度，是能否胜任目标岗位的关键因素之一，与目标岗位匹配的专业技能越多、水平越高，竞争力越强。' },
        { name: '项目成果', value: 15, description: '考量求职者参与项目的数量、在项目中承担的角色及取得的成果。通过项目成果可了解其在团队协作、项目管理、创新思维等方面的能力，突出的项目成果能直观展示求职者在实际工作中的价值创造能力。' },
        { name: '求职动机', value: 5, description: '判断求职者对目标岗位的兴趣和热情，以及其职业规划与公司及岗位的契合度。清晰合理的求职动机表明求职者对自身职业发展有明确认知，且对目标岗位做了充分了解，入职后更有可能长期稳定发展并积极投入工作。' }
    ];
    @State() isSubmitting: boolean = false;
    @State() isUploading: boolean = false;
    @State() resumeRecords: ResumeRecord[] = [];
    @State() selectedFiles: File[] = [];
    @State() showJdDrawer: boolean = false;
    @State() showCriteriaDrawer: boolean = false;
    @State() currentTask: FilterTask | null = null;
    @State() currentPage: number = 1;
    @State() pageSize: number = 10;
    @State() totalRecords: number = 0;
    @State() isAnalyzing: boolean = false;
    @State() showPreviewDrawer: boolean = false;
    @State() previewContent: string = '';
    @State() previewTitle: string = '';
    @State() previewType: 'markdown' | 'file' = 'markdown';
    @State() previewUrl: string = '';
    @State() activeDropdownId: string | null = null;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    private tokenInvalidListener: () => void;
    private removeErrorListener: () => void;

    constructor() {
        // 配置 marked 选项
        marked.use(extendedTables);
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        // 添加全局点击事件监听，用于关闭下拉菜单
        document.addEventListener('click', this.handleDocumentClick);
    }

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

        // 移除全局点击事件监听器
        document.removeEventListener('click', this.handleDocumentClick);
    }

    private resetStates = () => {
        this.currentStep = 'input';
        this.jobDescription = '';
        this.evaluationCriteria = [
            { name: '基础信息', value: 10, description: '评估简历中姓名、联系方式、性别、年龄等基础信息是否完整且准确。完整准确的基础信息有助于招聘方快速识别和联系求职者，是简历的基本要素。若基础信息缺失或有误，可能影响后续沟通与评估流程。' },
            { name: '教育背景', value: 20, description: '主要考察毕业院校、专业、入学及毕业时间、学历层次等内容。毕业院校的知名度与专业的匹配度，一定程度上反映求职者的知识储备基础和专业素养。学历层次及相关课程成绩，能辅助判断求职者在专业领域的学习深度与能力水平。' },
            { name: '职业履历', value: 30, description: '重点评估过往工作经历的连贯性、职位晋升轨迹、工作内容与目标岗位的相关性。丰富且相关的职业履历，展现出求职者在实际工作场景中的实践经验与解决问题能力，连贯的工作经历能体现其稳定性与忠诚度。' },
            { name: '专业技能', value: 20, description: '评估求职者所掌握的专业技能，包括软件操作能力、语言能力、专业资质证书等。这些技能直接反映求职者在特定领域的专业程度，是能否胜任目标岗位的关键因素之一，与目标岗位匹配的专业技能越多、水平越高，竞争力越强。' },
            { name: '项目成果', value: 15, description: '考量求职者参与项目的数量、在项目中承担的角色及取得的成果。通过项目成果可了解其在团队协作、项目管理、创新思维等方面的能力，突出的项目成果能直观展示求职者在实际工作中的价值创造能力。' },
            { name: '求职动机', value: 5, description: '判断求职者对目标岗位的兴趣和热情，以及其职业规划与公司及岗位的契合度。清晰合理的求职动机表明求职者对自身职业发展有明确认知，且对目标岗位做了充分了解，入职后更有可能长期稳定发展并积极投入工作。' }
        ];
        this.isSubmitting = false;
        this.isUploading = false;
        this.resumeRecords = [];
        this.selectedFiles = [];
        this.showJdDrawer = false;
        this.showCriteriaDrawer = false;
        this.currentTask = null;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalRecords = 0;
        this.isAnalyzing = false;
        this.showPreviewDrawer = false;
        this.previewContent = '';
        this.previewTitle = '';
        this.previewType = 'markdown';
        this.previewUrl = '';
        this.activeDropdownId = null;
    };

    private handleClose = () => {
        this.modalClosed.emit();
    };

    private handleJobDescriptionChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.jobDescription = textarea.value;
    };

    private handleCreateTask = async () => {
        if (!this.jobDescription.trim()) {
            alert('请输入职位描述');
            return;
        }

        if (this.evaluationCriteria.length === 0) {
            alert('请输入评分标准');
            return;
        }

        this.isSubmitting = true;

        try {
            // 调用创建任务的API
            const response = await sendHttpRequest<FilterTask>({
                url: '/sdk/v1/agent/app_filter_task/create',
                method: 'POST',
                data: {
                    job_info: this.jobDescription,
                    extra: JSON.stringify(this.evaluationCriteria)
                }
            });

            if (response.success && response.data) {
                this.currentTask = response.data;
                // 切换到任务界面
                this.currentStep = 'task';
                // 加载简历列表
                await this.loadResumeList();
            } else {
                throw new Error(response.message || '创建任务失败');
            }
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
            this.selectedFiles = [...this.selectedFiles];
        } else {
            this.selectedFiles = [];
        }
    };

    private handleUploadClick = () => {
        const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
        fileInput?.click();
    };

    private removeFile = (index: number) => {
        this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
        // 强制触发重新渲染
        this.selectedFiles = [...this.selectedFiles];
    };

    private uploadResumes = async () => {
        if (this.selectedFiles.length === 0) {
            alert('请选择简历文件');
            return;
        }

        if (!this.currentTask) {
            alert('请先创建任务');
            return;
        }

        this.isUploading = true;

        try {
            // 为每个文件调用uploadFileToBackend获取cos_key
            const uploadPromises = this.selectedFiles.map(async (file) => {
                const result = await uploadFileToBackend(file, {}, { 'tags': ['resume'] });
                
                // 创建新的简历记录
                const record: ResumeRecord = {
                    id: Date.now() + Math.random().toString(),
                    fileName: file.name,
                    talentInfo: '等待分析...',
                    score: 0,
                    scoreDetail: '等待分析...',
                    uploadTime: new Date(),
                    fileInfo: result,
                    task_id: this.currentTask!.id,
                    file_url: result.cos_key,
                    status: 'pending'
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

            // 触发上传成功事件
            newRecords.forEach(record => {
                this.uploadSuccess.emit(record.fileInfo);
            });

            alert(`成功上传 ${newRecords.length} 个简历文件！`);

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
    };

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

    private showPreview = (title: string, content?: string, type: 'markdown' | 'file' = 'markdown', url?: string) => {
        this.previewTitle = title;
        this.previewContent = content || '';
        this.previewType = type;
        this.previewUrl = url || '';
        this.showPreviewDrawer = true;
        this.activeDropdownId = null; // 关闭下拉菜单
    };

    private closePreviewDrawer = () => {
        this.showPreviewDrawer = false;
        this.previewContent = '';
        this.previewTitle = '';
        this.previewType = 'markdown';
        this.previewUrl = '';
    };

    private toggleDropdown = (recordId: string) => {
        console.log('点击操作按钮，recordId:', recordId, '当前activeDropdownId:', this.activeDropdownId);
        const newActiveId = this.activeDropdownId === recordId ? null : recordId;
        this.activeDropdownId = newActiveId;
        console.log('更新后的activeDropdownId:', this.activeDropdownId);
        
        // 强制触发重新渲染
        this.activeDropdownId = this.activeDropdownId;
    };

    private handleViewEvaluate = (record: ResumeRecord) => {
        this.showPreview(
            `${record.fileName} - 评估详情`,
            record.scoreDetail || '暂无评估详情',
            'markdown'
        );
    };

    private handleViewResume = async (record: ResumeRecord) => {
        if (record.file_url || record.resume_file_url) {
            const fileUrl = record.file_url || record.resume_file_url;
            try {
                const previewUrl = await getCosPreviewUrl(fileUrl);
                if (previewUrl) {
                    this.showPreview(
                        `${record.fileName} - 简历详情`,
                        '',
                        'file',
                        previewUrl
                    );
                } else {
                    alert('无法获取简历预览，请稍后重试');
                }
            } catch (error) {
                console.error('获取简历预览失败:', error);
                SentryReporter.captureError(error, {
                    action: 'handleViewResume',
                    component: 'pcm-jlsx-modal',
                    title: '获取简历预览失败'
                });
                ErrorEventBus.emitError({
                    error: error,
                    message: '获取简历预览失败，请稍后重试'
                });
            }
        } else {
            alert('简历文件不存在');
        }
    };

    private handleDeleteRecord = (recordId: string) => {
        this.activeDropdownId = null; // 关闭下拉菜单
        if (confirm('确定要删除这条记录吗？')) {
            this.resumeRecords = this.resumeRecords.filter(record => record.id !== recordId);
        }
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
                    <div class="criteria-preview">
                        {this.evaluationCriteria.map((criteria, index) => (
                            <div class="criteria-item" key={index}>
                                <span class="criteria-name">{criteria.name}</span>
                                <span class="criteria-weight">{criteria.value}%</span>
                            </div>
                        ))}
                    </div>
                    <p class="criteria-note">默认评分标准，可在任务创建后调整</p>
                </div>

                <button
                    class="submit-button"
                    disabled={!this.jobDescription.trim() || this.evaluationCriteria.length === 0 || this.isSubmitting}
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
                                <p class="preview-text">{this.getEvaluationCriteriaText()}</p>
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
                                <p class="upload-hint">支持 PDF、DOC、DOCX、TXT、MD、RTF 格式，可批量上传</p>
                            </div>
                        )}
                    </div>

                    <div class="upload-actions">
                        {this.selectedFiles.length > 0 && (
                            <button
                                class="upload-btn"
                                disabled={this.isUploading}
                                onClick={this.uploadResumes}
                            >
                                {this.isUploading ? '上传中...' : `上传 ${this.selectedFiles.length} 个文件`}
                            </button>
                        )}
                        
                        {this.resumeRecords.some(record => record.status === 'pending' || record.status === 'failed') && (
                            <button
                                class="analyze-btn"
                                onClick={this.startAnalysis}
                            >
                                {`开始分析 (${this.resumeRecords.filter(record => record.status === 'pending' || record.status === 'failed').length} 个待分析)` }
                            </button>
                        )}
                    </div>
                </div>

                {/* 简历列表表格 */}
                <div class="resume-table-section">
                    <div class="section-header">
                        <h4>简历列表</h4>
                        <span class="record-count">共 {this.totalRecords} 条记录</span>
                    </div>

                    <div class="table-container">
                        <table class="resume-table">
                            <thead>
                                <tr>
                                    <th>简历文件名</th>
                                    <th>人才信息</th>
                                    <th>评估分数</th>
                                    <th>评估详情</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.resumeRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} class="empty-row">
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
                                            <td class="talent-info-cell" title={record.talentInfo}>{record.talentInfo}</td>
                                            <td class="score-cell">
                                                <span class={`score-badge ${this.getScoreClass(record.score)}`}>
                                                    {record.score > 0 ? record.score : '--'}
                                                </span>
                                            </td>
                                            <td class="detail-cell" title={record.scoreDetail}>
                                                <span 
                                                    class="detail-content" 
                                                    onClick={() => this.handleViewEvaluate(record)}
                                                >
                                                    {record.scoreDetail}
                                                </span>
                                            </td>
                                            <td class="status-cell">
                                                <span class={`status-badge status-${record.status || 'pending'}`}>
                                                    {this.getStatusText(record.status || 'pending')}
                                                </span>
                                            </td>
                                            <td class="action-cell">
                                                <div class="action-dropdown">
                                                    <button 
                                                        class="action-btn dropdown-trigger"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            this.toggleDropdown(record.id);
                                                        }}
                                                    >
                                                        操作
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M7 10l5 5 5-5z"/>
                                                        </svg>
                                                    </button>
                                                    {this.activeDropdownId === record.id && (
                                                        <div class="dropdown-menu">
                                                            <div 
                                                                class="dropdown-item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    this.handleViewEvaluate(record);
                                                                }}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2a1 1 0 0 0-2 0v2H8V2a1 1 0 0 0-2 0v2H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM4 18V9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
                                                                </svg>
                                                                评估详情
                                                            </div>
                                                            <div 
                                                                class="dropdown-item"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    this.handleViewResume(record);
                                                                }}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                                                </svg>
                                                                简历详情
                                                            </div>
                                                            <div 
                                                                class="dropdown-item danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    this.handleDeleteRecord(record.id);
                                                                }}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
                                                                </svg>
                                                                删除
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 分页 */}
                    {this.totalRecords > this.pageSize && (
                        <div class="pagination">
                            <button 
                                class="page-btn" 
                                disabled={this.currentPage === 1}
                                onClick={() => this.changePage(this.currentPage - 1)}
                            >
                                上一页
                            </button>
                            <span class="page-info">
                                第 {this.currentPage} 页，共 {Math.ceil(this.totalRecords / this.pageSize)} 页
                            </span>
                            <button 
                                class="page-btn" 
                                disabled={this.currentPage >= Math.ceil(this.totalRecords / this.pageSize)}
                                onClick={() => this.changePage(this.currentPage + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    class="file-input"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md,.rtf"
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

    /**
     * 生成评分标准文本
     */
    private getEvaluationCriteriaText(): string {
        return this.evaluationCriteria
            .map(criteria => `${criteria.name}（${criteria.value}%）：${criteria.description}`)
            .join('\n\n');
    }

    private getStatusText(status: string): string {
        const statusMap = {
            'pending': '待分析',
            'analyzing': '分析中',
            'completed': '已完成',
            'failed': '分析失败'
        };
        return statusMap[status] || '未知';
    }

    private changePage = async (page: number) => {
        this.currentPage = page;
        await this.loadResumeList();
    };


    /**
     * 加载简历列表
     */
    private async loadResumeList() {
        if (!this.currentTask) return;

        try {
            const response = await sendHttpRequest<ResumePageData>({
                url: '/sdk/v1/agent/app_filter_resume/page',
                method: 'GET',
                params: {
                    task_id: this.currentTask.id,
                    page: this.currentPage,
                    size: this.pageSize
                }
            });

            if (response.success && response.data) {
                // 转换API数据格式到组件需要的格式
                const transformedRecords = response.data.records.map(record => {
                    // 解析简历数据以获取人才信息
                    let talentInfo = '等待分析...';
                    if (record.resume_data) {
                        try {
                            const resumeData = JSON.parse(record.resume_data);
                            const result = resumeData.result;
                            if (result) {
                                const name = result.name || '未知';
                                const degree = result.degree || '未知';
                                const college = result.college || '未知';
                                const workYear = result.work_year || '0';
                                const workPosition = result.work_position || '未知职位';
                                talentInfo = `${name} | ${degree} | ${college} | ${workYear}年经验 | ${workPosition}`;
                            }
                        } catch (error) {
                            console.warn('解析简历数据失败:', error);
                        }
                    }

                    // 确定状态
                    let status: 'pending' | 'analyzing' | 'completed' | 'failed' = 'pending';
                    if (record.score > 0 && record.evaluate) {
                        status = 'completed';
                    } else if (record.error_info) {
                        status = 'failed';
                    }

                    return {
                        ...record,
                        id: record.id?.toString() || '',
                        fileName: record.resume_file_name || '未知文件',
                        talentInfo: talentInfo,
                        scoreDetail: record.evaluate || '等待分析...',
                        uploadTime: record.create_at ? new Date(record.create_at) : new Date(),
                        file_url: record.resume_file_url,
                        status: status
                    };
                });

                this.resumeRecords = transformedRecords;
                this.totalRecords = response.data.total || 0;
            }
        } catch (error) {
            console.error('加载简历列表失败:', error);
        }
    }

    /**
     * 开始分析简历
     */
    private startAnalysis = async () => {
        if (!this.currentTask) {
            alert('任务信息不存在');
            return;
        }

        // 获取所有待分析的简历
        const pendingRecords = this.resumeRecords.filter(record => 
            record.status === 'pending' || record.status === 'failed'
        );

        if (pendingRecords.length === 0) {
            alert('没有需要分析的简历');
            return;
        }

        this.isAnalyzing = true;

        try {
            // 将待分析的记录状态设置为分析中
            pendingRecords.forEach(record => {
                record.status = 'analyzing';
            });
            // 触发界面更新
            this.resumeRecords = [...this.resumeRecords];

            // 收集所有待分析的简历文件URL
            const resumeFileUrls = pendingRecords
                .map(record => record.file_url || record.fileInfo?.cos_key)
                .filter(url => url); // 过滤掉空值

            if (resumeFileUrls.length === 0) {
                alert('简历文件URL获取失败');
                return;
            }

            // 1. 先调用清理重复简历接口
            const clearResponse = await sendHttpRequest({
                url: '/sdk/v1/agent/app_filter_resume/clear_repeated_resumes',
                method: 'POST',
                data: {
                    task_id: this.currentTask.id,
                    resume_file_urls: resumeFileUrls
                }
            });

            if (!clearResponse.success) {
                throw new Error(clearResponse.message || '简历校验失败');
            }

            // 2. 构建评分规则字符串
            const ruleString = this.evaluationCriteria
                .map(criteria => `- ${criteria.name}(占比${criteria.value}%)：${criteria.description}`)
                .join(' \n');

            // 3. 调用简历筛选接口
            await sendSSERequest({
                url: '/sdk/v1/chat/chat-messages',
                method: 'POST',
                data: {
                    bot_id: this.botId,
                    response_mode: 'blocking',
                    query: '简历筛选',
                    inputs: {
                        job_info: this.jobDescription,
                        jd_id: this.currentTask.id,
                        task_id: this.currentTask.id,
                        file_urls: resumeFileUrls.join(','),
                        rule: ruleString
                    }
                },
                onMessage: (data) => {
                    // 处理流式响应数据
                    console.log('分析进度:', data);
                },
                onComplete: async () => {
                    // 分析完成，重新加载简历列表
                    await this.loadResumeList();
                    this.streamComplete.emit({
                        conversation_id: this.conversationId || '',
                        event: 'analysis_complete',
                        message_id: '',
                        id: ''
                    });
                },
                onError: (error) => {
                    console.error('简历分析失败:', error);
                    // 将分析失败的记录状态设置为failed
                    pendingRecords.forEach(record => {
                        record.status = 'failed';
                    });
                    this.resumeRecords = [...this.resumeRecords];
                    
                    ErrorEventBus.emitError({
                        error: error,
                        message: '简历分析失败，请重试'
                    });
                }
            });

        } catch (error) {
            console.error('开始分析失败:', error);
            // 将分析失败的记录状态设置为failed
            pendingRecords.forEach(record => {
                record.status = 'failed';
            });
            this.resumeRecords = [...this.resumeRecords];
            
            SentryReporter.captureError(error, {
                action: 'startAnalysis',
                component: 'pcm-jlsx-modal',
                title: '开始分析失败'
            });
            ErrorEventBus.emitError({
                error: error,
                message: '开始分析失败，请重试'
            });
        } finally {
            this.isAnalyzing = false;
        }
    };

    private handleDocumentClick = (event: Event) => {
        // 处理点击外部关闭下拉菜单的逻辑
        const target = event.target as HTMLElement;
        const dropdown = target.closest('.action-dropdown');
        
        // 如果点击的不是下拉菜单区域，则关闭所有下拉菜单
        if (!dropdown && this.activeDropdownId) {
            this.activeDropdownId = null;
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
                            {this.getEvaluationCriteriaText()}
                        </div>
                    </div>
                </pcm-drawer>

                {/* 预览抽屉 */}
                <pcm-drawer
                    isOpen={this.showPreviewDrawer}
                    drawerTitle={this.previewTitle}
                    width="600px"
                    onClosed={this.closePreviewDrawer}
                >
                    <div class="drawer-content">
                        {this.previewType === 'markdown' ? (
                            <div 
                                class="markdown-content markdown-body"
                                innerHTML={marked(this.previewContent)}
                            ></div>
                        ) : (
                            <div class="file-preview">
                                <iframe
                                    src={this.previewUrl}
                                    frameborder="0"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none', height: 'calc(100vh - 120px)' }}
                                ></iframe>
                            </div>
                        )}
                    </div>
                </pcm-drawer>
            </div>
        );
    }
} 
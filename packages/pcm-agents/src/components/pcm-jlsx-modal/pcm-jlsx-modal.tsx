import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { FileUploadResponse, verifyApiKey, sendHttpRequest, sendSSERequest, getCosPreviewUrl, PCM_DOMAIN } from '../../utils/utils';
import { ErrorEventDetail } from '../../components';
import {
    TaskCreatedEventData,
    ResumeAnalysisStartEventData,
    ResumeAnalysisCompleteEventData,
    TaskSwitchEventData,
    ResumeDeletedEventData,
} from '../../interfaces/events';
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
    // 添加API返回的原始字段
    user_id?: number;
    jd_id?: number;
    job_info?: string;
    resume_file_url?: string;
    resume_file_name?: string;
    resume_data?: string;
    evaluate?: string;
    evaluate_status?: 0 | 1 | -1; // 筛选状态：0-筛选中，1-筛选完成，-1-筛选失败
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

// 定义历史任务接口
interface HistoryTask {
    id: number;
    create_at: string;
    update_at: string;
    jd_id: number;
    user_id: number;
    chat_user_id: string;
    extra: string;
    title?: string | null;
    job_info?: string; // 可能需要从其他API获取
    resume_count?: number; // 简历数量
    timeDisplay?: string; // 格式化的时间显示
}

// 定义历史任务分页数据接口
interface HistoryTaskPageData {
    total: number;
    page: number;
    size: number;
    pages: number;
    records: HistoryTask[];
}

@Component({
    tag: 'pcm-jlsx-modal',
    styleUrls: ['../../global/global.css', 'pcm-jlsx-modal.css', '../../global/markdown.css'],
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
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 自定义输入参数，传入customInputs.job_info时，会填充JD输入区域<br>
     * 
     */
    @Prop() customInputs: Record<string, string> = {};

    /**
     * 是否开启移动端上传简历（仅PC端生效）
     */
    @Prop() mobileUploadAble: boolean = false;

    /**
     * 是否显示“批量导出报告”功能
     */
    @Prop() showBatchExport: boolean = false;

    /**
     * 上传成功事件
     */
    @Event() uploadSuccess: EventEmitter<FileUploadResponse>;

    /**
     * SDK密钥验证失败事件
     */
    @Event() tokenInvalid: EventEmitter<void>;

    /**
    * 错误事件
    */
    @Event() someErrorEvent: EventEmitter<ErrorEventDetail>;

    /**
     * 任务创建完成事件
     */
    @Event() taskCreated: EventEmitter<TaskCreatedEventData>;

    /**
     * 简历分析开始事件
     */
    @Event() resumeAnalysisStart: EventEmitter<ResumeAnalysisStartEventData>;

    /**
     * 简历分析完成事件
     */
    @Event() resumeAnalysisComplete: EventEmitter<ResumeAnalysisCompleteEventData>;

    /**
     * 任务切换事件
     */
    @Event() taskSwitch: EventEmitter<TaskSwitchEventData>;

    /**
     * 简历删除事件
     */
    @Event() resumeDeleted: EventEmitter<ResumeDeletedEventData>;


    // State 管理
    @State() currentStep: 'input' | 'task' = 'input'; // 当前步骤
    @State() jobDescription: string = '';
    @State() jobTitle: string = '';
    @State() evaluationCriteria: EvaluationCriteria[] = [
        { name: '基础信息', value: 10, description: '评估简历中姓名、联系方式、性别、年龄等基础信息是否完整且准确。完整准确的基础信息有助于招聘方快速识别和联系求职者，是简历的基本要素。若基础信息缺失或有误，可能影响后续沟通与评估流程。' },
        { name: '教育背景', value: 20, description: '主要考察毕业院校、专业、入学及毕业时间、学历层次等内容。毕业院校的知名度与专业的匹配度，一定程度上反映求职者在知识储备基础和专业素养。学历层次及相关课程成绩，能辅助判断求职者在专业领域的学习深度与能力水平。' },
        { name: '职业履历', value: 30, description: '重点评估过往工作经历的连贯性、职位晋升轨迹、工作内容与目标岗位的相关性。丰富且相关的职业履历，展现出求职者在实际工作场景中的实践经验与解决问题能力，连贯的工作经历能体现其稳定性与忠诚度。' },
        { name: '专业技能', value: 20, description: '评估求职者所掌握的专业技能，包括软件操作能力、语言能力、专业资质证书等。这些技能直接反映求职者在特定领域的专业程度，是能否胜任目标岗位的关键因素之一，与目标岗位匹配的专业技能越多、水平越高，竞争力越强。' },
        { name: '项目成果', value: 15, description: '考量求职者参与项目的数量、在项目中承担的角色及取得的成果。通过项目成果可了解其在团队协作、项目管理、创新思维等方面的能力，突出的项目成果能直观展示求职者在实际工作中的价值创造能力。' },
        { name: '求职动机', value: 5, description: '判断求职者对目标岗位的兴趣和热情，以及其职业规划与公司及岗位的契合度。清晰合理的求职动机表明求职者对自身职业发展有明确认知，且对目标岗位做了充分了解，入职后更有可能长期稳定发展并积极投入工作。' }
    ];
    @State() isSubmitting: boolean = false;
    @State() isUploading: boolean = false;

    // 分别存储上传后未筛选的简历和已筛选的简历
    @State() uploadedResumeRecords: ResumeRecord[] = []; // 上传后未筛选的简历
    @State() filteredResumeRecords: ResumeRecord[] = []; // 已经筛选的简历（从API加载）

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
    @State() deletingRecordId: string | null = null; // 正在删除的记录ID
    @State() sortOrder: 'none' | 'asc' | 'desc' = 'none'; // 评估分数排序状态

    // 添加任务管理相关状态
    @State() isTaskHistoryDrawerOpen: boolean = false;
    @State() historyTasks: HistoryTask[] = [];
    @State() isLoadingHistoryTasks: boolean = false;
    @State() taskHistoryCurrentPage: number = 1;
    @State() taskHistoryPageSize: number = 10;
    @State() taskHistoryTotal: number = 0;

    // 添加简历列表加载状态
    @State() isLoadingResumeList: boolean = false;

    // 添加导出记录模态框状态
    @State() isExportRecordsModalOpen: boolean = false;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    private tokenInvalidListener: () => void;
    private removeErrorListener: () => void;
    private botId = '3022316191018874';

    // 添加pcm-upload组件的引用
    private pcmUploadRef;

    // 计算属性：获取所有简历记录（用于显示）
    private get resumeRecords(): ResumeRecord[] {
        return [...this.uploadedResumeRecords, ...this.filteredResumeRecords];
    }

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
            { name: '教育背景', value: 20, description: '主要考察毕业院校、专业、入学及毕业时间、学历层次等内容。毕业院校的知名度与专业的匹配度，一定程度上反映求职者在知识储备基础和专业素养。学历层次及相关课程成绩，能辅助判断求职者在专业领域的学习深度与能力水平。' },
            { name: '职业履历', value: 30, description: '重点评估过往工作经历的连贯性、职位晋升轨迹、工作内容与目标岗位的相关性。丰富且相关的职业履历，展现出求职者在实际工作场景中的实践经验与解决问题能力，连贯的工作经历能体现其稳定性与忠诚度。' },
            { name: '专业技能', value: 20, description: '评估求职者所掌握的专业技能，包括软件操作能力、语言能力、专业资质证书等。这些技能直接反映求职者在特定领域的专业程度，是能否胜任目标岗位的关键因素之一，与目标岗位匹配的专业技能越多、水平越高，竞争力越强。' },
            { name: '项目成果', value: 15, description: '考量求职者参与项目的数量、在项目中承担的角色及取得的成果。通过项目成果可了解其在团队协作、项目管理、创新思维等方面的能力，突出的项目成果能直观展示求职者在实际工作中的价值创造能力。' },
            { name: '求职动机', value: 5, description: '判断求职者对目标岗位的兴趣和热情，以及其职业规划与公司及岗位的契合度。清晰合理的求职动机表明求职者对自身职业发展有明确认知，且对目标岗位做了充分了解，入职后更有可能长期稳定发展并积极投入工作。' }
        ];
        this.isSubmitting = false;
        this.isUploading = false;
        this.uploadedResumeRecords = [];
        this.filteredResumeRecords = [];
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
        this.deletingRecordId = null;
        this.sortOrder = 'none';
        this.isTaskHistoryDrawerOpen = false;
        this.historyTasks = [];
        this.isLoadingHistoryTasks = false;
        this.taskHistoryCurrentPage = 1;
        this.taskHistoryPageSize = 10;
        this.taskHistoryTotal = 0;
        this.isLoadingResumeList = false;
        this.isExportRecordsModalOpen = false;
    };

    private handleClose = () => {
        this.modalClosed.emit();
    };

    private handleJobDescriptionChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.jobDescription = textarea.value;
    };

    /**
     * 显示消息提示
     * @param content 消息内容
     * @param type 消息类型
     * @param duration 显示时长，0表示不自动关闭
     */
    private showMessage = (content: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000) => {
        const messageEl = document.createElement('pcm-message');
        messageEl.content = content;
        messageEl.type = type;
        messageEl.duration = duration;

        // 添加到页面顶部
        document.body.appendChild(messageEl);

        // 调用显示方法
        messageEl.show();
    };

    private handleCreateTask = async () => {
        if (!this.jobDescription.trim()) {
            this.showMessage('请输入职位描述', 'warning');
            return;
        }

        if (this.evaluationCriteria.length === 0) {
            this.showMessage('请输入评分标准', 'warning');
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

                // 触发任务创建完成事件
                this.taskCreated.emit({
                    task_id: response.data.id,
                    job_description: this.jobDescription,
                    evaluation_criteria: this.evaluationCriteria,
                    create_time: new Date().toISOString()
                });
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
        const newActiveId = this.activeDropdownId === recordId ? null : recordId;
        this.activeDropdownId = newActiveId;
    };

    private handleViewEvaluate = (record: ResumeRecord) => {
        // this.showPreview(
        //     `${record.fileName} - 评估详情`,
        //     record.scoreDetail || '暂无评估详情',
        //     'markdown'
        // );
        const url = `${PCM_DOMAIN}/exportFile?id=${record.id}&title=${this.jobTitle || ''}&token=${authStore.getToken()}&isSdk=1`;
        this.showPreview(
            `${record.fileName} - 评估详情`,
            '',
            'file',
            url,
        )
    };

    @State() exportAllPdfLoading = false;
    private exportAllPDF = async () => {
        this.exportAllPdfLoading = true;
        const response = await sendHttpRequest({
            url: `/sdk/v1/agent/app_filter_task/export_all`,
            method: "GET",
            params: {
                task_id: this.currentTask?.id,
            }
        });
        this.exportAllPdfLoading = false;
        if (response.success) {
            this.showMessage('导出任务已创建！', 'success');
            this.handleExportRecordsClick();
        }
    }

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
                    this.showMessage('无法获取简历预览，请稍后重试', 'error');
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
            this.showMessage('简历文件不存在', 'error');
        }
    };

    private handleDeleteRecord = async (recordId: string) => {
        this.activeDropdownId = null; // 关闭下拉菜单

        // 检查记录是否在filteredResumeRecords中（来自API）
        const filteredRecord = this.filteredResumeRecords.find(record => record.id === recordId);

        if (filteredRecord) {
            // 如果是API加载的记录，调用删除接口
            this.deletingRecordId = recordId;

            try {
                const response = await sendHttpRequest({
                    url: `/sdk/v1/agent/app_filter_resume/delete/${recordId}`,
                    method: 'DELETE'
                });

                if (response.success) {
                    // 删除成功，从列表中移除
                    this.filteredResumeRecords = this.filteredResumeRecords.filter(record => record.id !== recordId);
                    this.showMessage('删除成功', 'success');

                    // 触发简历删除事件
                    this.resumeDeleted.emit({
                        task_id: this.currentTask!.id,
                        resume_id: recordId,
                        resume_name: filteredRecord.fileName,
                        delete_time: new Date().toISOString()
                    });

                    // 重新加载列表以更新总数
                    await this.loadResumeList();
                } else {
                    throw new Error(response.message || '删除失败');
                }
            } catch (error) {
                console.error('删除记录失败:', error);
                SentryReporter.captureError(error, {
                    action: 'handleDeleteRecord',
                    component: 'pcm-jlsx-modal',
                    title: '删除记录失败',
                    recordId: recordId
                });
                this.showMessage('删除失败，请重试', 'error');
            } finally {
                this.deletingRecordId = null;
            }
        } else {
            // 如果是本地上传的记录，直接从列表中移除
            this.uploadedResumeRecords = this.uploadedResumeRecords.filter(record => record.id !== recordId);
            this.showMessage('删除成功', 'success');
        }
    };

    private handleEvaluationCriteriaNameChange = (index: number, value: string) => {
        const newCriteria = [...this.evaluationCriteria];
        newCriteria[index].name = value;
        this.evaluationCriteria = newCriteria;
    };

    private handleEvaluationCriteriaValueChange = (index: number, value: string) => {
        const newCriteria = [...this.evaluationCriteria];
        const numValue = parseInt(value) || 0;
        newCriteria[index].value = Math.max(0, Math.min(100, numValue)); // 限制在0-100之间
        this.evaluationCriteria = newCriteria;
    };

    private handleEvaluationCriteriaDescriptionChange = (index: number, value: string) => {
        const newCriteria = [...this.evaluationCriteria];
        newCriteria[index].description = value;
        this.evaluationCriteria = newCriteria;
    };

    private addEvaluationCriteria = () => {
        const newCriteria = [...this.evaluationCriteria];
        newCriteria.push({
            name: '',
            value: 0,
            description: ''
        });
        this.evaluationCriteria = newCriteria;
    };

    private removeEvaluationCriteria = (index: number) => {
        if (this.evaluationCriteria.length <= 1) {
            this.showMessage('至少需要保留一个评分标准', 'warning');
            return;
        }
        const newCriteria = this.evaluationCriteria.filter((_, i) => i !== index);
        this.evaluationCriteria = newCriteria;
    };

    private getTotalWeight = (): number => {
        return this.evaluationCriteria.reduce((sum, criteria) => sum + criteria.value, 0);
    };

    private renderInputStep() {
        return (
            <div class="input-container">
                <div class="step-header">
                    <h3>创建简历筛选任务</h3>
                    <p class="step-description">请输入职位描述和评分标准</p>
                </div>

                <div class="jd-input-section">
                    <label htmlFor="job-description">职位描述 (JD)</label>
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
                    <div class="criteria-header">
                        <label htmlFor="evaluation-criteria">评分标准</label>
                        <div class="criteria-actions">
                            <span class={`total-weight ${this.getTotalWeight() !== 100 ? 'invalid' : ''}`}>
                                总权重: {this.getTotalWeight()}%
                            </span>
                            <button
                                type="button"
                                class="add-criteria-btn"
                                onClick={this.addEvaluationCriteria}
                            >
                                + 添加标准
                            </button>
                        </div>
                    </div>

                    <div class="criteria-table-container">
                        <table class="criteria-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '25%' }}>标准名称</th>
                                    <th style={{ width: '15%' }}>权重(%)</th>
                                    <th style={{ width: '50%' }}>描述</th>
                                    <th style={{ width: '10%' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.evaluationCriteria.map((criteria, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                type="text"
                                                class="criteria-name-input"
                                                placeholder="请输入标准名称"
                                                value={criteria.name}
                                                onInput={(e) => this.handleEvaluationCriteriaNameChange(index, (e.target as HTMLInputElement).value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                class="criteria-value-input"
                                                placeholder="0"
                                                min="0"
                                                max="100"
                                                value={criteria.value}
                                                onInput={(e) => this.handleEvaluationCriteriaValueChange(index, (e.target as HTMLInputElement).value)}
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                class="criteria-description-input"
                                                placeholder="请输入评分标准描述"
                                                rows={2}
                                                value={criteria.description}
                                                onInput={(e) => this.handleEvaluationCriteriaDescriptionChange(index, (e.target as HTMLTextAreaElement).value)}
                                            ></textarea>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                class="remove-criteria-btn"
                                                disabled={this.evaluationCriteria.length <= 1}
                                                onClick={() => this.removeEvaluationCriteria(index)}
                                                title={this.evaluationCriteria.length <= 1 ? '至少需要保留一个评分标准' : '删除此标准'}
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {this.getTotalWeight() !== 100 && (
                        <p class="criteria-warning">
                            ⚠️ 权重总和应为100%，当前为{this.getTotalWeight()}%
                        </p>
                    )}
                </div>

                <button
                    class="submit-button"
                    disabled={!this.jobDescription.trim() || this.evaluationCriteria.length === 0 || this.getTotalWeight() !== 100 || this.isSubmitting}
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

                    <pcm-upload
                        ref={(el) => this.pcmUploadRef = el}
                        multiple={true}
                        maxFileSize={15 * 1024 * 1024}
                        acceptFileSuffixList={['.pdf', '.doc', '.docx', '.txt', '.md', '.ppt', '.pptx', '.jpg', '.jpeg', '.png']}
                        mobileUploadAble={this.mobileUploadAble}
                        uploadParams={{ tags: ['resume'] }}
                        onUploadChange={this.handleUploadChange}
                    />

                    <div class="upload-actions">
                        {this.uploadedResumeRecords.some(record => record.evaluate_status !== 1 && record.evaluate_status !== 0) && (
                            <button
                                class="analyze-btn"
                                onClick={this.handleStartAnalysis}
                            >
                                {`开始分析 (${this.uploadedResumeRecords.filter(record => record.evaluate_status !== 1 && record.evaluate_status !== 0).length} 个待分析)`}
                            </button>
                        )}
                    </div>
                </div>

                {/* 简历列表表格 */}
                <div class="resume-table-section">
                    <div class="section-header">
                        <h4>简历列表</h4>
                        <div class="section-header-side">
                            {
                                this.showBatchExport && !!this.resumeRecords?.find(item => item.evaluate_status == 1) && <div class="export-actions">
                                    <div
                                        class="export-btn"
                                        onClick={this.exportAllPDF}
                                    >
                                        <span>批量导出报告</span>
                                    </div>
                                    <div class="export-divide"></div>
                                    <div
                                        class="export-btn"
                                        onClick={this.handleExportRecordsClick}
                                    >导出记录</div>
                                </div>
                            }
                            
                            <span class="record-count">已筛选{this.totalRecords} 条记录</span>
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="resume-table">
                            <thead>
                                <tr>
                                    <th>简历文件名</th>
                                    <th>人才信息</th>
                                    <th
                                        class={`sortable-header ${this.sortOrder !== 'none' ? 'active' : ''}`}
                                        onClick={this.handleSortByScore}
                                    >
                                        <span class="header-content">
                                            评估分数
                                            <span class="sort-icons">
                                                <svg
                                                    class={`sort-icon ${this.sortOrder === 'asc' ? 'active' : ''}`}
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                >
                                                    <path d="M6 3l4 4H2z" fill="currentColor" />
                                                </svg>
                                                <svg
                                                    class={`sort-icon ${this.sortOrder === 'desc' ? 'active' : ''}`}
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                >
                                                    <path d="M6 9L2 5h8z" fill="currentColor" />
                                                </svg>
                                            </span>
                                        </span>
                                    </th>
                                    <th>评估详情</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.isLoadingResumeList ? (
                                    <tr>
                                        <td colSpan={6} class="empty-row">
                                            <div class="empty-state">
                                                <div class="loading-spinner-small"></div>
                                                <p>正在加载简历数据...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : this.resumeRecords.length === 0 ? (
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
                                                    {typeof record.score === 'number' ? record.score : '--'}
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
                                                <span class={`status-badge status-${this.getEvaluateStatusClass(record.evaluate_status)}`}>
                                                    {this.getEvaluateStatusText(record.evaluate_status)}
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
                                                            <path d="M7 10l5 5 5-5z" />
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
                                                                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2a1 1 0 0 0-2 0v2H8V2a1 1 0 0 0-2 0v2H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM4 18V9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
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
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                                                </svg>
                                                                简历详情
                                                            </div>
                                                            <div
                                                                class={`dropdown-item danger ${this.deletingRecordId === record.id ? 'disabled' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (this.deletingRecordId !== record.id) {
                                                                        this.handleDeleteRecord(record.id);
                                                                    }
                                                                }}
                                                            >
                                                                {this.deletingRecordId === record.id ? (
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="loading-spinner">
                                                                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" opacity="0.25" />
                                                                        <path d="M12 2C17.523 2 22 6.477 22 12h-2a8 8 0 0 0-8-8V2z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                                                                    </svg>
                                                                )}
                                                                {this.deletingRecordId === record.id ? '删除中...' : '删除'}
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
                    <div style={{ height: '100px', width: '100%' }}>

                    </div>
                </div>
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

    private getEvaluateStatusText(evaluate_status?: 0 | 1 | -1): string {
        const statusMap = {
            0: '筛选中',
            1: '筛选完成',
            [-1]: '筛选失败'
        };
        return statusMap[evaluate_status] || '待分析';
    }

    private getEvaluateStatusClass(evaluate_status?: 0 | 1 | -1): string {
        const classMap = {
            0: 'analyzing',     // 筛选中
            1: 'completed',     // 筛选完成
            [-1]: 'failed'      // 筛选失败
        };
        return classMap[evaluate_status] || 'pending'; // 默认为待分析
    }

    private changePage = async (page: number) => {
        this.currentPage = page;
        await this.loadResumeList();
    };

    private handleSortByScore = () => {
        // 切换排序状态：none -> desc -> asc -> none
        if (this.sortOrder === 'none') {
            this.sortOrder = 'desc';
        } else if (this.sortOrder === 'desc') {
            this.sortOrder = 'asc';
        } else {
            this.sortOrder = 'none';
        }

        // 重置到第一页并重新加载数据
        this.currentPage = 1;
        this.loadResumeList();
    };

    /**
     * 加载简历列表
     */
    private async loadResumeList() {
        if (!this.currentTask) return;

        this.isLoadingResumeList = true;

        try {
            const params: any = {
                task_id: this.currentTask.id,
                page: this.currentPage,
                size: this.pageSize
            };

            // 添加排序参数
            if (this.sortOrder === 'desc') {
                params.order_by = 'score_desc';
            } else if (this.sortOrder === 'asc') {
                params.order_by = 'score_asc';
            }

            const response = await sendHttpRequest<ResumePageData>({
                url: '/sdk/v1/agent/app_filter_resume/page',
                method: 'GET',
                data: params
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
                                const tel = result.phone || result.email || '未知';
                                const degree = result.degree || '未知';
                                const college = result.college || '未知';
                                const workYear = result.work_year || '0';
                                const workPosition = result.work_position || '未知职位';
                                talentInfo = `${tel} | ${degree} | ${college} | ${workYear}年经验 | ${workPosition}`;
                            }
                        } catch (error) {
                            console.warn('解析简历数据失败:', error);
                        }
                    }

                    return {
                        ...record,
                        id: record.id?.toString() || '',
                        fileName: record.resume_file_name || '未知文件',
                        talentInfo: talentInfo,
                        scoreDetail: record.evaluate || '等待分析...',
                        uploadTime: record.create_at ? new Date(record.create_at) : new Date(),
                        file_url: record.resume_file_url
                    };
                });

                this.filteredResumeRecords = transformedRecords;
                this.totalRecords = response.data.total || 0;

            }
        } catch (error) {
            console.error('加载简历列表失败:', error);
        } finally {
            this.isLoadingResumeList = false;
        }
    }

    /**
     * 开始分析简历
     */
    private startAnalysis = async () => {
        if (!this.currentTask) {
            this.showMessage('任务信息不存在', 'error');
            return;
        }

        // 获取所有待分析的简历（从上传的简历中获取）
        const pendingRecords = this.uploadedResumeRecords.filter(record =>
            record.evaluate_status !== 1 && record.evaluate_status !== 0  // 筛选状态不是"筛选完成"和"筛选中"的记录
        );

        if (pendingRecords.length === 0) {
            this.showMessage('没有需要分析的简历', 'warning');
            return;
        }

        this.isAnalyzing = true;

        try {
            // 将待分析的记录状态设置为分析中
            pendingRecords.forEach(record => {
                record.evaluate_status = 0; // 设置为筛选中
            });
            // 触发界面更新
            this.uploadedResumeRecords = [...this.uploadedResumeRecords];

            // 收集所有待分析的简历文件URL
            const resumeFileUrls = pendingRecords
                .map(record => record.file_url || record.fileInfo?.cos_key)
                .filter(url => url); // 过滤掉空值

            if (resumeFileUrls.length === 0) {
                this.showMessage('简历文件URL获取失败', 'error');
                return;
            }

            // 1. 先调用清理重复简历接口
            const clearResponse = await sendHttpRequest<string[]>({
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

            // 检查返回的数据
            const filteredFileUrls = clearResponse.data || [];
            console.log('过滤后的简历文件URLs:', filteredFileUrls);

            // 根据API返回的结果标记被过滤的简历
            if (filteredFileUrls.length === 0) {
                // 如果返回空数组，说明所有简历都是重复的
                this.showMessage('已清除重复上传的简历，没有新的简历需要分析', 'info');
                // 将所有待分析的简历从上传列表中移除（因为它们是重复的）
                this.uploadedResumeRecords = []
                return;
            } else {
                // 如果部分重复，直接用过滤后的文件URLs重新构建上传记录列表
                // 同时保留那些正在筛选中的简历
                this.uploadedResumeRecords = this.uploadedResumeRecords.filter(record => {
                    const fileUrl = record.file_url || record.fileInfo?.cos_key;
                    // 保留过滤后的有效文件URLs 或者 正在筛选中的简历
                    return filteredFileUrls.includes(fileUrl) || record.evaluate_status === 0;
                });
            }

            // 2. 构建评分规则字符串
            const ruleString = this.evaluationCriteria
                .map(criteria => `- ${criteria.name}(占比${criteria.value}%)：${criteria.description}`)
                .join(' \n');

            // 触发简历分析开始事件
            this.resumeAnalysisStart.emit({
                task_id: this.currentTask.id,
                resume_count: filteredFileUrls.length,
                resume_files: pendingRecords.map(record => ({
                    file_name: record.fileName,
                    file_url: record.file_url || record.fileInfo?.cos_key || ''
                })).filter(file => filteredFileUrls.includes(file.file_url))
            });

            // 清除pcm-upload组件中的文件显示
            if (this.pcmUploadRef?.clearSelectedFiles) {
                this.pcmUploadRef.clearSelectedFiles();
            }

            // 3. 调用简历筛选接口，使用过滤后的文件URL列表
            await sendSSERequest({
                url: '/sdk/v1/chat/chat-messages',
                method: 'POST',
                data: {
                    bot_id: "3022316191018874",
                    response_mode: 'blocking',
                    query: '简历筛选',
                    inputs: {
                        job_info: this.jobDescription,
                        jd_id: this.currentTask.jd_id,
                        task_id: this.currentTask.id,
                        file_urls: filteredFileUrls.join(','), // 使用过滤后的文件URL
                        rule: ruleString
                    }
                },
                onMessage: (data) => {
                    // 处理流式响应数据
                    console.log('分析进度:', data);
                },
                onComplete: async () => {
                    // 分析完成，将已完成的简历从上传列表移到已筛选列表
                    this.uploadedResumeRecords = this.uploadedResumeRecords.filter(record => record.evaluate_status !== 0);

                    // 重新加载简历列表（从API获取筛选后的结果）
                    await this.loadResumeList();

                    // 触发简历分析完成事件
                    this.emitAnalysisCompleteEvent();
                },
                onError: (error) => {
                    console.error('简历分析失败:', error);
                    // 将分析失败的记录状态设置为failed
                    pendingRecords.forEach(record => {
                        record.evaluate_status = -1; // 设置为筛选失败
                    });
                    this.uploadedResumeRecords = [...this.uploadedResumeRecords];

                    SentryReporter.captureError(error, {
                        action: 'startAnalysis',
                        component: 'pcm-jlsx-modal',
                        title: '开始分析失败'
                    });
                    ErrorEventBus.emitError({
                        error: error,
                        message: '开始分析失败，请重试'
                    });
                }
            });

        } catch (error) {
            console.error('开始分析失败:', error);
            // 将分析失败的记录状态设置为failed
            pendingRecords.forEach(record => {
                record.evaluate_status = -1; // 设置为筛选失败
            });
            this.uploadedResumeRecords = [...this.uploadedResumeRecords];

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

    // 处理任务管理按钮点击
    private handleTaskHistoryClick = () => {
        console.log('点击任务管理按钮');
        this.isTaskHistoryDrawerOpen = true;
        this.loadHistoryTasks();
    };

    // 加载历史任务列表
    private async loadHistoryTasks() {
        this.isLoadingHistoryTasks = true;

        try {
            const result = await sendHttpRequest<HistoryTaskPageData>({
                url: '/sdk/v1/agent/app_filter_task/page',
                method: 'GET',
                data: {
                    page: this.taskHistoryCurrentPage,
                    size: this.taskHistoryPageSize
                }
            });

            if (result.success && result.data) {
                // 格式化任务数据
                this.historyTasks = result.data.records.map((task: any) => {
                    // 处理时间戳，API返回的是字符串格式时间
                    let createdTime: Date;
                    let timeDisplay = '未知时间';

                    try {
                        // 直接解析字符串时间格式 "2025-06-26 15:57:57"
                        createdTime = new Date(task.create_at);

                        // 验证日期是否有效
                        if (isNaN(createdTime.getTime())) {
                            console.warn('无效的日期对象:', task.create_at);
                            createdTime = new Date();
                        }

                        const now = new Date();
                        const diffTime = now.getTime() - createdTime.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        // 格式化时间显示
                        if (diffDays === 0) {
                            // 今天
                            timeDisplay = `今天 ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
                        } else if (diffDays === 1) {
                            // 昨天
                            timeDisplay = `昨天 ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
                        } else if (diffDays > 0 && diffDays < 7) {
                            // 一周内
                            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                            timeDisplay = `${weekdays[createdTime.getDay()]} ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
                        } else if (diffDays < 0) {
                            // 未来时间（可能是时区问题或系统时间不准确）
                            timeDisplay = `${(createdTime.getMonth() + 1).toString().padStart(2, '0')}-${createdTime.getDate().toString().padStart(2, '0')} ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
                        } else {
                            // 超过一周
                            timeDisplay = `${(createdTime.getMonth() + 1).toString().padStart(2, '0')}-${createdTime.getDate().toString().padStart(2, '0')} ${createdTime.getHours().toString().padStart(2, '0')}:${createdTime.getMinutes().toString().padStart(2, '0')}`;
                        }
                    } catch (error) {
                        console.error('时间格式化错误:', error, task.create_at);
                        timeDisplay = '时间解析失败';
                    }

                    return {
                        ...task,
                        timeDisplay
                    } as HistoryTask;
                });

                this.taskHistoryTotal = result.data.total || 0;
            }
        } catch (error) {
            console.error('获取历史任务失败:', error);
            SentryReporter.captureError(error, {
                action: 'loadHistoryTasks',
                component: 'pcm-jlsx-modal',
                title: '获取历史任务失败'
            });
            ErrorEventBus.emitError({
                error: error,
                message: '获取历史任务失败'
            });
        } finally {
            this.isLoadingHistoryTasks = false;
        }
    }

    // 切换到指定任务
    private handleSwitchTask = async (task: HistoryTask) => {
        if (task.id === this.currentTask?.id) {
            // 如果点击的是当前任务，直接关闭抽屉
            this.isTaskHistoryDrawerOpen = false;
            return;
        }

        try {
            // 调用 app_filter_task/query 接口获取完整任务信息
            const taskDetailResponse = await sendHttpRequest<any>({
                url: `/sdk/v1/agent/app_filter_task/query/${task.id}`,
                method: 'GET'
            });

            if (!taskDetailResponse.success || !taskDetailResponse.data) {
                throw new Error(taskDetailResponse.message || '获取任务详情失败');
            }

            const taskDetail = taskDetailResponse.data;

            // 解析评分标准
            let evaluationCriteria: EvaluationCriteria[] = [];
            if (taskDetail.extra) {
                try {
                    evaluationCriteria = JSON.parse(taskDetail.extra);
                } catch (e) {
                    console.warn('解析评分标准失败:', e);
                }
            }

            // 构建任务对象，使用FilterTask接口格式
            this.currentTask = {
                id: taskDetail.id,
                jd_id: taskDetail.jd_id,
                user_id: taskDetail.user_id,
                extra: taskDetail.extra,
                create_at: taskDetail.create_at,
                update_at: taskDetail.update_at
            };

            // 使用从API获取的完整信息
            this.jobDescription = taskDetail.jd_info.description || '';
            this.jobTitle = taskDetail.jd_info.title || '';
            this.evaluationCriteria = evaluationCriteria.length > 0 ? evaluationCriteria : this.evaluationCriteria;

            // 切换到任务界面
            this.currentStep = 'task';

            // 重置简历相关状态
            this.uploadedResumeRecords = [];
            this.filteredResumeRecords = [];
            this.currentPage = 1;
            this.totalRecords = 0;

            // 关闭抽屉
            this.isTaskHistoryDrawerOpen = false;

            // 加载该任务的简历列表
            await this.loadResumeList();

            // 触发任务切换事件
            this.taskSwitch.emit({
                previous_task_id: this.currentTask ? this.currentTask.id : undefined,
                current_task_id: taskDetail.id,
                task_title: `任务 #${taskDetail.id}`,
                switch_time: new Date().toISOString()
            });

            this.showMessage('切换任务成功', 'success');
        } catch (error) {
            console.error('切换任务失败:', error);
            SentryReporter.captureError(error, {
                action: 'handleSwitchTask',
                component: 'pcm-jlsx-modal',
                title: '切换任务失败'
            });
            ErrorEventBus.emitError({
                error: error,
                message: '切换任务失败'
            });
        }
    };

    // 任务历史分页处理
    private handleTaskHistoryPageChange = async (page: number) => {
        this.taskHistoryCurrentPage = page;
        await this.loadHistoryTasks();
    };

    // 添加导出记录模态框处理函数
    private handleExportRecordsClick = () => {
        this.isExportRecordsModalOpen = true;
    };

    private handleExportRecordsModalClose = () => {
        this.isExportRecordsModalOpen = false;
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

    private emitAnalysisCompleteEvent = () => {
        if (!this.currentTask) return;

        // 计算分析统计数据
        const allResumes = this.resumeRecords;
        const analyzedResumes = allResumes.filter(record =>
            record.evaluate_status === 1 && typeof record.score === 'number'
        );
        const failedResumes = allResumes.filter(record => record.evaluate_status === -1);

        // 计算评分统计
        const scores = analyzedResumes.map(record => record.score).filter(score => typeof score === 'number') as number[];
        const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;


        // 触发简历分析完成事件
        this.resumeAnalysisComplete.emit({
            task_id: this.currentTask.id,
            total_resumes: allResumes.length,
            analyzed_resumes: analyzedResumes.length,
            failed_resumes: failedResumes.length,
            average_score: Math.round(averageScore * 100) / 100, // 保留两位小数
            highest_score: highestScore,
        });

    };

    /**
     * 处理pcm-upload组件的上传变化事件
     */
    private handleUploadChange = (e: CustomEvent<FileUploadResponse[]>) => {
        if (!this.currentTask) {
            this.showMessage('请先创建任务', 'warning');
            return;
        }

        const currentUploadResults: FileUploadResponse[] = e.detail || [];

        // 获取已存在的文件URL列表，用于比较
        const existingFileUrls = this.uploadedResumeRecords.map(record =>
            record.file_url || record.fileInfo?.cos_key
        ).filter(url => url);

        // 找出新增的文件（在当前结果中但不在已存在列表中的文件）
        const newUploadResults = currentUploadResults.filter(result =>
            !existingFileUrls.includes(result.cos_key)
        );

        // 找出被删除的文件（在已存在列表中但不在当前结果中的文件）
        const currentFileUrls = currentUploadResults.map(result => result.cos_key);
        const removedFileUrls = existingFileUrls.filter(url =>
            !currentFileUrls.includes(url)
        );

        // 处理新增的文件
        if (newUploadResults.length > 0) {
            // 为每个新上传的文件创建简历记录
            const newRecords = newUploadResults.map(result => {
                const record: ResumeRecord = {
                    id: Date.now() + Math.random().toString(),
                    fileName: result.file_name || '未知文件',
                    talentInfo: '等待分析...',
                    score: undefined,
                    scoreDetail: '等待分析...',
                    uploadTime: new Date(),
                    fileInfo: result,
                    task_id: this.currentTask!.id,
                    file_url: result.cos_key,
                    evaluate_status: undefined // 新上传的简历默认为未开始状态
                };
                return record;
            });

            // 添加到上传记录列表
            this.uploadedResumeRecords = [...this.uploadedResumeRecords, ...newRecords];

            // 触发上传成功事件
            newRecords.forEach(record => {
                this.uploadSuccess.emit(record.fileInfo);
            });

            this.showMessage(`成功上传 ${newRecords.length} 个简历文件！`, 'success');
        }

        // 处理被删除的文件
        if (removedFileUrls.length > 0) {
            // 从上传记录列表中移除被删除的文件
            this.uploadedResumeRecords = this.uploadedResumeRecords.filter(record => {
                const fileUrl = record.file_url || record.fileInfo?.cos_key;
                return !removedFileUrls.includes(fileUrl);
            });
        }
    };

    /**
     * 开始分析简历，检查是否有文件正在上传
     */
    private handleStartAnalysis = async () => {
        // 判断文件是否正在上传
        if (await this.pcmUploadRef?.getIsUploading?.()) {
            this.showMessage('文件上传中，请稍后', 'info');
            return;
        }

        await this.startAnalysis();
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
                                <span
                                    class="step-indicator clickable"
                                    onClick={this.handleTaskHistoryClick}
                                    title="点击查看任务管理"
                                >
                                    任务管理
                                </span>
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

                {/* 任务管理抽屉 */}
                <pcm-drawer
                    isOpen={this.isTaskHistoryDrawerOpen}
                    drawerTitle="任务管理"
                    width="500px"
                    onClosed={() => {
                        this.isTaskHistoryDrawerOpen = false;
                    }}
                >
                    <div class="task-history-drawer-content">
                        {/* 任务列表 */}
                        <div class="task-list">
                            {this.isLoadingHistoryTasks ? (
                                <div class="loading-tasks">
                                    <div class="loading-spinner-small"></div>
                                    <p>加载中...</p>
                                </div>
                            ) : this.historyTasks.length === 0 ? (
                                <div class="empty-tasks">
                                    <p>暂无历史任务</p>
                                </div>
                            ) : (
                                this.historyTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        class={{
                                            'task-item': true,
                                            'active': task.id === this.currentTask?.id
                                        }}
                                        onClick={() => this.handleSwitchTask(task)}
                                    >
                                        <div class="task-info">
                                            <div class="task-header">
                                                <div class="task-id">{task.title || `任务 #${task.id}`}</div>
                                                <div class="task-time">{task.timeDisplay}</div>
                                            </div>
                                        </div>
                                        {task.id === this.currentTask?.id && (
                                            <div class="current-task-indicator">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 分页 */}
                        {this.taskHistoryTotal > this.taskHistoryPageSize && (
                            <div class="task-pagination">
                                <button
                                    class="page-btn"
                                    disabled={this.taskHistoryCurrentPage === 1}
                                    onClick={() => this.handleTaskHistoryPageChange(this.taskHistoryCurrentPage - 1)}
                                >
                                    上一页
                                </button>
                                <span class="page-info">
                                    第 {this.taskHistoryCurrentPage} 页，共 {Math.ceil(this.taskHistoryTotal / this.taskHistoryPageSize)} 页
                                </span>
                                <button
                                    class="page-btn"
                                    disabled={this.taskHistoryCurrentPage >= Math.ceil(this.taskHistoryTotal / this.taskHistoryPageSize)}
                                    onClick={() => this.handleTaskHistoryPageChange(this.taskHistoryCurrentPage + 1)}
                                >
                                    下一页
                                </button>
                            </div>
                        )}
                    </div>
                </pcm-drawer>

                {/* 导出记录模态框 */}
                <pcm-export-records-modal
                    open={this.isExportRecordsModalOpen}
                    botId={this.botId}
                    sourceId={this.currentTask?.id?.toString()}
                    onCancel={this.handleExportRecordsModalClose}
                />
            </div>
        );
    }
}
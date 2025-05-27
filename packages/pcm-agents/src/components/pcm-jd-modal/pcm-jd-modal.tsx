import { Component, Prop, h, State, Element, Event, EventEmitter, Watch } from '@stencil/core';
import { sendHttpRequest, verifyApiKey } from '../../utils/utils';
import { ConversationStartEventData, InterviewCompleteEventData, StreamCompleteEventData } from '../../components';
import { ErrorEventBus, ErrorEventDetail } from '../../utils/error-event';
import { authStore } from '../../../store/auth.store';
import { configStore } from '../../../store/config.store';

/**
 * 职位生成组件
 */

@Component({
    tag: 'pcm-jd-modal',
    styleUrls: ['pcm-jd-modal.css', '../../global/global.css'],
    shadow: true,
})
export class PcmJdModal {
    /**
     * 模态框标题
     */
    @Prop() modalTitle: string = '职位生成';

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
    @Prop() defaultQuery: string = '请帮我生成职位信息';

    /**
     * 是否以全屏模式打开，移动端建议设置为true
     */
    @Prop() fullscreen: boolean = false;

    /**
     * 自定义输入参数，传入customInputs.job_info时，会隐藏JD输入区域<br>
     * 支持字符串格式（将被解析为JSON）或对象格式
     */
    @Prop() customInputs: Record<string, string> | string = {};

    /**
     * 解析后的自定义输入参数
     */
    @State() parsedCustomInputs: Record<string, string> = {};

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

    @State() showChatModal: boolean = false;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    // 输入模式：structured(点选模式) 或 free(表单模式)
    @State() inputMode: 'structured' | 'free' = 'structured';

    // 步骤：input(输入职位名称) 或 review(选择标签)
    @State() step: 'input' | 'review' = 'input';

    // 职位名称
    @State() jobName: string = '';

    // 自由输入模式的文本
    @State() freeInputText: string = '';

    // 是否正在加载标签
    @State() isLoading: boolean = false;

    // 是否正在提交
    @State() isSubmitting: boolean = false;

    // 标签组
    @State() tagGroups: { dimensionName: string; defaultTags: string[]; optionalTags: string[] }[] = [];

    // 洗牌后的标签组
    @State() shuffledTagGroups: { dimensionName: string; tags: string[] }[] = [];

    // 选中的AI标签
    @State() selectedAITags: { [key: string]: string[] } = {};

    // 选中的基础标签
    @State() selectedTags: {
        salary: string;
        benefits: string[];
        education: string;
    } = {
            salary: '',
            benefits: [],
            education: ''
        };


    private tokenInvalidListener: () => void;
    private removeErrorListener: () => void;

    @Watch('token')
    handleTokenChange(newToken: string) {
        // 当传入的 token 变化时，更新 authStore 中的 token
        if (newToken && newToken !== authStore.getToken()) {
            authStore.setToken(newToken);
        }
    }

    @Watch('customInputs')
    handleCustomInputsChange() {
        this.parseCustomInputs();
    }

    private parseCustomInputs() {
        try {
            if (typeof this.customInputs === 'string') {
                // 尝试将字符串解析为JSON对象
                this.parsedCustomInputs = JSON.parse(this.customInputs);
            } else {
                // 已经是对象，直接使用
                this.parsedCustomInputs = { ...this.customInputs };
            }
        } catch (error) {
            console.error('解析 customInputs 失败:', error);
            // 解析失败时设置为空对象
            this.parsedCustomInputs = {};
            ErrorEventBus.emitError({
                source: 'pcm-jd-modal[parseCustomInputs]',
                error: error,
                message: '解析自定义输入参数失败',
                type: 'ui'
            });
        }
    }

    componentWillLoad() {
        // 初始解析 customInputs
        this.parseCustomInputs();

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


    // 薪资范围选项
    private salaryRanges = [
        { text: '3k-5k', value: '3k_5k' },
        { text: '5k-8k', value: '5k_8k' },
        { text: '8k-12k', value: '8k_12k' },
        { text: '12k-15k', value: '12k_15k' },
        { text: '15k-20k', value: '15k_20k' },
        { text: '20k以上', value: 'above_20k' },
    ];

    // 福利待遇选项
    private benefits = [
        { text: '五险一金', value: '五险一金' },
        { text: '年终奖', value: '年终奖' },
        { text: '带薪年假', value: '带薪年假' },
        { text: '加班补贴', value: '加班补贴' },
        { text: '餐补', value: '餐补' },
        { text: '交通补贴', value: '交通补贴' },
        { text: '节日福利', value: '节日福利' },
        { text: '团队建设', value: '团队建设' },
    ];

    // 学历要求选项
    private educationRequirements = [
        { text: '大专', value: '大专' },
        { text: '本科', value: '本科' },
        { text: '硕士', value: '硕士' },
        { text: '博士', value: '博士' },
        { text: '学历不限', value: '学历不限' },
    ];

    private handleClose = () => {
        this.isOpen = false;
        this.modalClosed.emit();
    };

    private handleToggleInput = () => {
        this.inputMode = this.inputMode === 'structured' ? 'free' : 'structured';
    };

    private handleJobNameChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        this.jobName = input.value;
    };

    private handleFreeInputChange = (event: Event) => {
        const textarea = event.target as HTMLTextAreaElement;
        this.freeInputText = textarea.value;
    };

    private handleNextStep = async () => {
        if (!this.jobName.trim()) {
            alert('请输入职位名称');
            return;
        }

        this.step = 'review';
        await this.handlePositionAnalysis(this.jobName);
    };

    private handlePrevStep = () => {
        this.step = 'input';
    };

    private async handlePositionAnalysis(jobName: string) {
        if (!jobName) return;

        this.isLoading = true;

        try {
            const response = await sendHttpRequest({
                url: '/sdk/v1/chat/workflow/block-run',
                method: 'POST',
                data: {
                    inputs: {
                        input_info: jobName
                    },
                    workflow_code: "generate_jd_tags"
                }
            });

            if (response.success && response.data?.data.outputs?.text) {
                try {
                    const parsedOutput = JSON.parse(response.data.data.outputs.text);
                    this.tagGroups = parsedOutput.tagGroup || [];

                    // 自动选中所有默认标签
                    const initialSelectedTags: { [key: string]: string[] } = {};

                    // 洗牌处理标签
                    const shuffled = (parsedOutput.tagGroup || []).map(group => {
                        // 将默认标签和可选标签合并
                        const allTags = [...(group.defaultTags || []), ...(group.optionalTags || [])];

                        // Fisher-Yates 洗牌算法打乱标签顺序
                        for (let i = allTags.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [allTags[i], allTags[j]] = [allTags[j], allTags[i]];
                        }

                        // 设置默认选中的标签
                        if (group.defaultTags && group.defaultTags.length > 0) {
                            initialSelectedTags[group.dimensionName] = [...group.defaultTags];
                        }

                        return {
                            dimensionName: group.dimensionName,
                            tags: allTags
                        };
                    });

                    this.shuffledTagGroups = shuffled;
                    this.selectedAITags = initialSelectedTags;
                } catch (error) {
                    ErrorEventBus.emitError({
                        source: 'pcm-jd-modal[handlePositionAnalysis]',
                        error: error,
                        message: '解析前置标签时错误',
                        type: 'ui'
                    });

                }
            }
        } catch (error) {
            console.error('工作流运行错误:', error);
        } finally {
            this.isLoading = false;
        }
    }

    private handleTagClick = (category: 'salary' | 'benefits' | 'education', value: string) => {
        if (category === 'benefits') {
            const currentTags = [...this.selectedTags.benefits];
            const newTags = currentTags.includes(value)
                ? currentTags.filter(t => t !== value)
                : [...currentTags, value];

            this.selectedTags = {
                ...this.selectedTags,
                benefits: newTags
            };
        } else {
            this.selectedTags = {
                ...this.selectedTags,
                [category]: this.selectedTags[category] === value ? '' : value
            };
        }
    };

    private handleAITagClick = (dimensionName: string, tag: string) => {
        const currentTags = this.selectedAITags[dimensionName] || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];

        this.selectedAITags = {
            ...this.selectedAITags,
            [dimensionName]: newTags
        };
    };

    private handleSubmitStructured = async () => {
        this.isSubmitting = true;

        try {
            // 处理薪资范围标签
            let salaryRange = '';
            if (this.selectedTags.salary) {
                const range = this.salaryRanges.find(r => r.value === this.selectedTags.salary);
                if (range) {
                    salaryRange = range.text;
                }
            }

            // 处理福利待遇标签
            const selectedBenefits = this.selectedTags.benefits.join('、');

            // 处理学历要求标签
            let education = '';
            if (this.selectedTags.education) {
                const edu = this.educationRequirements.find(e => e.value === this.selectedTags.education);
                if (edu) {
                    education = edu.text;
                }
            }

            // 构建职位描述
            let jobInfo = `职位名称：${this.jobName}\n`;

            if (salaryRange) {
                jobInfo += `薪资范围：${salaryRange}\n`;
            }

            if (selectedBenefits) {
                jobInfo += `福利待遇：${selectedBenefits}\n`;
            }

            if (education) {
                jobInfo += `学历要求：${education}\n`;
            }

            // 添加AI标签
            Object.entries(this.selectedAITags).forEach(([dimension, tags]) => {
                if (tags.length > 0) {
                    jobInfo += `${dimension}：${tags.join('、')}\n`;
                }
            });

            // 显示聊天模态框
            this.showChatModal = true;
            this.jobDescription = jobInfo;
        } catch (error) {
            console.error('提交结构化数据时出错:', error);
            ErrorEventBus.emitError({
                source: 'pcm-jd-modal[handleSubmitStructured]',
                error: error,
                message: '提交数据时出错，请重试',
                type: 'ui'
            });
        } finally {
            this.isSubmitting = false;
        }
    };

    private handleSubmitFree = async () => {
        if (!this.freeInputText.trim()) {
            alert('请输入职位需求信息');
            return;
        }

        this.isSubmitting = true;

        try {
            // 直接使用自由输入的文本作为职位描述
            this.jobDescription = this.freeInputText;

            // 显示聊天模态框
            this.showChatModal = true;
        } catch (error) {
            console.error('提交自由输入数据时出错:', error);
            ErrorEventBus.emitError({
                source: 'pcm-jd-modal[handleSubmitFree]',
                error: error,
                message: '提交数据时出错，请重试',
                type: 'ui'
            });
        } finally {
            this.isSubmitting = false;
        }
    };

    @State() jobDescription: string = '';

    @Watch('isOpen')
    async handleIsOpenChange(newValue: boolean) {
        if (!newValue) {
            // 重置状态
            this.showChatModal = false;
            this.jobDescription = '';
            this.jobName = '';
            this.freeInputText = '';
            this.step = 'input';
            this.inputMode = 'structured';
            this.tagGroups = [];
            this.shuffledTagGroups = [];
            this.selectedAITags = {};
            this.selectedTags = {
                salary: '',
                benefits: [],
                education: ''
            };
        } else {
            if (this.parsedCustomInputs && this.parsedCustomInputs.job_info) {
                this.jobDescription = this.parsedCustomInputs.job_info;
                // 如果有 job_info，直接切换到自由输入模式并填充内容
                this.inputMode = 'free';
                this.freeInputText = this.parsedCustomInputs.job_info;
            }
            await verifyApiKey(this.token);
            if (this.conversationId) {
                // 如果有会话ID，直接显示聊天模态框
                this.showChatModal = true;
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


    // 渲染标签组
    private renderTagGroup(title: string, options: { text: string, value: string }[], category: 'salary' | 'benefits' | 'education') {
        return (
            <div class="tag-group">
                <div class="tag-title">{title}</div>
                <div class="tag-container">
                    {options.map(option => {
                        const isSelected = category === 'benefits'
                            ? this.selectedTags.benefits.includes(option.value)
                            : this.selectedTags[category] === option.value;

                        return (
                            <div
                                class={{
                                    'tag': true,
                                    'tag-selected': isSelected
                                }}
                                onClick={() => this.handleTagClick(category, option.value)}
                            >
                                {option.text}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 渲染AI标签组
    private renderAITagGroups() {
        return (
            <div class="ai-tag-groups">
                {this.shuffledTagGroups.map(group => (
                    <div class="tag-group">
                        <div class="tag-title">{group.dimensionName}</div>
                        <div class="tag-container">
                            {group.tags.map(tag => {
                                const isSelected = (this.selectedAITags[group.dimensionName] || []).includes(tag);
                                return (
                                    <div
                                        class={{
                                            'tag': true,
                                            'tag-selected': isSelected
                                        }}
                                        onClick={() => this.handleAITagClick(group.dimensionName, tag)}
                                    >
                                        {tag}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 渲染加载状态
    private renderLoadingState() {
        return (
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">
                    <div>AI 正在分析职位信息</div>
                    <div class="loading-subtext">请稍候...</div>
                </div>
            </div>
        );
    }

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

        // 修正这里的逻辑，确保当 customInputs.job_info 存在时不隐藏输入区域，而是显示自由输入模式
        const hideJdInput = false;

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
                    {!this.showChatModal && !this.conversationId && !hideJdInput && (
                        <div class="input-container">
                            {/* 输入模式切换 */}
                            <div class="input-mode-toggle">
                                <span>职位需求信息</span>
                                <button
                                    class="toggle-button"
                                    onClick={this.handleToggleInput}
                                    disabled={this.isLoading}
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    切换输入
                                </button>
                            </div>

                            {/* 结构化输入模式 */}
                            {this.inputMode === 'structured' && (
                                <div class="structured-input">
                                    {/* 第一步：输入职位名称 */}
                                    {this.step === 'input' && (
                                        <div class="job-name-input">
                                            <label htmlFor="job-name">
                                                职位名称 <span class="required">*</span>
                                            </label>
                                            <input
                                                id="job-name"
                                                type="text"
                                                placeholder="请输入职位名称"
                                                value={this.jobName}
                                                onInput={this.handleJobNameChange}
                                                disabled={this.isLoading}
                                            />
                                            <div class="button-container">
                                                <button
                                                    class="submit-button next-button"
                                                    onClick={this.handleNextStep}
                                                    disabled={!this.jobName.trim() || this.isLoading}
                                                >
                                                    下一步
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 第二步：选择标签 */}
                                    {this.step === 'review' && (
                                        <div class="tag-selection">
                                            {this.isLoading ? (
                                                this.renderLoadingState()
                                            ) : (
                                                <div class="tag-selection-content">
                                                    {/* AI推荐标签 */}
                                                    {this.tagGroups.length > 0 && (
                                                        <div class="ai-tags-section">
                                                            <div class="section-title">AI 推荐标签</div>
                                                            {this.renderAITagGroups()}
                                                        </div>
                                                    )}

                                                    {/* 基础标签 */}
                                                    {this.tagGroups.length > 0 && (
                                                        <div class="basic-tags-section">
                                                            {this.renderTagGroup('月薪范围', this.salaryRanges, 'salary')}
                                                            {this.renderTagGroup('福利待遇', this.benefits, 'benefits')}
                                                            {this.renderTagGroup('学历要求', this.educationRequirements, 'education')}
                                                        </div>
                                                    )}

                                                    <div class="button-container">
                                                        <button
                                                            class="submit-button prev-button"
                                                            onClick={this.handlePrevStep}
                                                        >
                                                            上一步
                                                        </button>
                                                        <button
                                                            class="submit-button"
                                                            onClick={this.handleSubmitStructured}
                                                            disabled={this.isSubmitting}
                                                        >
                                                            {this.isSubmitting ? '处理中...' : '生成JD'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 自由输入模式 */}
                            {this.inputMode === 'free' && (
                                <div class="free-input">
                                    <div class="textarea-container">
                                        <label htmlFor="free-input-text">
                                            JD信息 <span class="required">*</span>
                                        </label>
                                        <textarea
                                            id="free-input-text"
                                            placeholder="请按照下方提示格式输入职位需求信息"
                                            rows={8}
                                            value={this.freeInputText}
                                            onInput={this.handleFreeInputChange}
                                        ></textarea>
                                    </div>

                                    <div class="input-guide">
                                        <div class="guide-title">输入格式参考：</div>
                                        <div class="guide-content">
                                            <div>• 职位名称 - 明确定义职位的名称</div>
                                            <div>• 薪资范围 - 明确该岗位的月薪或年薪</div>
                                            <div>• 福利待遇 - 该职位的福利待遇，如：五险一金、年休假、下午茶等</div>
                                            <div>• 工作职责 - 描述工作内容</div>
                                            <div>• 任职资格 - 包括学历、经验和技术要求</div>
                                            <div>• 工作地点与性质 - 全职/兼职、远程/办公室</div>
                                        </div>
                                    </div>

                                    <div class="button-container">
                                        <button
                                            class="submit-button"
                                            onClick={this.handleSubmitFree}
                                            disabled={!this.freeInputText.trim() || this.isSubmitting}
                                        >
                                            {this.isSubmitting ? '处理中...' : '生成JD'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div class="ai-disclaimer">
                                <p>所有内容均由AI生成仅供参考</p>
                                <p class="beian-info">
                                    <span>中央网信办生成式人工智能服务备案号</span>：
                                    <a href="https://www.pincaimao.com" target="_blank" rel="noopener noreferrer">Hunan-PinCaiMao-202412310003</a>
                                </p>
                            </div>
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
                                botId="3022316191018873"
                                conversationId={this.conversationId}
                                defaultQuery={this.defaultQuery}
                                enableVoice={false}
                                filePreviewMode={this.filePreviewMode}
                                customInputs={this.conversationId ? {} : {
                                    ...this.parsedCustomInputs,
                                    job_info: this.parsedCustomInputs?.job_info || this.jobDescription
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
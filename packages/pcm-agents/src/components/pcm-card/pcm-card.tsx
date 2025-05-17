import { Component, Prop, h,  State, Watch,Event, EventEmitter } from '@stencil/core';
import { sendHttpRequest } from '../../utils/utils';
import { authStore } from '../../../store/auth.store';

/**
 * 智能体卡片组件
 * 用于展示各业务功能入口，点击后根据回调打开对应的模态框
 */
@Component({
    tag: 'pcm-card',
    styleUrl: 'pcm-card.css',
    shadow: true,
})
export class PcmCard {
    /**
   * SDK鉴权密钥
   */
    @Prop({ attribute: 'token' }) token!: string;
    /**
     * 自定义卡片标题
     */
    @Prop() cardTitle: string = '';

    /**
     * 自定义卡片描述
     */
    @Prop() description: string = '';

    /**
     * 自定义卡片图标URL
     */
    @Prop() iconUrl: string = '';


    /**
     * 自定义作者名称
     */
    @Prop() author: string = '';

    /**
     * 自定义作者头像URL
     */
    @Prop() authorAvatarUrl: string = '';

    /**
     * 是否显示右侧对话标签
     */
    @Prop() showChatTag: boolean = false;

    /**
     * 自定义右侧标签
     */
    @Prop() customChatTag: string = '';

    /**
     * 自定义立即使用按钮文本
     */
    @Prop() useButtonText: string = '立即使用';

    /**
     * 智能体ID
     */
    @Prop() botId: string = '';

    /**
     * 内部状态：用于存储从接口获取的智能体数据
     */
    @State() botData: any = null;

    /**
     * 内部状态：加载状态
     */
    @State() loading: boolean = false;

    /**
     * 内部状态：错误信息
     */
    @State() error: string = '';

    /**
     * SDK密钥验证失败事件
     */
    @Event() tokenInvalid: EventEmitter<void>;

    private tokenInvalidListener: () => void;

    /**
     * 监听 botId 变化，当 botId 改变时重新获取数据
     */
    @Watch('botId')
    watchBotIdHandler(newValue: string) {
        if (newValue) {
            this.fetchBotData();
        }
    }

    @Watch('token')
    handleTokenChange(newToken: string) {
        // 当传入的 token 变化时，更新 authStore 中的 token
        if (newToken && newToken !== authStore.getToken()) {
            authStore.setToken(newToken);
        }
    }

    /**
     * 组件将要加载时，如果有 botId 则获取数据
     */
    componentWillLoad() {
        if (this.token) {
            authStore.setToken(this.token);
        }
        if (this.botId) {
            this.fetchBotData();
        }
         // 添加全局token无效事件监听器
         this.tokenInvalidListener = () => {
            this.tokenInvalid.emit();
        };
        document.addEventListener('pcm-token-invalid', this.tokenInvalidListener);
    }

    disconnectedCallback() {
        // 组件销毁时移除事件监听器
        document.removeEventListener('pcm-token-invalid', this.tokenInvalidListener);
    }


    /**
     * 获取机器人数据
     */
    private async fetchBotData() {
        if (!this.botId) return;

        this.loading = true;
        this.error = '';

        try {
            const response = await sendHttpRequest({
                url: `/sdk/v1/agent/${this.botId}/info`,
                method: 'GET',
            });

            if (response.success && response.data) {
                this.botData = response.data;
            } else {
                throw new Error(response.message || '获取智能体信息失败');
            }
        } catch (err) {
            this.error = err.message || '获取智能体信息失败';
            console.error('获取智能体信息失败:', err);
        } finally {
            this.loading = false;
        }
    }

    render() {
        // 从 botData 中获取信息，如果用户传入的属性存在则优先使用用户传入的
        const title = this.cardTitle || (this.botData?.title || '');
        const desc = this.description || (this.botData?.description || '');
        // 处理图标，可能会在不同属性中
        const iconFromBot = this.botData?.icon || this.botData?.iconUrl || this.botData?.logo || '';
        const icon = this.iconUrl || iconFromBot;

        const authorName = this.author || (this.botData?.author_name || '');
        const authorAvatar = this.authorAvatarUrl || (this.botData?.author_avatar || '');
        const hasChatTag = this.customChatTag || (this.botData?.flag || '');
        const usersCount = this.botData?.use_count || 0;
        const starsCount = this.botData?.follow_count || 0;
        const usageCount = this.botData?.view_count || 0;

        console.log('渲染数据:', {
            title,
            icon,
            iconFromBot,
            userIconUrl: this.iconUrl,
            botData: this.botData,
            authorName,
            authorAvatar
        });

        return (
            <div
                class="card-container"
            >
                {this.loading ? (
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <div>加载中...</div>
                    </div>
                ) : this.error ? (
                    <div class="error-container">
                        <div class="error-icon">!</div>
                        <div class="error-message">{this.error}</div>
                    </div>
                ) : (
                    <div>
                        <div class="card-header">
                            {icon && (
                                <div class="card-icon">
                                    <img src={icon} alt={title} />
                                </div>
                            )}
                            <div class="card-info">
                                <div class="title-row">
                                    <div class="title-wrapper">
                                        <div class="card-title">{title}</div>
                                    </div>
                                    {this.showChatTag && hasChatTag && <div class="chat-tag">{hasChatTag}</div>}
                                </div>

                                {authorName && (
                                    <div class="author-row">
                                        {authorAvatar && (
                                            <img class="author-avatar" src={authorAvatar} alt={authorName} />
                                        )}
                                        <div class="author-name">{authorName}</div>
                                    </div>
                                )}

                                {desc && (
                                    <div class="card-description">{desc}</div>
                                )}
                            </div>
                        </div>

                        <div class="card-footer">
                            <div class="stats-container">
                                <div class="stat-item">
                                    <span class="stat-icon user-icon"></span>
                                    <div class="stat-value">{usersCount}</div>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon star-icon"></span>
                                    <div class="stat-value">{starsCount}</div>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-icon video-icon"></span>
                                    <div class="stat-value">{usageCount}</div>
                                </div>
                            </div>
                            <div class="use-button">{this.useButtonText || '立即使用'}</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
} 
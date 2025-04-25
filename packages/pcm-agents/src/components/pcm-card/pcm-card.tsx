import { Component, Prop, h, Event, EventEmitter, State, Watch } from '@stencil/core';
import { sendHttpRequest } from '../../utils/utils';

/**
 * 业务卡片组件
 * 用于展示业务功能入口，点击后打开对应的模态框
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
   * 卡片标题
   */
  @Prop() cardTitle: string = '';

  /**
   * 卡片描述
   */
  @Prop() description: string = '';

  /**
   * 卡片图标URL
   */
  @Prop() iconUrl: string = '';

  /**
   * 卡片背景色
   */
  @Prop() backgroundColor: string = '#ffffff';

  /**
   * 作者名称
   */
  @Prop() author: string = '';

  /**
   * 作者头像URL
   */
  @Prop() authorAvatarUrl: string = '';

  /**
   * 是否显示右侧对话标签
   */
  @Prop() showChatTag: boolean = false;

  /**
   * 用户数量
   */
  @Prop() userCount: number = 0;

  /**
   * 收藏数量
   */
  @Prop() starCount: number = 0;

  /**
   * 使用次数
   */
  @Prop() useCount: number = 0;

  /**
   * 立即使用按钮文本
   */
  @Prop() useButtonText: string = '立即使用';

  /**
   * 智能体ID
   */
  @Prop() botId: string = '';

  /**
   * 卡片点击事件
   */
  @Event() cardClick: EventEmitter<void>;

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
   * 监听 botId 变化，当 botId 改变时重新获取数据
   */
  @Watch('botId')
  watchBotIdHandler(newValue: string) {
    if (newValue) {
      this.fetchBotData();
    }
  }

  /**
   * 组件加载完成后，如果有 botId 则获取数据
   */
  componentDidLoad() {
    if (this.botId) {
      this.fetchBotData();
    }
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
        headers: {
            'authorization': 'Bearer ' + this.token
          },
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

  /**
   * 处理卡片点击
   */
  private handleClick = () => {
    this.cardClick.emit();
  };

  render() {
    // 从 botData 中获取信息，如果用户传入的属性存在则优先使用用户传入的
    const title = this.cardTitle || (this.botData?.title || '');
    const desc = this.description || (this.botData?.description || '');
    const icon = this.iconUrl || (this.botData?.icon || '');
    const authorName = this.author || (this.botData?.author?.name || '');
    const authorAvatar = this.authorAvatarUrl || (this.botData?.author?.avatar || '');
    const hasChatTag = this.showChatTag || (this.botData?.chatEnabled || false);
    const usersCount = this.userCount || (this.botData?.stats?.users || 0);
    const starsCount = this.starCount || (this.botData?.stats?.stars || 0);
    const usageCount = this.useCount || (this.botData?.stats?.usage || 0);
    console.log(icon);
    
    return (
      <div 
        class="card-container" 
        onClick={this.handleClick}
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
                  {hasChatTag && <div class="chat-tag">对话</div>}
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
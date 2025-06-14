import { Component, Prop, h, Element, Event, EventEmitter, State } from '@stencil/core';
import { marked } from 'marked';
import extendedTables from 'marked-extended-tables';
import { ChatMessage } from '../../interfaces/chat';
import { sendHttpRequest, getCosPresignedUrl, getCosPreviewUrl } from '../../utils/utils';
import { ErrorEventBus } from '../../utils/error-event';
import { SentryReporter } from '../../utils/sentry-reporter';

@Component({
    tag: 'pcm-chat-message',
    styleUrls: ['../../global/markdown.css', 'pcm-chat-message.css'],
    shadow: true,
})
export class ChatMessageComponent {
    /**
     * 消息数据
     */
    @Prop() message: ChatMessage;

    /**
     * 是否显示点赞点踩按钮 
     */
    @Prop() showFeedbackButtons: boolean = true;

    /**
     * 机器人ID
     */
    @Prop() botId?: string;

    /**
     * 消息变更事件
     */
    @Event() messageChange: EventEmitter<Partial<ChatMessage>>;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    /**
     * 点赞点踩状态
     */
    @State() feedbackStatus: 'like' | 'dislike' | null = null;

    /**
     * 视频播放URLs缓存
     */
    @State() videoUrls: { [key: string]: string } = {};

    /**
     * 用户头像URL
     */
    @Prop() userAvatar?: string;

    /**
     * 助手头像URL
     */
    @Prop() assistantAvatar?: string;

    /**
     * 是否显示复制按钮
     */
    @Prop() showCopyButton: boolean = true;

    /**
     * 附件预览模式
     * 'drawer': 在右侧抽屉中预览
     * 'window': 在新窗口中打开
     */
    @Prop() filePreviewMode: 'drawer' | 'window' = 'window';

    @Event() filePreviewRequest: EventEmitter<{
        url?: string,
        fileName: string,
        content?: string,
        contentType: 'file' | 'markdown' | 'text'
    }>;

    /**
     * 重试事件
     */
    @Event() retryRequest: EventEmitter<string>; // 传递消息ID

    constructor() {
        // 配置 marked 选项
        marked.use(extendedTables);
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    /**
     * 组件加载时检查消息是否已有反馈状态
     */
    componentWillLoad() {

        // 如果消息已经有反馈状态，初始化feedbackStatus
        if (this.message && this.message.feedback) {
            this.feedbackStatus = this.message.feedback.rating as 'like' | 'dislike' | null;
        }
    }

    // 复制消息内容到剪贴板
    private copyMessageContent() {
        if (this.message.answer) {
            navigator.clipboard.writeText(this.message.answer)
                .then(() => {
                    // 可以添加复制成功的提示
                    console.log('内容已复制到剪贴板');
                    alert('内容已复制到剪贴板');
                })
                .catch(err => {
                    // 使用全局事件总线发送错误
                    ErrorEventBus.emitError({
                        error: err,
                        message: '复制内容失败',
                    });
                    console.error('复制失败:', err);
                });
        }
    }

    // 渲染用户消息部分
    private renderUserMessage() {
        if (!this.message?.query?.trim()) return null;

        return (
            <div class={{ 'user-message-container': true }}>
                {this.userAvatar && (
                    <div class="avatar user-avatar">
                        <img src={this.userAvatar} alt="用户头像" />
                    </div>
                )}
                <div class="message-bubble user-message">
                    <div>{this.message.query}</div>
                    {this.renderInputs()}
                </div>
            </div>
        );
    }

    // 渲染助手消息部分
    private renderAssistantMessage() {
        if (!this.message.answer && !this.message.isStreaming) return null;

        // 只有在开始流式输出且还没有内容时才显示loading
        const showLoading = this.message.isStreaming && !this.message.answer;
        const htmlContent = this.message.answer ? marked(this.message.answer) : '';

        return (
            <div class={{ 'assistant-message-container': true }}>
                {this.assistantAvatar && (
                    <div class="avatar assistant-avatar">
                        <img src={this.assistantAvatar} alt="助手头像" />
                    </div>
                )}
                <div class="message-bubble ">
                    <div class="assistant-message">
                        <div
                            class="markdown-content markdown-body"
                            innerHTML={showLoading ?
                                `请稍等...` :
                                htmlContent
                            }
                        ></div>
                    </div>
                    {!showLoading && this.message.answer && !this.message.isStreaming && (
                        <div class="message-actions">
                            {/* 根据父组件传入的属性决定是否显示重试按钮 */}
                            {this.message.showRetryButton && (
                                <button class="action-button retry-button" onClick={() => this.handleRetry()} title="重试">
                                    <span class="button-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="23 4 23 10 17 10"></polyline>
                                            <polyline points="1 20 1 14 7 14"></polyline>
                                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                                        </svg>
                                    </span>
                                    重试
                                </button>
                            )}

                            {this.showCopyButton && (
                                <button class="action-button" onClick={() => this.copyMessageContent()} title="复制内容">
                                    <span class="button-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </span>
                                    复制
                                </button>
                            )}
                            {this.showFeedbackButtons && (
                                <>
                                    <button
                                        class={`action-button icon-only ${this.feedbackStatus === 'like' ? 'active' : ''}`}
                                        title="赞"
                                        onClick={() => this.handleLike()}
                                    >
                                        <span class="button-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                            </svg>
                                        </span>
                                    </button>
                                    <button
                                        class={`action-button icon-only ${this.feedbackStatus === 'dislike' ? 'active' : ''}`}
                                        title="踩"
                                        onClick={() => this.handleDislike()}
                                    >
                                        <span class="button-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                                            </svg>
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    private getFileName(fileUrl: string): string {
        const parts = fileUrl.split('/');
        return parts[parts.length - 1];
    }


    // 添加处理文本内容点击的方法
    private handleContentClick(title: string, content: string, contentType: 'markdown' | 'text' = 'text') {
        this.filePreviewRequest.emit({
            fileName: title,
            content: content,
            contentType: contentType
        });
    }

    // 加载视频播放URL
    private async loadVideoUrl(cosKey: string) {
        if (this.videoUrls[cosKey]) {
            return; // 已经加载过了
        }

        const videoUrl = await getCosPresignedUrl(cosKey);
        if (videoUrl) {
            this.videoUrls = {
                ...this.videoUrls,
                [cosKey]: videoUrl
            };
        }
    }

    // 修改处理文件点击的方法
    private async handleFileClick(fileUrl: string, fileName: string) {
        const previewUrl = await getCosPreviewUrl(fileUrl);
        if (previewUrl) {
            if (this.filePreviewMode === 'drawer') {
                this.filePreviewRequest.emit({
                    url: previewUrl,
                    fileName: fileName,
                    contentType: 'file'
                });
            } else {
                window.open(previewUrl, '_blank');
            }
        } else {
            console.error('无法获取预览URL');
            SentryReporter.captureError('无法获取预览URL', {
                action: 'handleFileClick',
                component: 'pcm-chat-message',
                title: '无法获取预览URL'
            });
            ErrorEventBus.emitError({
                error: '无法获取预览URL',
                message: '无法获取预览URL',
            });
        }
    }

    // 修改渲染文件项的部分
    private renderFileItem(fileName: string, fileUrl: string, index: number) {
        return (
            <div key={index} class="file-card" onClick={() => this.handleFileClick(fileUrl, fileName)}>
                <div class="file-card-icon" style={{ background: 'linear-gradient(45deg, #ff5600, #ff8344)' }}>
                    <img src="https://pub.pincaimao.com/static/web/images/home/i_file.png"></img>
                </div>
                <div class="file-card-content">
                    <div class="file-card-type">[附件信息]</div>
                    <div class="file-card-name">{fileName}</div>
                </div>
            </div>
        );
    }

    // 修改渲染输入数据的方法
    private renderInputs() {
        if (!this.message.inputs) return null;

        // 检查是否所有字段都为 null、undefined 或空字符串
        const hasValidInput = Object.keys(this.message.inputs).some(key => {
            const value = this.message.inputs[key];
            return value !== null && value !== undefined && value !== '' &&
                !key.startsWith('hide_') && key !== 'answer';
        });

        // 如果没有有效输入，返回 null
        if (!hasValidInput) return null;

        return (
            <div class="inputs-container">
                {Object.keys(this.message.inputs).map((key, index) => {
                    const value = this.message.inputs[key];
                    if (value && !key.startsWith('hide_') && key !== 'answer') {
                        if (key === 'video_url') {
                            // 渲染视频播放区域
                            const cosKey = value;
                            const videoUrl = this.videoUrls[cosKey];

                            // 如果还没有加载视频URL，异步加载
                            if (!videoUrl) {
                                this.loadVideoUrl(cosKey);
                            }

                            return (
                                <div class="video-inputs-container">
                                    <div key={index} class="video-container">
                                        {videoUrl ? (
                                            <video
                                                controls
                                                preload="metadata"
                                                style={{
                                                    width: '250px',
                                                    height: 'auto',
                                                    maxHeight: '250px',
                                                    borderRadius: '8px',
                                                    marginTop: '8px'
                                                }}
                                            >
                                                <source src={videoUrl} type="video/webm" />
                                                <source src={videoUrl} type="video/mp4" />
                                                <source src={videoUrl} type="video/ogg" />
                                                您的浏览器不支持视频播放。
                                            </video>
                                        ) : (
                                            <div class="video-loading">
                                                <div class="loading-spinner"></div>
                                                <span>正在加载视频...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        } else if (key === 'file_url') {
                            // 优先使用 file_name 属性，如果不存在则从 file_url 提取文件名
                            const fileName = this.message.inputs.file_name || this.getFileName(value);
                            return this.renderFileItem(fileName, value, index);
                        } else if (key === 'file_urls') {
                            // 始终将 file_urls 视为逗号分隔的字符串
                            const fileList = typeof value === 'string' ? value.split(',') : [value.toString()];

                            // 同样将 file_names 视为逗号分隔的字符串
                            const fileNames = this.message.inputs.file_names ?
                                (typeof this.message.inputs.file_names === 'string' ?
                                    this.message.inputs.file_names.split(',') :
                                    [this.message.inputs.file_names.toString()]) :
                                [];

                            return (
                                <div key={index}>
                                    {fileList.map((fileUrl, fileIndex) => {
                                        // 使用对应的文件名，如果不存在则从URL提取
                                        const fileName = fileNames[fileIndex] || this.getFileName(fileUrl);
                                        return this.renderFileItem(fileName, fileUrl, fileIndex);
                                    })}
                                </div>
                            );
                        } else if (key === 'job_info' || key === 'rule') {
                            const title = key === 'job_info' ? '职位信息' : '评估规则';
                            const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

                            return (
                                <div key={index} class="file-card" onClick={() => this.handleContentClick(title, content)}>
                                    <div class="file-card-icon" style={{ background: '#0d75fb' }}>
                                        <img src="https://pub.pincaimao.com/static/web/images/home/i_position.png"></img>
                                    </div>
                                    <div class="file-card-content">
                                        <div class="file-card-type">[{title}]</div>
                                        <div class="file-card-name">{content.length > 50 ? content.substring(0, 50) + '...' : content}</div>
                                    </div>
                                </div>
                            );
                        } else if (key === 'input') {
                            return <div key={index} class="input-metadata">{`${value}`}</div>;
                        }
                    }
                    return null;
                })}
            </div>
        );
    }

    /**
     * 处理点赞操作
     */
    private async handleLike() {
        // 如果当前已经是点赞状态，则取消点赞
        const newStatus = this.feedbackStatus === 'like' ? null : 'like';

        // 发送请求到服务器
        await this.submitFeedback(newStatus);
    }

    /**
     * 处理点踩操作
     */
    private async handleDislike() {
        // 如果当前已经是点踩状态，则取消点踩
        const newStatus = this.feedbackStatus === 'dislike' ? null : 'dislike';

        // 发送请求到服务器
        await this.submitFeedback(newStatus);
    }

    /**
     * 提交反馈到服务器
     */
    private async submitFeedback(rating: 'like' | 'dislike' | null) {
        if (!this.message.id) {
            console.error('消息ID不存在，无法提交反馈');
            SentryReporter.captureError('消息ID不存在，无法提交反馈', {
                action: 'submitFeedback',
                component: 'pcm-chat-message',
                title: '无法提交反馈'
            });
            ErrorEventBus.emitError({
                error: '消息ID不存在，无法提交反馈',
                message: '消息ID不存在，无法提交反馈',
            });
            return;
        }

        try {
            const result = await sendHttpRequest({
                url: `/sdk/v1/chat/messages/${this.message.id}/feedbacks`,
                method: 'POST',
                data: {
                    rating,
                    bot_id: this.botId,
                    content: '',
                }
            });
            if (result.success) {
                // 更新本地状态
                this.feedbackStatus = rating;

                // 更新消息对象中的反馈状态，创建新对象以确保引用变化
                if (this.message && this.message.feedback) {
                    this.message = {
                        ...this.message,
                        feedback: {
                            ...this.message.feedback,
                            rating
                        }
                    };
                }

                console.log('反馈提交成功');
            } else {
                console.error('反馈提交失败:', result.message);
            }
        } catch (error) {
            console.error('提交反馈时发生错误:', error);
            SentryReporter.captureError(error, {
                action: 'submitFeedback',
                component: 'pcm-chat-message',
                title: '提交反馈失败'
            });
        }
    }

    /**
     * 处理重试操作
     */
    private handleRetry() {
        if (this.message.id) {
            this.retryRequest.emit(this.message.id);
        }
    }

    render() {
        return (
            <div class="message-round">
                {this.renderUserMessage()}
                {this.renderAssistantMessage()}
            </div>
        );
    }
} 
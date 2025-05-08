import { Component, Prop, h, Element, Event, EventEmitter, State } from '@stencil/core';
import { marked } from 'marked';
import extendedTables from 'marked-extended-tables';
import { ChatMessage } from '../../interfaces/chat';
import { sendHttpRequest } from '../../utils/utils';

@Component({
    tag: 'pcm-chat-message',
    styleUrl: 'pcm-chat-message.css',
    shadow: true,
})
export class ChatMessageComponent {
    /**
     * 消息数据
     */
    @Prop() message: ChatMessage;

    /**
     * SDK鉴权密钥
     */
    @Prop({ attribute: 'token' }) token: string = '';

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
     * 用户头像URL
     */
    @Prop() userAvatar?: string;

    /**
     * 助手头像URL
     */
    @Prop() assistantAvatar?: string;

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
                    alert('复制失败');
                    console.error('复制失败:', err);
                });
        }
    }

    private copyInputValue(text: string) {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log('内容已复制到剪贴板');
                    alert('内容已复制到剪贴板');
                })
                .catch(err => {
                    alert('复制失败');
                    console.error('复制失败:', err);
                });
        }
    }

    // 渲染用户消息部分
    private renderUserMessage() {
        if (!this.message?.query?.trim()) return null;

        const hasAvatar = !!this.userAvatar;
        
        return (
            <div class={{'user-message-container': true, 'has-avatar': hasAvatar}}>
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
        const hasAvatar = !!this.assistantAvatar;

        return (
            <div class={{'assistant-message-container': true, 'has-avatar': hasAvatar}}>
                {this.assistantAvatar && (
                    <div class="avatar assistant-avatar">
                        <img src={this.assistantAvatar} alt="助手头像" />
                    </div>
                )}
                <div class="message-bubble assistant-message">
                    <div
                        class="markdown-content markdown-body"
                        innerHTML={showLoading ?
                            `请稍等...` :
                            htmlContent
                        }
                    ></div>
                </div>
                {!showLoading && this.message.answer && (
                    <div class="message-actions">
                        <button class="action-button" onClick={() => this.copyMessageContent()} title="复制内容">
                            <span class="button-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </span>
                            复制
                        </button>
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
        );
    }


    private getFileName(fileUrl: string): string {
        const parts = fileUrl.split('/');
        return parts[parts.length - 1];
    }

    // 获取预览URL
    private async getCosPreviewUrl(cosKey: string): Promise<string | null> {
        try {
            const result = await sendHttpRequest<{ file_url: string }>({
                url: '/sdk/v1/files/presigned-url',
                method: 'GET',
                headers: {
                    'authorization': `Bearer ${this.token}`
                },
                params: {
                    cos_key: cosKey
                }
            });

            console.log(result);

            if (result.success && result.data?.file_url) {
                const baseUrl = result.data.file_url;
                return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ci-process=doc-preview&copyable=1&dstType=html`;
            }
            return null;
        } catch (error) {
            console.error('获取预览URL失败:', error);
            return null;
        }
    }

    // 处理文件点击
    private async handleFileClick(fileUrl: string) {
        const previewUrl = await this.getCosPreviewUrl(fileUrl);
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        } else {
            console.error('无法获取预览URL');
        }
    }

    // 修改渲染文件项的部分
    private renderFileItem(fileName: string, fileUrl: string, index: number) {
        return (
            <div key={index} class="file-card" onClick={() => this.handleFileClick(fileUrl)}>
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

        return (
            <div class="inputs-container">
                {Object.keys(this.message.inputs).map((key, index) => {
                    const value = this.message.inputs[key];
                    if (value && !key.startsWith('hide_') && key !== 'answer') {
                        if (key === 'file_url') {
                            const fileName = this.getFileName(value);
                            return this.renderFileItem(fileName, value, index);
                        } else if (key === 'file_urls') {
                            const fileList = Array.isArray(value) ? value : value.split(',');
                            return (
                                <div key={index}>
                                    {fileList.map((fileUrl, fileIndex) => {
                                        const fileName = this.getFileName(fileUrl);
                                        return this.renderFileItem(fileName, fileUrl, fileIndex);
                                    })}
                                </div>
                            );
                        } else if (key === 'job_info' || key === 'rule') {
                            return (
                                <div key={index} class="file-card">
                                    <div class="file-card-icon" style={{ background: '#0d75fb' }}>
                                        <img src="https://pub.pincaimao.com/static/web/images/home/i_position.png"></img>
                                    </div>
                                    <div class="file-card-content">
                                        <div class="file-card-type">[{key === 'job_info' ? '职位信息' : '评估规则'}]</div>
                                        <div class="file-card-name">{typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}</div>
                                    </div>
                                    <button class="copy-card-button" onClick={(e) => {
                                        e.stopPropagation();
                                        this.copyInputValue(value);
                                    }} title="复制内容">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
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
            return;
        }

        try {
            const result = await sendHttpRequest({
                url: `/sdk/v1/chat/messages/${this.message.id}/feedbacks`,
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${this.token}`
                },
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
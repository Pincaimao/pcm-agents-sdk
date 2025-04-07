import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';
import { marked } from 'marked';
import { ChatMessage } from '../../interfaces/chat';
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
     * 消息变更事件
     */
    @Event() messageChange: EventEmitter<Partial<ChatMessage>>;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    constructor() {
        // 配置 marked 选项
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    // 复制消息内容到剪贴板
    private copyMessageContent() {
        if (this.message.answer) {
            navigator.clipboard.writeText(this.message.answer)
                .then(() => {
                    // 可以添加复制成功的提示
                    console.log('内容已复制到剪贴板');
                })
                .catch(err => {
                    console.error('复制失败:', err);
                });
        }
    }

    // 渲染用户消息部分
    private renderUserMessage() {
        if (!this.message?.query?.trim()) return null;

        return (
            <div class="user-message-container">
                <div class="message-bubble user-message">
                    <p>{this.message.query}</p>
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
            <div class="assistant-message-container">
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
                            <button class="copy-button" onClick={() => this.copyMessageContent()} title="复制内容">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    )}
            </div>
        );
    }

    // 渲染输入数据
    private renderInputs() {
        if (!this.message.inputs) return null;

        return (
            <div>
                {Object.keys(this.message.inputs).map((key, index) => {
                    const value = this.message.inputs[key];
                    if (value && !key.startsWith('hide_') && key !== 'answer') {
                        if (key === 'file_url') {
                            return <div key={index} class="file-view">{value}</div>;
                        } else if (key === 'file_urls' || key === 'fileUrls') {
                            const fileList = value.split(',');
                            return (
                                <div key={index} class="flex flex-wrap">
                                    {fileList.map((fileUrl, fileIndex) => (
                                        <div key={fileIndex} class="file-view">{fileUrl}</div>
                                    ))}
                                </div>
                            );
                        } else if (key === 'job_info') {
                            return (
                                <div key={index} class="input-view">
                                    <div class="input-label">职位信息</div>
                                    <div class="input-value">{value}</div>
                                </div>
                            );
                        } else if (key === 'rule') {
                            return (
                                <div key={index} class="input-view">
                                    <div class="input-label">评估规则</div>
                                    <div class="input-value">{value}</div>
                                </div>
                            );
                        } else {
                            return <div key={index} class="input-metadata">{key}: {`${value}`}</div>;
                        }
                    }
                    return null;
                })}
            </div>
        );
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
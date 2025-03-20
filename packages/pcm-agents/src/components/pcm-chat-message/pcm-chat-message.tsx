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

    // 渲染用户消息部分
    private renderUserMessage() {
        if (!this.message?.query?.trim()) return null;

        return (
            <div class="user-message-container">
                <div class="message-bubble user-message">
                    <p>{this.message.query}</p>
                    {this.renderInputs()}
                </div>
                <span class="message-time">{this.message.time}</span>
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
                            `<div class="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>` : 
                            htmlContent
                        }
                    ></div>
                </div>
                <span class="message-time">{this.message.time}</span>
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
                            return <div key={index} class="text-sm text-gray-500">{key}: {`${value}`}</div>;
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
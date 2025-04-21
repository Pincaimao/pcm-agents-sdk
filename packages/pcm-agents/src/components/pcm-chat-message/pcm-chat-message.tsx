import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';
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
     * 消息变更事件
     */
    @Event() messageChange: EventEmitter<Partial<ChatMessage>>;

    // 使用 @Element 装饰器获取组件的 host 元素
    @Element() hostElement: HTMLElement;

    constructor() {
        // 配置 marked 选项
        marked.use(extendedTables);
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
                    {this.renderInputs()}
                    <p>{this.message.query}</p>
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

    private getFileIcon(fileName: string): { icon: string, color: string } {
        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return {
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H9C7.89543 3 7 3.89543 7 5V27C7 28.1046 7.89543 29 9 29H23C24.1046 29 25 28.1046 25 27V9L19 3Z" stroke="#1677FF" stroke-width="2"/>
                        <path d="M19 3V9H25" stroke="#1677FF" stroke-width="2"/>
                        <text x="11" y="20" fill="#1677FF" font-size="8">PDF</text>
                    </svg>`,
                    color: '#1677FF'
                };
            case 'doc':
            case 'docx':
                return {
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H9C7.89543 3 7 3.89543 7 5V27C7 28.1046 7.89543 29 9 29H23C24.1046 29 25 28.1046 25 27V9L19 3Z" stroke="#1677FF" stroke-width="2"/>
                        <path d="M19 3V9H25" stroke="#1677FF" stroke-width="2"/>
                        <text x="11" y="20" fill="#1677FF" font-size="6">DOC</text>
                    </svg>`,
                    color: '#1677FF'
                };
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return {
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H9C7.89543 3 7 3.89543 7 5V27C7 28.1046 7.89543 29 9 29H23C24.1046 29 25 28.1046 25 27V9L19 3Z" stroke="#52C41A" stroke-width="2"/>
                        <path d="M19 3V9H25" stroke="#52C41A" stroke-width="2"/>
                        <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="#52C41A"/>
                        <path d="M10 21L13 18L15 20L19 16L22 21H10Z" fill="#52C41A"/>
                    </svg>`,
                    color: '#52C41A'
                };
            default:
                return {
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H9C7.89543 3 7 3.89543 7 5V27C7 28.1046 7.89543 29 9 29H23C24.1046 29 25 28.1046 25 27V9L19 3Z" stroke="#666666" stroke-width="2"/>
                        <path d="M19 3V9H25" stroke="#666666" stroke-width="2"/>
                    </svg>`,
                    color: '#666666'
                };
        }
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
        const { icon } = this.getFileIcon(fileName);
        return (
            <div key={index} class="input-view">
                <div class="input-label">附件：</div>
                <div class="file-item" onClick={() => this.handleFileClick(fileUrl)}>
                    <div class="file-icon" innerHTML={icon}></div>
                    <div class="file-name">{fileName}</div>
                </div>
            </div>
        );
    }

    // 修改渲染输入数据的方法
    private renderInputs() {
        if (!this.message.inputs) return null;

        return (
            <div>
                {Object.keys(this.message.inputs).map((key, index) => {
                    const value = this.message.inputs[key];
                    if (value && !key.startsWith('hide_') && key !== 'answer') {
                        if (key === 'file_url') {
                            const fileName = this.getFileName(value);
                            return this.renderFileItem(fileName, value, index);
                        } else if (key === 'file_urls') {
                            const fileList = Array.isArray(value) ? value : value.split(',');
                            return (
                                <div key={index} class="file-list">
                                    {fileList.map((fileUrl, fileIndex) => {
                                        const fileName = this.getFileName(fileUrl);
                                        return this.renderFileItem(fileName, fileUrl, fileIndex);
                                    })}
                                </div>
                            );
                        } else if (key === 'job_info' || key === 'rule') {
                            return (
                                <div key={index} class="input-view">
                                    <div class="input-label">{key === 'job_info' ? '职位信息' : '评估规则'}</div>
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
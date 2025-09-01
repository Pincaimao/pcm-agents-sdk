import { Component, h, State, Element, Prop, Event, EventEmitter, Method } from "@stencil/core";
import { FileUploadResponse, FileUploadResponseWithState, FileUploadState, formatFileSize, uploadFileToBackend } from "../../utils/utils";
import { Message } from "../../services/message.service";
import { SentryReporter } from "../../utils/sentry-reporter";


export type UploadFailedEvent = {
    error: Error;
    message: string;
}

@Component({
    tag: 'pcm-upload',
    styleUrls: ['pcm-upload.css', '../../global/global.css', '../../global/host.css'],
    shadow: true,
})
export class PcmUpload {
    /**
     * 是否支持多文件上传
     */
    @Prop() multiple: boolean = false;
    /**
     * 是否开启移动端上传（仅PC端生效）
     */
    @Prop() mobileUploadAble: boolean = false;

    /**
     * 支持的文件后缀列表（需要带上小数点.）
     */
    @Prop() acceptFileSuffixList: string[] = [];
    /**
     * 最大文件数
     */
    @Prop() maxFileCount: number = Infinity;
    /**
     * 最大文件大小
     */
    @Prop() maxFileSize: number = Infinity;
    /**
     * 上传请求头
     */
    @Prop() uploadHeaders?: Record<string, any>;
    /**
     * 上传请求参数
     */
    @Prop() uploadParams?: Record<string, any>;
    /**
     * 上传失败监听
     */
    @Event() uploadFailed: EventEmitter<UploadFailedEvent>;
    /**
     * 上传文件变化监听
     */
    @Event() uploadChange: EventEmitter<FileUploadResponse[]>;


    @Element() hostElement: HTMLElement;
    @State() selectedFiles: FileUploadResponseWithState[] | null = null;

    @Method()
    async getIsUploading() {
        return !!this.selectedFiles?.some(item => item.state === FileUploadState.Uploading);
    }

    /**
     * 清除已选择的文件
     */
    @Method()
    async clearSelectedFiles() {
        this.selectedFiles = null;
        this.clearSelectedFile(); // 同时清除input的值
    }

    private handleUploadClick = () => {
        const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
        fileInput?.click();
    };

    private clearSelectedFile = () => {
        const fileInput = this.hostElement.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    private async uploadFile(file: File): Promise<FileUploadResponseWithState> {
        try {
            const result = await uploadFileToBackend(file, this.uploadHeaders || {}, this.uploadParams || {});
            return {
                ...result,
                file,
                file_name: file.name,
                file_size: file.size,
                state: FileUploadState.Success,
            }
        } catch (error) {
            this.clearSelectedFile();
            SentryReporter.captureError(error, {
                action: 'uploadFile',
                component: 'pcm-mnms-modal',
                title: '文件上传失败'
            });
            this.uploadFailed.emit({
                error: error,
                message: '文件上传失败，请重试'
            });
            return {
                file,
                error,
                state: FileUploadState.Failed,
            }
        }
    }

    private handleFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;

        if (this.multiple) {
            // 多选
            const files = Array.from(input.files || []);
            if (files.length === 0) return;

            // 验证文件数量限制
            const currentFileCount = this.selectedFiles?.length || 0;
            const remainingSlots = this.maxFileCount - currentFileCount;
            if (files.length > remainingSlots) {
                Message.info(`最多只能上传 ${this.maxFileCount} 个文件，当前已选择 ${currentFileCount} 个`);
                return;
            }

            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            // 验证每个文件
            files.forEach(file => {
                // 检测文件后缀名
                if (this.acceptFileSuffixList?.length) {
                    const suffix = '.' + file.name.split('.').pop()?.toLowerCase();
                    if (!this.acceptFileSuffixList.includes(suffix)) {
                        invalidFiles.push(`${file.name}(格式不支持)`);
                        return;
                    }
                }
                // 检测文件大小
                if (this.maxFileSize < file.size) {
                    invalidFiles.push(`${file.name}(文件过大)`);
                    return;
                }
                validFiles.push(file);
            });

            // 提示无效文件
            if (invalidFiles.length > 0) {
                const supportedFormats = this.acceptFileSuffixList?.length ? this.acceptFileSuffixList.join('、') : '';
                const maxSizeText = this.maxFileSize !== Infinity ? formatFileSize(this.maxFileSize) : '';
                Message.info(`以下文件无法上传：${invalidFiles.join('、')}。${supportedFormats ? `支持格式：${supportedFormats}。` : ''}${maxSizeText ? `最大文件大小：${maxSizeText}。` : ''}`);
            }

            if (validFiles.length === 0) {
                this.clearSelectedFile();
                return;
            }

            // 为有效文件创建初始状态
            const newFileItems: FileUploadResponseWithState[] = validFiles.map(file => ({
                file,
                file_name: file.name,
                file_size: file.size,
                state: FileUploadState.Uploading,
                cos_key: '',
                error: undefined,
            }));

            // 添加到现有文件列表
            this.selectedFiles = [
                ...(this.selectedFiles || []),
                ...newFileItems
            ];

            // 依次上传文件
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                const uploadResult = await this.uploadFile(file);

                // 更新对应文件的状态
                if (this.selectedFiles) {
                    const currentFileCount = this.selectedFiles.length;
                    const targetIndex = currentFileCount - validFiles.length + i;
                    if (targetIndex >= 0 && targetIndex < this.selectedFiles.length) {
                        this.selectedFiles[targetIndex] = uploadResult;
                        // 触发重新渲染
                        this.selectedFiles = [...this.selectedFiles];
                    }
                }
            }

            this.clearSelectedFile();
            this.emitUploadChange();
        } else {
            // 单选
            const file = input.files?.[0];
            if (!file) return;
            // 检测文件是否符合后缀名
            if (this.acceptFileSuffixList?.length) {
                const suffix = '.' + file.name.split('.').pop()?.toLowerCase();
                if (!this.acceptFileSuffixList.includes(suffix)) {
                    Message.info(`请上传 ${this.acceptFileSuffixList.join('、')} 格式的文件`);
                    return;
                }
            }
            // 检测文件大小是否超出限制
            if (this.maxFileSize < file.size) {
                Message.info(`文件大小不能超过 ${formatFileSize(this.maxFileSize) ?? '-'}`);
                return;
            }
            this.selectedFiles = [{
                file,
                file_name: file.name,
                file_size: file.size,
                state: FileUploadState.Uploading,
                cos_key: '',
                error: undefined,
            }];
            const uploadResult = await this.uploadFile(file);
            this.selectedFiles = [uploadResult];
            this.clearSelectedFile();
            this.emitUploadChange();
        }
    };

    private emitUploadChange = () => {
        this.uploadChange.emit(this.selectedFiles?.filter(item => item.state === FileUploadState.Success).map?.(item => ({
            cos_key: item.cos_key,
            file_name: item.file_name,
            file_size: item.file_size,
            ext: item.ext,
        })));
    }

    private uploadBtn() {
        return <div style={{ width: '100%' }}>
            {
                !!this.mobileUploadAble && <pcm-mobile-upload-btn
                    multiple={this.multiple}
                    acceptFileSuffixList={this.acceptFileSuffixList}
                    maxFileCount={this.maxFileCount}
                    maxFileSize={this.maxFileSize}
                    uploadHeaders={this.uploadHeaders}
                    uploadParams={this.uploadParams}
                    onOk={e => {
                        this.selectedFiles = [
                            ...(this.selectedFiles ?? []),
                            ...(e.detail ?? []).map(item => ({
                                ...item,
                                state: FileUploadState.Success,
                            }))
                        ]
                        this.emitUploadChange();
                    }}
                />
            }
            <div class="upload-placeholder" onClick={this.handleUploadClick}>
                <img src='https://pub.pincaimao.com/static/web/images/home/i_upload.png'></img>
                <p class='upload-text'>点击上传简历</p>
                {
                    !!this.acceptFileSuffixList?.length && <p class="upload-hint">支持 {this.acceptFileSuffixList.join('、')} 格式。</p>
                }
                {
                    !!this.maxFileSize && this.maxFileSize !== Infinity && <p class="upload-hint">文件大小不能超过 {formatFileSize(this.maxFileSize) ?? ''}。</p>
                }
                {
                    !!this.maxFileCount && this.maxFileCount !== Infinity && <p class="upload-hint">最多上传 {this.maxFileCount} 个文件。</p>
                }
            </div>
        </div>
    }

    render() {
        return (
            <div>
                <div class="resume-upload-section">
                    <div class="upload-area">
                        <div>
                            {
                                this.selectedFiles?.map?.((item, index) => {
                                    return <div class="file-item">
                                        <div class="file-item-content">
                                            <span class="file-icon">📝</span>
                                            <span class="file-name" style={item.state === FileUploadState.Failed ? { color: 'red', textDecoration: 'line-through' } : undefined}>{item?.file_name}</span>
                                            {
                                                item.state === FileUploadState.Failed && <span style={{ color: 'red', marginLeft: '4px' }}>({item.error?.message ?? '上传失败'})</span>
                                            }
                                        </div>
                                        <button class="remove-file" onClick={(e) => {
                                            e.stopPropagation();
                                            this.selectedFiles = this.selectedFiles?.filter((_, itemIndex) => index !== itemIndex);
                                            this.emitUploadChange();
                                        }}>×</button>
                                    </div>
                                })
                            }
                        </div>

                    </div>
                    {
                        this.multiple ? <div class="upload-actions">
                            {
                                (this.selectedFiles?.length ?? 0) < this.maxFileCount && this.uploadBtn()
                            }
                        </div> : <div class="upload-actions">
                            {
                                !this.selectedFiles?.length && this.uploadBtn()
                            }
                        </div>
                    }
                </div>
                <input
                    type="file"
                    class="file-input"
                    multiple={this.multiple}
                    onChange={this.handleFileChange}
                />
            </div>
        )
    }
}
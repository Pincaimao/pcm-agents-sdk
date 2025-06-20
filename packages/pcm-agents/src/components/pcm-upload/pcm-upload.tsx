import { Component, h, State, Element, Prop, Event, EventEmitter, Method } from "@stencil/core";
import { FileUploadResponse, FileUploadResponseWithState, FileUploadState, formatFileSize, uploadFileToBackend } from "../../utils/utils";
import { Message } from "../../services/message.service";
import { SentryReporter } from "../../utils/sentry-reporter";


@Component({
    tag: 'pcm-upload',
    styleUrls: ['pcm-upload.css', '../../global/global.css'],
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
     * label内容
     */
    @Prop() labelText: string = '上传文件'
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
        this.uploadChange.emit(this.selectedFiles?.map?.(item => ({
            cos_key: item.cos_key,
            file_name: item.file_name,
            file_size: item.file_size,
            ext: item.ext,
        })));
    }

    private uploadBtn() {
        return <div>
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
                <p class="upload-hint">
                    {
                        !!this.acceptFileSuffixList?.length && <p>支持 {this.acceptFileSuffixList.join('、')} 格式。</p>
                    }
                    {
                        !!this.maxFileSize && this.maxFileSize !== Infinity && <p>文件大小不能超过 {formatFileSize(this.maxFileSize) ?? ''}。</p>
                    }
                    {
                        !!this.maxFileCount && this.maxFileCount !== Infinity && <p>最多上传 {this.maxFileCount} 个文件。</p>
                    }
                </p>
            </div>
        </div>
    }

    render() {
        return (
            <div>
                <div class="resume-upload-section">
                    <label >{this.labelText}</label>
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
                                        }}>×</button>
                                    </div>
                                })
                            }
                        </div>
                        {
                            this.multiple ? <div>
                                {
                                    (this.selectedFiles?.length ?? 0) < this.maxFileCount && this.uploadBtn()
                                }
                            </div> : <div>
                                {
                                    !this.selectedFiles?.length && this.uploadBtn()
                                }
                            </div>
                        }
                    </div>
                </div>
                <input
                    type="file"
                    class="file-input"
                    onChange={this.handleFileChange}
                />
            </div>
        )
    }
}
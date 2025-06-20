import { Component, Prop, State, Event, h, EventEmitter } from "@stencil/core";
import { isMobile, sendHttpRequest, PCM_DOMAIN } from "../../utils/utils";
import uploadNumberSDK from "./uploadNumberSDK";
import { Message } from "../../services/message.service";
import { Byte, Encoder } from '@nuintun/qrcode'

@Component({
    tag: 'pcm-mobile-upload-btn',
    styleUrls: ['pcm-mobile-upload-btn.css', '../../global/global.css'],
    shadow: true,
})
export class MobileUploadBtn {
    /**
     * 是否支持多文件上传
     */
    @Prop() multiple: boolean = false;
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
    @State() QR_CODE_VALID_TIME: number = 0;
    @State() open: boolean = false;
    @State() mobileUrl: string = '';
    @State() setStartMobileUpload: boolean = false;
    @State() startMobileUploadLoading: boolean = false;
    @State() qrcodeStatus: 'active' | 'expired' | 'loading' | undefined = 'loading';
    @State() value: any[] = [];

    @Event() ok: EventEmitter<any[]>;

    private setStartMobileUploadWrapper = (e: boolean) => {
        uploadNumberSDK.isWorking = e;
        this.setStartMobileUpload = e;
    }

    @State() qrcodeUrl: string = '';
    private setMobileUrlWrapper = (e: string) => {
        this.mobileUrl = e;
        if (e) {
            const encoder = new Encoder();
            const qrcode = encoder.encode(new Byte(e));
            this.qrcodeUrl = qrcode.toDataURL();
        } else {
            this.qrcodeUrl = '';
        }
    }

    // 轮询流水号数据
    private pollingQueryNumberInfo = async (num: any) => {
        const res = await sendHttpRequest({
            url: `/sdk/v1/update_id/${num}/status`,
            method: 'get',
        });
        if (res?.success) {
            const resData: {
                update_id?: any;
                tags?: any;
                status?: any;
                file_list?: any;
                user_id?: any;
                cfg?: any;
                iat?: any;
                exp?: any;
            } = res.data ?? {};
            const { file_list } = resData;
            this.value = file_list ?? [];
        }
        if (uploadNumberSDK.isWorking) {
            setTimeout(() => {
                this.pollingQueryNumberInfo(num);
            }, 3000);
        }
    }

    private handleStartMobileUpload = async () => {
        const that = this;
        this.qrcodeStatus = 'loading';
        this.startMobileUploadLoading = true;
        const params = this.uploadParams ?? {};
        const reqData: {
            tags?: string[];
            cfg?: Record<string, any>;
            is_knowledge_doc?: boolean,
        } = {
            is_knowledge_doc: false,
            tags: params.tags,
            cfg: {
                maxSize: that.maxFileSize,
                maxCount: that.multiple ? that.maxFileCount : 1,
                fromUserName: '',
                fromUserId: '',
                customAccept: that.acceptFileSuffixList.join(','),
                upload: that.uploadParams,
            },
        }
        const res = await sendHttpRequest({
            url: `/sdk/v1/update_id`,
            method: 'post',
            data: reqData,
        });
        if (res?.success) {
            const resData: {
                update_id?: any;
                tags?: any;
                status?: any;
                file_list?: any;
                user_id?: any;
                cfg?: any;
                iat?: any;
                exp?: any;
                now?: any;
                custom_data?: any;
            } = res.data ?? {};
            uploadNumberSDK.number = resData.update_id;
            this.QR_CODE_VALID_TIME = Number(resData.exp) - Number(resData.now);
            const theMobileUrl = `${PCM_DOMAIN}/agents/uploadFileByCode?num=${uploadNumberSDK.number}`;
            this.setMobileUrlWrapper(theMobileUrl)
            this.setStartMobileUploadWrapper(true);
            this.qrcodeStatus = 'active';
            // 开启轮询
            this.pollingQueryNumberInfo(uploadNumberSDK.number);
        }
        this.startMobileUploadLoading = false;
    }

    // 取消手机上传
    @State() cancelLoading = false;
    private cancelMobileUpload = async () => {
        this.cancelLoading = true;
        await uploadNumberSDK.close({
            onError() {
                Message.info('取消失败');
            }
        })
        this.cancelLoading = false;
        this.QR_CODE_VALID_TIME = 0;
        this.setStartMobileUploadWrapper(false);
        this.setMobileUrlWrapper('');
        this.qrcodeStatus = 'expired';
        this.value = [];
        this.open = false;
    }

    // 删除文件
    private handleDelete = async (cos_key: any) => {
        const res = await sendHttpRequest({
            url: `/sdk/v1/update_id/${uploadNumberSDK.number}/file`,
            method: 'delete',
            params: {
                update_id: uploadNumberSDK.number,
                cos_key,
            }
        });
        if (res?.success) {
            this.value = this.value.filter(it => it.cos_key !== cos_key);
        }
    }


    render() {
        const mobile = isMobile();
        if (mobile) {
            return null
        } else {
            return (
                <div>
                    <div class="mobile-upload">
                        <div
                            class="btn btn-link"
                            onClick={() => {
                                if (this.maxFileCount < 1) {
                                    Message.info('文件数量已达到上限！');
                                    return;
                                }
                                this.open = true;
                                this.handleStartMobileUpload();
                            }}
                        >扫码上传</div>
                    </div>
                    {
                        this.open && <div class="mask">
                            <div class="upload-wrapper">
                                {
                                    this.setStartMobileUpload ? <div class="upload-box">
                                        <div class="qrcode-wrapper">
                                            {
                                                this.qrcodeStatus === 'active' && <img class="qrcode" src={this.qrcodeUrl} />
                                            }
                                            {
                                                this.qrcodeStatus === 'loading' && <span class="loading">加载中...</span>
                                            }
                                            {
                                                this.qrcodeStatus === 'expired' && <div
                                                    class="btn btn-link"
                                                    onClick={this.handleStartMobileUpload}
                                                >重新获取</div>
                                            }
                                        </div>
                                        <div class="time-expire">
                                            二维码有效期
                                            <span class="time-count-down">
                                                {
                                                    !!this.QR_CODE_VALID_TIME && <pcm-time-count-down
                                                        time={this.QR_CODE_VALID_TIME}
                                                        onFinished={() => {
                                                            this.qrcodeStatus = 'expired';
                                                        }}
                                                    />
                                                }
                                            </span>
                                        </div>
                                        <div class="alert-tip">
                                            上传过程中请不要关闭此弹窗
                                        </div>
                                        {
                                            this.qrcodeStatus === 'active' && <div
                                                style={{ marginTop: '12px', fontSize: '12px' }}
                                                class="btn btn-link"
                                                onClick={() => {
                                                    navigator.clipboard
                                                        .writeText(this.mobileUrl)
                                                        .then(() => {
                                                            Message.success("已复制到剪贴板");
                                                        })
                                                        .catch(() => {
                                                            Message.error("复制失败");
                                                        });
                                                }}
                                            >复制二维码地址</div>
                                        }
                                    </div> : (this.startMobileUploadLoading && <span class="loading">加载中...</span>)
                                }
                                {/* 上传文件列表 */}
                                <div style={{ marginTop: '12px' }}>
                                    {
                                        this.value?.map?.((item, index) => {
                                            return <div class="file-item" key={index}>
                                                <div class="file-item-content">
                                                    <span class="file-icon">📝</span>
                                                    <span class="file-name">{item?.file_name}</span>
                                                </div>
                                                <button class="remove-file" onClick={(e) => {
                                                    e.stopPropagation();
                                                    this.handleDelete(item.cos_key)
                                                }}>×</button>
                                            </div>
                                        })
                                    }
                                </div>
                                <div class="modal-footer">
                                    <div class="btn btn-default" onClick={this.cancelMobileUpload}>取消</div>
                                    <div class="btn btn-primary" onClick={() => {
                                        if (this.value.length > this.maxFileCount) {
                                            Message.info(`最多只能选择${this.maxFileCount}个文件，请删除多余文件!`);
                                            return;
                                        }
                                        this.ok.emit(this.value);
                                        this.cancelMobileUpload();
                                    }}>完成</div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            )
        }
    }
}
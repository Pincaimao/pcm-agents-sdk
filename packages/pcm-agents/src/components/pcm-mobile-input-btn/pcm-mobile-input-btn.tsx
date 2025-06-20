import { Component, Prop, State, Event, h, EventEmitter } from "@stencil/core";
import { Byte, Encoder } from '@nuintun/qrcode'
import { isMobile, sendHttpRequest, PCM_DOMAIN } from "../../utils/utils";
import { Message } from "../../services/message.service";
import uploadNumberSDK from "./uploadNumberSDK";

@Component({
    tag: 'pcm-mobile-input-btn',
    styleUrls: ['pcm-mobile-input-btn.css', '../../global/global.css'],
    shadow: true,
})
export class MobileUploadBtn {
    // 标题
    @Prop() name: string = '';
    /**
     * 最大文件数
     */
    @Prop() rows: number = 8;
    /**
     * 最大文件大小
     */
    @Prop() maxLength: number = undefined;
    /**
     * 填写请求头
     */
    @Prop() uploadHeaders?: Record<string, any>;
    /**
     * 填写请求参数
     */
    @Prop() uploadParams?: Record<string, any>;

    @State() QR_CODE_VALID_TIME: number = 0;
    @State() open: boolean = false;
    @State() mobileUrl: string = '';
    @State() setStartMobileUpload: boolean = false;
    @State() startMobileUploadLoading: boolean = false;
    @State() qrcodeStatus: 'active' | 'expired' | 'loading' | undefined = 'loading';
    @State() value: string = '';

    @Event() ok: EventEmitter<string>;

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
                custom_data?: any;
            } = res.data ?? {};
            const { custom_data } = resData;
            this.value = custom_data ?? '';
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
            cfg?: Record<string, any>;
        } = {
            cfg: {
                fromUserName: '',
                fromUserId: '',
                upload: that.uploadParams,
                name: that.name,
                rows: that.rows,
                maxLength: that.maxLength,
                params,
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
            } = res.data ?? {};
            uploadNumberSDK.number = resData.update_id;
            this.QR_CODE_VALID_TIME = Number(resData.exp) - Number(resData.now);
            const theMobileUrl = `${PCM_DOMAIN}/agents/inputByCode?num=${uploadNumberSDK.number}`;
            this.setMobileUrlWrapper(theMobileUrl)
            this.setStartMobileUploadWrapper(true);
            this.qrcodeStatus = 'active';
            // 开启轮询
            this.pollingQueryNumberInfo(uploadNumberSDK.number);
        }
        this.startMobileUploadLoading = false;
    }

    // 取消手机填写
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
        this.value = '';
        this.open = false;
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
                                this.open = true;
                                this.handleStartMobileUpload();
                            }}
                        >扫码填写</div>
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
                                            填写过程中请不要关闭此弹窗
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
                                {/* 填写文件列表 */}
                                <div style={{ marginTop: '12px' }}>
                                    {
                                        !!this.value?.length && <textarea
                                            readOnly
                                            class="qrcode-textarea"
                                            value={this.value}
                                            onChange={(e: any) => {
                                                this.value = e.target.value;
                                            }}
                                        />
                                    }
                                </div>
                                <div class="modal-footer">
                                    <div class="btn btn-default" onClick={this.cancelMobileUpload}>取消</div>
                                    <div class="btn btn-primary" onClick={() => {
                                        if (!this.value) {
                                            Message.info(`请输入内容`);
                                            return;
                                        }
                                        if (this.value.length > this.maxLength) {
                                            Message.info(`输入内容不能超过${this.maxLength}个字符`);
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
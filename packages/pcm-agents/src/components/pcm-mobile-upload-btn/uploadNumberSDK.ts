import { sendHttpRequest } from "../../utils/utils";

// 文件上传流水号SDK
const uploadNumberSDK = {
    number: '',
    isWorking: false,
    close: async function (params?: {
        onOk?: () => void;
        onError?: () => void;
    }) {
        const { onOk, onError } = params ?? {};
        const { number } = this;
        if (number) {
            const result = await sendHttpRequest({
                url: `/resource/update_id/${number}`,
                method: 'delete',
            });
            if (result.success) {
                this.number = '';
                onOk?.();
            } else {
                onError?.();
            }
        }
    }
}

export default uploadNumberSDK;
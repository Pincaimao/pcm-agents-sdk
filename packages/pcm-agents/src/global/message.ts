import { Message } from '../services/message.service';

// 将消息服务挂载到全局对象上
declare global {
  interface Window {
    PcmMessage: typeof Message;
  }
}

// 在浏览器环境中挂载到全局
if (typeof window !== 'undefined') {
  window.PcmMessage = Message;
}

export { Message }; 
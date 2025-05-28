import * as Sentry from "@sentry/browser";
import { configStore } from "../../store/config.store";

/**
 * Sentry事件上报工具类
 * 提供统一的错误上报接口，自动添加用户认证信息
 */
export class SentryReporter {

  /**
   * 捕获并上报错误
   * @param error 错误对象
   * @param context 错误上下文
   */
  static captureError(error: any, context?: Record<string, any> & { title?: string }): void {
    try {
      // 添加认证信息
      const CUser = configStore.getItem('pcm-sdk-CUser');
      if (CUser) {
        Sentry.setUser({ id: String(CUser) });
      }
      
      let finalError = error;
      
      // 如果提供了自定义标题，创建新的错误对象
      if (context?.title) {
        finalError = new Error(context.title);
        if (error?.stack) {
          finalError.stack = error.stack;
        }
        finalError.cause = error;
      }
      
      // 添加上下文
      if (context) {
        const { title, ...otherContext } = context;
        Sentry.setContext('error_context', otherContext);
      }
      
      // 上报错误
      Sentry.captureException(finalError);
    } catch (e) {
      console.error('Sentry 上报错误失败:', e);
    }
  }

  /**
   * 捕获并上报消息
   * @param message 消息内容
   * @param context 消息上下文
   */
  static captureMessage(message: string, context?: Record<string, any>): void {
    try {
      // 添加认证信息
      const CUser = configStore.getItem('pcm-sdk-CUser');
      if (CUser) {
        Sentry.setUser({ id: String(CUser) });
      }
      
      // 添加上下文
      if (context) {
        Sentry.setContext('message_context', context);
      }
      
      // 上报消息
      Sentry.captureMessage(message);
    } catch (e) {
      console.error('Sentry 上报消息失败:', e);
    }
  }

}
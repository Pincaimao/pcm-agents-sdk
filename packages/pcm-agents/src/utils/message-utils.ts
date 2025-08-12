/**
 * 消息提示工具函数
 */

/**
 * 显示消息提示
 * @param content 消息内容
 * @param type 消息类型
 * @param duration 显示时长，0表示不自动关闭
 */
export const showMessage = (
  content: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  duration: number = 3000
): void => {
  const messageEl = document.createElement('pcm-message') as any;
  messageEl.content = content;
  messageEl.type = type;
  messageEl.duration = duration;

  // 添加到页面顶部
  document.body.appendChild(messageEl);

  // 调用显示方法
  messageEl.show();
}; 
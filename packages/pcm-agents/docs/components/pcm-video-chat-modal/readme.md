
<!-- Auto Generated Below -->


## Properties

| Property               | Attribute                | Description                     | Type      | Default     |
| ---------------------- | ------------------------ | ------------------------------- | --------- | ----------- |
| `conversationId`       | `conversation-id`        | 会话ID，传入继续对话，否则创建新会话             | `string`  | `undefined` |
| `countdownWarningTime` | `countdown-warning-time` | 录制倒计时提醒时间（秒） 当剩余时间小于此值时，显示倒计时警告 | `number`  | `30`        |
| `defaultQuery`         | `default-query`          | 首次对话提问文本                        | `string`  | `'请您提问'`    |
| `displayContentStatus` | `display-content-status` | 是否显示题干内容 1: 显示题干内容 0: 不显示题干内容   | `string`  | `"1"`       |
| `enableVoice`          | `enable-voice`           | 是否自动播放语音问题                      | `boolean` | `true`      |
| `fullscreen`           | `fullscreen`             | 是否以全屏模式打开，移动端建议设置为true          | `boolean` | `false`     |
| `icon`                 | `icon`                   | 应用图标URL                         | `string`  | `undefined` |
| `isNeedClose`          | `is-need-close`          | 是否展示右上角的关闭按钮                    | `boolean` | `true`      |
| `isOpen`               | `is-open`                | 是否显示聊天模态框                       | `boolean` | `false`     |
| `isShowHeader`         | `is-show-header`         | 是否展示顶部标题栏                       | `boolean` | `true`      |
| `maxRecordingTime`     | `max-recording-time`     | 视频录制最大时长（秒）                     | `number`  | `120`       |
| `modalTitle`           | `modal-title`            | 模态框标题                           | `string`  | `'在线客服'`    |
| `resumeId`             | `resume-id`              | 父组件传入的 简历id                     | `string`  | `undefined` |
| `token` _(required)_   | `token`                  | SDK鉴权密钥                         | `string`  | `undefined` |
| `zIndex`               | `z-index`                | 聊天框的页面层级                        | `number`  | `1000`      |


## Events

| Event                   | Description | Type                                                                                                   |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `interviewComplete`     | 当面试完成时触发    | `CustomEvent<InterviewCompleteEventData>`                                                              |
| `modalClosed`           | 当点击模态框关闭时触发 | `CustomEvent<void>`                                                                                    |
| `recordingError`        | 录制错误事件      | `CustomEvent<{ type: string; message: string; details?: any; }>`                                       |
| `recordingStatusChange` | 录制状态变化事件    | `CustomEvent<{ status: "started" \| "stopped" \| "paused" \| "resumed" \| "failed"; details?: any; }>` |
| `streamComplete`        |             | `CustomEvent<StreamCompleteEventData>`                                                                 |


## Dependencies

### Depends on

- [pcm-chat-message](../pcm-chat-message)

### Graph
```mermaid
graph TD;
  pcm-video-chat-modal --> pcm-chat-message
  style pcm-video-chat-modal fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

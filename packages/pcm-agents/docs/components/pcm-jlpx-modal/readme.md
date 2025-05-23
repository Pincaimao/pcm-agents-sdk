
<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                   | Type                      | Default     |
| ---------------- | ----------------- | ----------------------------- | ------------------------- | ----------- |
| `conversationId` | `conversation-id` | 会话ID，传入继续对话，否则创建新会话           | `string`                  | `undefined` |
| `customInputs`   | --                | 自定义输入参数，传入job_info时，会隐藏JD输入区域 | `{ [key: string]: any; }` | `{}`        |
| `defaultQuery`   | `default-query`   | 默认查询文本                        | `string`                  | `''`        |
| `fullscreen`     | `fullscreen`      | 是否以全屏模式打开，移动端建议设置为true        | `boolean`                 | `false`     |
| `icon`           | `icon`            | 应用图标URL                       | `string`                  | `undefined` |
| `isNeedClose`    | `is-need-close`   | 是否展示右上角的关闭按钮                  | `boolean`                 | `true`      |
| `isOpen`         | `is-open`         | 是否显示聊天模态框                     | `boolean`                 | `false`     |
| `isShowHeader`   | `is-show-header`  | 是否展示顶部标题栏                     | `boolean`                 | `true`      |
| `modalTitle`     | `modal-title`     | 模态框标题                         | `string`                  | `'简历剖析助手'`  |
| `token`          | `token`           | API鉴权密钥                       | `string`                  | `''`        |
| `zIndex`         | `z-index`         | 聊天框的页面层级                      | `number`                  | `1000`      |


## Events

| Event               | Description             | Type                                                                                       |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `apiKeyInvalid`     | API密钥验证失败事件             | `CustomEvent<void>`                                                                        |
| `conversationStart` | 新会话开始的回调，只会在一轮对话开始时触发一次 | `CustomEvent<{ conversation_id: string; event: string; message_id: string; id: string; }>` |
| `interviewComplete` | 当聊天完成时触发                | `CustomEvent<{ conversation_id: string; total_questions: number; }>`                       |
| `modalClosed`       | 当点击模态框关闭时触发             | `CustomEvent<void>`                                                                        |
| `streamComplete`    | 流式输出完成事件                | `CustomEvent<{ conversation_id: string; event: string; message_id: string; id: string; }>` |
| `uploadSuccess`     | 上传成功事件                  | `CustomEvent<FileUploadResponse>`                                                          |


## Dependencies

### Depends on

- [pcm-app-chat-modal](../pcm-app-chat-modal)

### Graph
```mermaid
graph TD;
  pcm-jlpx-modal --> pcm-app-chat-modal
  pcm-app-chat-modal --> pcm-chat-message
  style pcm-jlpx-modal fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

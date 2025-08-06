
<!-- Auto Generated Below -->


## Properties

| Property             | Attribute           | Description                                 | Type                   | Default      |
| -------------------- | ------------------- | ------------------------------------------- | ---------------------- | ------------ |
| `defaultQuery`       | `default-query`     | 默认查询文本                                      | `string`               | `'根据对话生成简历'` |
| `filePreviewMode`    | `file-preview-mode` | 附件预览模式 'drawer': 在右侧抽屉中预览 'window': 在新窗口中打开 | `"drawer" \| "window"` | `'window'`   |
| `fullscreen`         | `fullscreen`        | 是否以全屏模式打开，移动端建议设置为true                      | `boolean`              | `false`      |
| `icon`               | `icon`              | 应用图标URL                                     | `string`               | `undefined`  |
| `isNeedClose`        | `is-need-close`     | 是否展示右上角的关闭按钮                                | `boolean`              | `true`       |
| `isOpen`             | `is-open`           | 是否显示聊天模态框                                   | `boolean`              | `false`      |
| `isShowHeader`       | `is-show-header`    | 是否展示顶部标题栏                                   | `boolean`              | `true`       |
| `modalTitle`         | `modal-title`       | 模态框标题                                       | `string`               | `'简历制作'`     |
| `token` _(required)_ | `token`             | SDK鉴权密钥                                     | `string`               | `undefined`  |
| `zIndex`             | `z-index`           | 聊天框的页面层级                                    | `number`               | `1000`       |


## Events

| Event               | Description                 | Type                                      |
| ------------------- | --------------------------- | ----------------------------------------- |
| `conversationStart` | 新会话开始的回调，只会在一轮对话开始时触发一次     | `CustomEvent<ConversationStartEventData>` |
| `getResumeData`     | 获取简历数据事件（用户点击导出简历json数据后触发） | `CustomEvent<any>`                        |
| `modalClosed`       | 当点击模态框关闭时触发                 | `CustomEvent<void>`                       |
| `someErrorEvent`    | 错误事件                        | `CustomEvent<ErrorEventDetail>`           |
| `streamComplete`    | 流式输出完成事件                    | `CustomEvent<StreamCompleteEventData>`    |
| `tokenInvalid`      | SDK密钥验证失败事件                 | `CustomEvent<void>`                       |
| `uploadSuccess`     | 上传成功事件                      | `CustomEvent<FileUploadResponse>`         |


## Dependencies

### Depends on

- [pcm-app-chat-modal](../pcm-app-chat-modal)

### Graph
```mermaid
graph TD;
  pcm-jlzz-modal --> pcm-app-chat-modal
  pcm-app-chat-modal --> pcm-chat-message
  pcm-app-chat-modal --> pcm-digital-human
  pcm-app-chat-modal --> pcm-drawer
  pcm-app-chat-modal --> pcm-confirm-modal
  style pcm-jlzz-modal fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*


<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description            | Type      | Default     |
| ---------------- | ----------------- | ---------------------- | --------- | ----------- |
| `apiKey`         | `api-key`         | API鉴权密钥                | `string`  | `''`        |
| `botId`          | `bot-id`          | 机器人ID                  | `string`  | `undefined` |
| `conversationId` | `conversation-id` | 会话ID，传入继续对话，否则创建新会话    | `string`  | `undefined` |
| `defaultQuery`   | `default-query`   | 默认查询文本                 | `string`  | `''`        |
| `fullscreen`     | `fullscreen`      | 是否以全屏模式打开，移动端建议设置为true | `boolean` | `false`     |
| `icon`           | `icon`            | 应用图标URL                | `string`  | `undefined` |
| `isNeedClose`    | `is-need-close`   | 是否展示右上角的关闭按钮           | `boolean` | `true`      |
| `isOpen`         | `is-open`         | 是否显示聊天模态框              | `boolean` | `false`     |
| `isShowHeader`   | `is-show-header`  | 是否展示顶部标题栏              | `boolean` | `true`      |
| `modalTitle`     | `modal-title`     | 模态框标题                  | `string`  | `'在线客服'`    |
| `zIndex`         | `z-index`         | 聊天框的页面层级               | `number`  | `1000`      |


## Events

| Event            | Description | Type                                   |
| ---------------- | ----------- | -------------------------------------- |
| `messageSent`    | 当发送消息时触发    | `CustomEvent<string>`                  |
| `modalClosed`    | 点击模态框关闭时触发  | `CustomEvent<void>`                    |
| `streamComplete` |             | `CustomEvent<StreamCompleteEventData>` |


## Dependencies

### Depends on

- [pcm-chat-message](../pcm-chat-message)

### Graph
```mermaid
graph TD;
  pcm-chat-modal --> pcm-chat-message
  style pcm-chat-modal fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

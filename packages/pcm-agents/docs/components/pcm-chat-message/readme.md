
<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type          | Default     |
| --------- | --------- | ----------- | ------------- | ----------- |
| `message` | --        | 消息数据        | `ChatMessage` | `undefined` |


## Events

| Event           | Description | Type                                                                                                                                                                                                                       |
| --------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageChange` | 消息变更事件      | `CustomEvent<{ id?: string; query?: string; answer?: string; time?: string; conversation_id?: string; isStreaming?: boolean; bot_id?: string; inputs?: Record<string, any>; status?: "error" \| "normal"; error?: any; }>` |


## Dependencies

### Used by

 - [pcm-chat-modal](../pcm-chat-modal)
 - [pcm-hr-chat-modal](../pcm-hr-chat-modal)

### Graph
```mermaid
graph TD;
  pcm-chat-modal --> pcm-chat-message
  pcm-hr-chat-modal --> pcm-chat-message
  style pcm-chat-message fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

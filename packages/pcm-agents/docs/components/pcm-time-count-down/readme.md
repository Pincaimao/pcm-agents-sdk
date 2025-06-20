
<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `time`   | `time`    | 倒计时总秒数      | `number` | `undefined` |


## Events

| Event      | Description | Type               |
| ---------- | ----------- | ------------------ |
| `finished` | 倒计时结束事件     | `CustomEvent<any>` |


## Dependencies

### Used by

 - [pcm-mobile-input-btn](../pcm-mobile-input-btn)
 - [pcm-mobile-upload-btn](../pcm-mobile-upload-btn)

### Graph
```mermaid
graph TD;
  pcm-mobile-input-btn --> pcm-time-count-down
  pcm-mobile-upload-btn --> pcm-time-count-down
  style pcm-time-count-down fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*


<!-- Auto Generated Below -->


## Overview

智能体卡片组件
用于展示各业务功能入口，点击后根据回调打开对应的模态框

## Properties

| Property             | Attribute           | Description | Type      | Default     |
| -------------------- | ------------------- | ----------- | --------- | ----------- |
| `author`             | `author`            | 自定义作者名称     | `string`  | `''`        |
| `authorAvatarUrl`    | `author-avatar-url` | 自定义作者头像URL  | `string`  | `''`        |
| `botId`              | `bot-id`            | 智能体ID       | `string`  | `''`        |
| `cardTitle`          | `card-title`        | 自定义卡片标题     | `string`  | `''`        |
| `customChatTag`      | `custom-chat-tag`   | 自定义右侧标签     | `string`  | `''`        |
| `description`        | `description`       | 自定义卡片描述     | `string`  | `''`        |
| `iconUrl`            | `icon-url`          | 自定义卡片图标URL  | `string`  | `''`        |
| `showChatTag`        | `show-chat-tag`     | 是否显示右侧对话标签  | `boolean` | `false`     |
| `token` _(required)_ | `token`             | SDK鉴权密钥     | `string`  | `undefined` |
| `useButtonText`      | `use-button-text`   | 自定义立即使用按钮文本 | `string`  | `'立即使用'`    |


## Events

| Event          | Description | Type                |
| -------------- | ----------- | ------------------- |
| `tokenInvalid` | SDK密钥验证失败事件 | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

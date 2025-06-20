
<!-- Auto Generated Below -->


## Properties

| Property               | Attribute                 | Description         | Type                    | Default     |
| ---------------------- | ------------------------- | ------------------- | ----------------------- | ----------- |
| `acceptFileSuffixList` | `accept-file-suffix-list` | 支持的文件后缀列表（需要带上小数点.） | `string[]`              | `[]`        |
| `maxFileCount`         | `max-file-count`          | 最大文件数               | `number`                | `Infinity`  |
| `maxFileSize`          | `max-file-size`           | 最大文件大小              | `number`                | `Infinity`  |
| `multiple`             | `multiple`                | 是否支持多文件上传           | `boolean`               | `false`     |
| `uploadHeaders`        | `upload-headers`          | 上传请求头               | `{ [x: string]: any; }` | `undefined` |
| `uploadParams`         | `upload-params`           | 上传请求参数              | `{ [x: string]: any; }` | `undefined` |


## Events

| Event | Description | Type                 |
| ----- | ----------- | -------------------- |
| `ok`  |             | `CustomEvent<any[]>` |


## Dependencies

### Used by

 - [pcm-upload](../pcm-upload)

### Depends on

- [pcm-time-count-down](../pcm-time-count-down)

### Graph
```mermaid
graph TD;
  pcm-mobile-upload-btn --> pcm-time-count-down
  pcm-upload --> pcm-mobile-upload-btn
  style pcm-mobile-upload-btn fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

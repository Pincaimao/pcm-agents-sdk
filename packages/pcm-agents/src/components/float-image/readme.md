# float-image

一个显示在右下角的浮动图片组件，类似于客服浮窗效果。

## 使用方法

```html
<float-image 
  src="path/to/image.jpg" 
  alt="客服" 
  width="80px" 
  height="80px">
</float-image>

<script>
  // 监听点击事件
  document.querySelector('float-image').addEventListener('floatImageClick', () => {
    console.log('浮窗图片被点击了！');
    // 在这里添加您的处理逻辑
  });
</script>
```


<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `alt`    | `alt`     | 图片的替代文本     | `string` | `'浮窗图片'`    |
| `height` | `height`  | 图片的高度       | `string` | `'60px'`    |
| `src`    | `src`     | 图片的URL地址    | `string` | `undefined` |
| `width`  | `width`   | 图片的宽度       | `string` | `'60px'`    |


## Events

| Event             | Description | Type                |
| ----------------- | ----------- | ------------------- |
| `floatImageClick` | 点击图片时触发的事件  | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*

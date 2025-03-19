## 设置

### 项目结构

[文档](https://stenciljs.com/docs/react)

对带有组件包装器的组件库使用[monorepo](https://www.toptal.com/front-end/guide-to-monorepos)结构。您的项目工作区应包含您的 Stencil 组件库和生成的 React 组件包装器的库。

示例项目设置可能类似于：

```text
top-most-directory/
└── packages/
    ├── pcm-agents/
    │   ├── stencil.config.js
    │   └── src/components/
    └── pcm-agents-react/
        └── src/
            ├── components/
            └── index.ts
```



### html中使用



```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script type="module" src="https://unpkg.com/pcm-agents"></script>
</head>
<body>
    <float-image 
    id="test-float-image"
    src="https://picsum.photos/200" 
    alt="示例图片" 
    width="80" 
    height="80">
  </float-image>
</body>
</html>
```





### react中使用

下载`pcm-agents`和`pcm-agents-react`



```react
import './App.css';
import { FloatImage } from 'pcm-agents-react';

function App() {
  return (
    <div className="App">
      <FloatImage 
        id="test-float-image"
        src="https://picsum.photos/200" 
        alt="客服图片" 
        width="80" 
        height="80">
    </FloatImage>
    </div>
  );
}

export default App;

```

### Vue中使用

导入`pcm-agents`和`pcm-agents-vue`



main.ts
```js
import { defineCustomElements } from 'pcm-agents/loader';
defineCustomElements();
```



app.vue

```vue
import { FloatImage } from 'pcm-agents-vue';
<FloatImage 
            id="test-float-image"
            src="https://picsum.photos/200" 
            alt="客服图片" 
            width="80" 
            height="80">
</FloatImage>
```

### vue2中使用


index.html
```html
<script type="module" src="https://unpkg.com/pcm-agents"></script>
```

```vue
<float-image 
    id="test-float-image"
    src="https://picsum.photos/200" 
    alt="示例图片" 
    width="40" 
    height="40">
  </float-image>
```
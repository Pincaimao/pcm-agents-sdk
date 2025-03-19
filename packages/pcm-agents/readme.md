[![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)](https://stenciljs.com)

# Stencil 组件启动器

> 这是一个用于使用 Stencil 构建独立 Web 组件的启动项目。

Stencil 是一个用于构建快速 Web 应用程序的 Web 组件编译器。

Stencil 将最流行的前端框架的最佳概念结合到一个编译时而非运行时工具中。Stencil 采用 TypeScript、JSX、一个微型虚拟 DOM 层、高效的单向数据绑定、异步渲染管道（类似于 React Fiber）以及开箱即用的懒加载，并生成 100% 基于标准的 Web 组件，可在任何支持 Custom Elements 规范的浏览器中运行。

Stencil 组件只是 Web 组件，因此它们可以在任何主要框架中工作，或者完全不使用框架。

## 创建新组件的步骤

在 Stencil 中创建新组件需要遵循以下步骤：

### 1. 创建组件文件夹

在 `src/components` 目录下创建一个新的文件夹，文件夹名称应该与组件名称相匹配。例如，对于 `pcm-chat-modal` 组件，创建 `src/components/pcm-chat-modal` 文件夹。

### 2. 创建组件主文件

在组件文件夹中创建一个 TypeScript 文件，命名为 `组件名.tsx`。例如：`pcm-chat-modal.tsx`。

这个文件应该包含组件的主要逻辑和结构：

```typescript
import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'pcm-chat-modal', // 这将是在 HTML 中使用的标签名
  styleUrl: 'pcm-chat-modal.css', // 指向组件的样式文件
  shadow: true, // 启用 Shadow DOM
})
export class PcmChatModal {
  // 使用 @Prop 装饰器定义组件的属性
  @Prop() src: string;
  @Prop() alt: string = '默认值';

  // 组件的渲染方法
  render() {
    return (
      <div>
        <img src={this.src} alt={this.alt} />
      </div>
    );
  }
}
```

### 3. 创建样式文件

创建一个 CSS 文件，命名为 `组件名.css`。例如：`pcm-chat-modal.css`。

```css
:host {
  display: block;
}

/* 组件的其他样式 */
```

### 4. 创建测试文件

为组件创建单元测试和端到端测试文件：

- 单元测试：`组件名.spec.ts`（例如：`pcm-chat-modal.spec.ts`）
- 端到端测试：`组件名.e2e.ts`（例如：`pcm-chat-modal.e2e.ts`）

### 5. 创建自述文件（可选）

创建一个 `readme.md` 文件，描述组件的用法和属性。Stencil 会自动更新这个文件中的属性表格。

### 6. 构建和测试

运行以下命令来构建和测试你的组件：

```bash
npm run build
npm test
```

### 7. 在应用中使用

构建成功后，你可以在 HTML 中使用你的组件：

```html
<pcm-chat-modal src="path/to/image.jpg" alt="描述文本"></pcm-chat-modal>
```

### 8. 测试你的组件

要测试你的组件，可以按照以下步骤操作：

#### 8.1 在 index.html 中添加组件实例

修改 `src/index.html` 文件，添加你的组件实例：

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0">
  <title>Stencil Component Starter</title>

  <script type="module" src="/build/mycomponent.esm.js"></script>
  <script nomodule src="/build/mycomponent.js"></script>
</head>
<body>
  <!-- 添加你的组件实例，使用可访问的图片URL -->
  <pcm-chat-modal 
    src="https://via.placeholder.com/150" 
    alt="客服图片" 
    width="80px" 
    height="80px">
  </pcm-chat-modal>
  
  <!-- 测试点击事件 -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // 给组件一些时间来加载
        const PcmChatModal = document.querySelector('pcm-chat-modal');
        if (PcmChatModal) {
          // 监听点击事件
          PcmChatModal.addEventListener('PcmChatModalClick', function() {
            alert('浮窗图片被点击了！');
          });
        }
    });
  </script>
</body>
</html>
```

#### 8.2 确保组件类型定义已生成

如果你的组件没有显示，可能是因为 `components.d.ts` 文件中没有包含你的组件的类型定义。解决方法：

1. 运行构建命令重新生成类型定义：
   ```bash
   npm run build
   ```

2. 如果问题仍然存在，检查 `src/components.d.ts` 文件，确保其中包含你的组件定义。它应该类似于：
   ```typescript
   /* ... 其他导入 ... */
   
   declare namespace Components {
     /* ... 其他组件 ... */
     
     interface PcmChatModal {
       /**
        * 图片的替代文本
        */
       "alt": string;
       /**
        * 图片的高度
        */
       "height": string;
       /**
        * 点击图片时的回调函数
        */
       "onClick": () => void;
       /**
        * 图片的URL地址
        */
       "src": string;
       /**
        * 图片的宽度
        */
       "width": string;
     }
   }
   
   /* ... 其他声明 ... */
   ```

#### 8.3 启动开发服务器

运行开发服务器来查看你的组件：

```bash
npm start
```

这将启动一个本地开发服务器，通常在 `http://localhost:3333` 上。在浏览器中打开此地址，你应该能看到你的浮窗图片组件显示在页面的右下角。

#### 8.4 调试常见问题

如果组件没有正确显示：

1. 检查浏览器控制台是否有错误信息
2. 确认组件的 CSS 样式是否正确加载
3. 验证图片 URL 是否有效
4. 尝试添加一些临时样式来确认组件是否已渲染：
   ```html
   <style>
     pcm-chat-modal {
       border: 2px solid red;
     }
   </style>
   ```

## 组件文件结构示例

以下是一个完整的组件文件结构示例：

```
src/components/pcm-chat-modal/
├── pcm-chat-modal.tsx      # 组件主文件
├── pcm-chat-modal.css      # 样式文件
├── pcm-chat-modal.spec.ts  # 单元测试
├── pcm-chat-modal.e2e.ts   # 端到端测试
└── readme.md            # 组件文档
```

## 入门指南

运行:

```bash
npm install
npm start
```

要为生产环境构建组件，运行:

```bash
npm run build
```

要运行组件的单元测试，运行:

```bash
npm test
```

 需要帮助？请查看我们的文档 [这里](https://stenciljs.com/docs/my-first-component)。

##  命名组件 

在创建新的组件标签时，我们建议_不要_在组件名称中使用 `stencil`（例如：` <stencil-datepicker> `）。这是因为生成的组件与 Stencil 几乎没有关系；它只是一个 Web 组件！

相反，使用适合您公司的前缀或相关组件组的任何名称。例如，所有 [Ionic 生成的](https://ionicframework.com/) Web 组件都使用前缀 `ion`。

##  使用此组件 

我们推荐两种策略来使用用 Stencil 构建的 Web 组件。

这两种策略的第一步都是 [发布到 NPM](https://docs.npmjs.com/getting-started/publishing-npm-packages)。

您可以在 [Stencil 文档](https://stenciljs.com/docs/publishing) 中阅读有关这些不同方法的更多信息。

###  懒加载 

如果您的 Stencil 项目是使用 [`dist`](https://stenciljs.com/docs/distribution) 输出目标构建的，您可以导入一个小型引导脚本，它会注册所有组件并允许您懒加载单个组件脚本。

例如，假设您的 Stencil 项目命名空间称为 `my-design-system`，要在任何网站上使用 `my-component`，请将此内容注入到您的 HTML 中：

```html
<script type="module" src="https://unpkg.com/my-design-system"></script>
<!--
为避免 unpkg.com 重定向到实际文件，您也可以直接导入：
https://unpkg.com/foobar-design-system@0.0.1/dist/foobar-design-system/foobar-design-system.esm.js
-->
<my-component first="Stencil" middle="'Don't call me a framework'" last="JS"></my-component>
```

这将只加载渲染 `` 所需的必要脚本。一旦使用了此包的更多组件，它们将自动被懒加载。

您也可以在应用程序入口文件中将脚本作为 `node_modules` 的一部分导入：

```tsx
import 'foobar-design-system/dist/foobar-design-system/foobar-design-system.esm.js';
```

 查看此 [在线演示](https://stackblitz.com/edit/vitejs-vite-y6v26a?file=src%2Fmain.tsx)。 

###  独立使用 

如果您正在使用带有 `dist-custom-elements` 的 Stencil 组件库，我们建议在需要的文件中单独导入 Stencil 组件。

要将 Stencil 组件导出为独立组件，请确保您在 `stencil.config.ts` 中定义了 [`dist-custom-elements`](https://stenciljs.com/docs/custom-elements) 输出目标。

例如，假设您想将 `` 作为 React 组件的一部分使用，您可以通过以下方式直接导入组件：

```tsx
import 'foobar-design-system/my-component';

function App() {
  return (
    <>
      <div>
        <my-component
          first="Stencil"
          middle="'Don't call me a framework'"
          last="JS"
        ></my-component>
      </div>
    </>
  );
}

export default App;
```

 查看此 [在线演示](https://stackblitz.com/edit/vitejs-vite-b6zuds?file=src%2FApp.tsx)。 
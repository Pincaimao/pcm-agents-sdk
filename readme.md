## 设置

### 项目结构

[文档](https://stenciljs.com/docs/react)

对带有组件包装器的组件库使用[monorepo](https://www.toptal.com/front-end/guide-to-monorepos)结构。您的项目工作区应包含您的 Stencil 组件库和生成的 React 组件包装器的库。

示例项目设置可能类似于：

```text
top-most-directory/
└── packages/
    ├── stencil-library/
    │   ├── stencil.config.js
    │   └── src/components/
    └── react-library/
        └── src/
            ├── components/
            └── index.ts
```


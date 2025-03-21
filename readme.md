## 设置

项目使用pnpm

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
    <pcm-chat-modal 
      bot-id="3022316191018873"
      id="pcm-chat-modal" 
      modal-title="在线客服" 
      icon="https://www.ylzhaopin.com/Public/Newhome/images/sidebar/tochat.png"
      conversation-id=""
    ></pcm-chat-modal>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM 已加载，正在设置事件监听器...');
        
        // 聊天模态框事件监听
        const chatModal = document.getElementById('pcm-chat-modal');
        if (chatModal) {
          chatModal.addEventListener('messageSent', function(event) {
            console.log('发送消息:', event.detail);
          });
          
          chatModal.addEventListener('modalClosed', function() {
            console.log('聊天窗口已关闭');
          });

          // 添加 streamComplete 事件监听
          chatModal.addEventListener('streamComplete', function(event) {
            console.log('流式响应完成:', event.detail);
            // 更新 conversation_id
            chatModal.setAttribute('conversation-id', event.detail.conversation_id);
          });
        }

        // 打开聊天按钮事件监听
        const openChatButton = document.getElementById('open-chat');
        if (openChatButton && chatModal) {
          openChatButton.addEventListener('click', function() {
            chatModal.isOpen = true;
          });
        }
      });
    </script>
</body>
</html>
```





### react中使用

下载`pcm-agents`和`pcm-agents-react`



```react
import './App.css';
import { PcmChatModal } from 'pcm-agents-react';

function App() {
  return (
    <div className="App">
      <PcmChatModal 
        id="test-pcm-chat-modal"
        modalTitle="在线客服"
        src="https://picsum.photos/200" 
        alt="客服图片" 
        width="80" 
        height="80">
      </PcmChatModal>
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
import { PcmChatModal } from 'pcm-agents-vue';
<PcmChatModal 
            id="test-pcm-chat-modal"
            src="https://picsum.photos/200" 
            alt="客服图片" 
            width="80" 
            height="80">
</PcmChatModal>
```

### vue2中使用


index.html
```html
<script type="module" src="https://unpkg.com/pcm-agents"></script>
```

```vue
<pcm-chat-modal 
    id="test-pcm-chat-modal"
    modal-title="在线客服"
    src="https://picsum.photos/200" 
    alt="示例图片" 
    width="40" 
    height="40">
</pcm-chat-modal>
```
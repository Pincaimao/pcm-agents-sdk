## 🙏 Acknowledgements | 致谢

We would like to thank the following organizations for their support:
我们要感谢以下组织的支持：

<p align="center">
  <a href="https://www.jetbrains.com/?from=pincaimao" target="_blank">
    <img width="100" height="100" alt="JetBrains" src="https://github.com/user-attachments/assets/d68a03c9-2640-4643-8914-78ff3f73b165" />

  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://www.terminus.com/?from=pincaimao" target="_blank">
    <img width="100" height="100" alt="Termius" src="https://github.com/user-attachments/assets/6def2c6d-f7be-4ca8-b970-13099fb3449b" />
  </a>
</p>

<p align="center">
  <b>JetBrains</b> | Thanks for providing professional development tools
  感谢提供专业开发工具<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <b>Terminus</b> | Thanks for the powerful SSH clients support
  感谢强大 SSH 客户端支持<br/>
</p>

## 设置

### 项目结构

[框架文档](https://stenciljs.com/docs/react)

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


## 推送npm包

执行

```bash
npm run upload
```



## 使用示例

此文档以模拟面试智能体SDK为示例，调用时请自行修改成对应组件

组件相关文档请[点击](./packages/pcm-agents/docs/components)


### 完整示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>模拟面试</title>
  <script type="module" src="https://pub.pincaimao.com/sdk/js/pcm-agents@latest/dist/pcm-agents/pcm-agents.esm.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .demo-controls {
      margin: 20px;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
    }
    button {
      padding: 8px 16px;
      background-color: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="demo-controls">
    <h2>模拟面试助手</h2>
    <p>上传您的简历，获取针对性的面试模拟体验</p>
    <button id="open-chat">开始模拟面试</button>
  </div>

  <pcm-mnms-modal 
    id="pcm-mnms-modal" 
    token="app-fc0r90cHmzmcjK2vwXRKc7pc"
    modal-title="模拟面试" 
    icon="https://example.com/icon.jpg"
    conversation-id=""
    fullscreen="true"
    require-resume="true"
    enable-voice="false"
    interview-mode="text"
    default-query="请您提问"
  ></pcm-mnms-modal>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // 获取元素引用
      const chatModal = document.getElementById('pcm-mnms-modal');
      const openChatButton = document.getElementById('open-chat');
      
      // 打开聊天窗口
      openChatButton.addEventListener('click', function() {
        chatModal.isOpen = true;
      });
      
      // 注册事件监听
      chatModal.addEventListener('modalClosed', function() {
        console.log('聊天窗口已关闭');
      });
      
      chatModal.addEventListener('uploadSuccess', function(event) {
        console.log('文件上传成功:', event.detail);
      });
      
      chatModal.addEventListener('streamComplete', function(event) {
        console.log('流式响应完成:', event.detail);
        chatModal.setAttribute('conversation-id', event.detail.conversation_id);
      });
      
      chatModal.addEventListener('conversationStart', function(event) {
        console.log('会话开始:', event.detail);
      });
      
      chatModal.addEventListener('interviewComplete', function(event) {
        console.log('面试完成:', event.detail);
        chatModal.isOpen = false;
        alert('模拟面试已完成，感谢您的参与！');
      });
      
      // 设置自定义输入参数
      chatModal.customInputs = {
        job_info: "对接商家和用户,负责B端活动的策划落地以及C端客户的引流；负责产品的上下架,以及线下活动的开展；负责C端产品的线上线下的引流推广"
      };
    });
  </script>
</body>
</html>
```

### 安装与引入

此模块仅演示框架使用方式，具体使用请查看完整示例

#### 通过 CDN 引入

```html
<script type="module" src="https://pub.pincaimao.com/sdk/js/pcm-agents@latest/dist/pcm-agents/pcm-agents.esm.js"></script>
```

```html
<pcm-mnms-modal id="pcm-mnms-modal"
    token="eyJhbGciOiJ...N0"
    modal-title="模拟面试" 
    icon="https://pub.pincaimao.com/static/common/i_pcm_logo.png" 
    conversation-id=""
    fullscreen="false" 
    enable-voice="false" 
    interview-mode="text"
    default-query="请您提问">
  </pcm-mnms-modal>
```



#### react中使用

demo：https://github.com/Pincaimao/pcm-agents-sdk-react-demo

下载并导入 pcm-agents 和 pcm-agents-react，具体组件属性请查看智能体文档，这里只演示框架使用形式： 

```react
import { useState } from 'react';
import { PcmMnmsModal } from 'pcm-agents-react';

function App() {
  // 使用state控制模态框的开关状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 打开模态框
  const openModal = () => setIsModalOpen(true);
  
  // 关闭模态框
  const closeModal = () => setIsModalOpen(false);
  
  return (
    <div className="App">
      <button onClick={openModal}>开始模拟面试</button>
      
      <PcmMnmsModal 
        token="app-fc0r90cHmzmcjK2vwXRKc7pc"
        modalTitle="模拟面试"
        fullscreen={true}
        requireResume={true}
        isOpen={isModalOpen}
        onModalClosed={closeModal}
      />
    </div>
  );
}

export default App;
```



#### vue中使用

demo：https://github.com/Pincaimao/pcm-agents-sdk-vue3-demo

下载并导入 pcm-agents 和 pcm-agents-vue，具体组件属性请查看智能体文档，这里只演示框架使用形式： 



main.ts
```js
import { defineCustomElements } from 'pcm-agents/loader';
defineCustomElements();
```



app.vue

```vue
<template>
  <div>
    <button @click="openModal">开始模拟面试</button>
    
    <PcmMnmsModal 
      :token="token"
      :modal-title="modalTitle"
      :fullscreen="fullscreen"
      :is-open="isModalOpen"
      @modalClosed="handleModalClosed"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { PcmMnmsModal } from 'pcm-agents-vue';

const token = 'app-fc0r90cHmzmcjK2vwXRKc7pc';
const modalTitle = '模拟面试';
const fullscreen = true;
const isModalOpen = ref(false);

const openModal = () => {
  isModalOpen.value = true;
};

const handleModalClosed = () => {
  console.log('聊天窗口已关闭');
  isModalOpen.value = false;
};
</script>
```



#### vue2中使用


index.html ，具体组件传参方式参考CDN引入，这里只演示框架使用形式
```html
<script type="module" src="https://pub.pincaimao.com/sdk/js/pcm-agents@latest/dist/pcm-agents/pcm-agents.esm.js"></script>
```

```vue
<template>
  <div>
    <button @click="openModal">开始模拟面试</button>
    
    <pcm-mnms-modal 
      ref="modalRef"
      :token="token"
      :modal-title="modalTitle"
      :fullscreen="fullscreen"
      :is-open="isModalOpen"
      @modalClosed="handleModalClosed"
    ></pcm-mnms-modal>
  </div>
</template>

<script>
export default {
  data() {
    return {
      token: 'app-fc0r90cHmzmcjK2vwXRKc7pc',
      modalTitle: '模拟面试',
      fullscreen: true,
      isModalOpen: false
    }
  },
  methods: {
    openModal() {
      this.isModalOpen = true;
    },
    handleModalClosed() {
      console.log('聊天窗口已关闭');
      this.isModalOpen = false;
    }
  }
}
</script>
```



### 类型接口



#### 文件上传响应 (FileUploadResponse)

该接口用于描述文件上传后的响应数据结构。

| 属性名        | 类型   | 描述                                                   |
| ------------- | ------ | ------------------------------------------------------ |
| cos_key       | string | 文件在对象存储中的唯一标识符，用于后续访问或操作该文件 |
| file_name     | string | 上传文件的原始名称                                     |
| file_size     | string | 文件大小的友好显示，带有单位（如 "1.5MB"）             |
| presigned_url | string | 用于临时访问该文件的预签名URL，通常有效期有限          |
| ext           | string | 文件的扩展名（如 "pdf", "jpg" 等）                     |





#### 流式输出完成事件数据 (StreamCompleteEventData)

该接口用于描述流式输出完成时的事件数据结构。

| 属性名          | 类型   | 描述                 |
| --------------- | ------ | -------------------- |
| conversation_id | string | 当前会话的唯一标识符 |
| event           | string | 事件类型标识符       |
| message_id      | string | 当前消息的唯一标识符 |
| id              | string | 事件的唯一标识符     |

**使用场景示例：**

- 标识流式数据传输已完成

- 触发UI更新或下一步操作

- 记录会话流程状态

  

#### 会话开始事件数据 (ConversationStartEventData)

该接口用于描述会话开始时的事件数据结构。

| 属性名          | 类型   | 描述                   |
| --------------- | ------ | ---------------------- |
| conversation_id | string | 新创建会话的唯一标识符 |
| event           | string | 事件类型标识符         |
| message_id      | string | 第一条消息的唯一标识符 |
| id              | string | 事件的唯一标识符       |

**使用场景示例：**

- 初始化新的会话界面
- 开始会话计时或记录
- 设置会话上下文



#### 聊天完成事件数据 (InterviewCompleteEventData)

该接口用于描述聊天或面试完成时的事件数据结构。

| 属性名                  | 类型                | 描述                   |
| ----------------------- | ------------------- | ---------------------- |
| conversation_id         | string              | 当前会话的唯一标识符   |
| current_question_number | number \| undefined | 当前问题的序号（可选） |
| total_questions         | number \| undefined | 问题总数（可选）       |
| ai_response             | string \| undefined | AI的最终回复内容（可选） |

**使用场景示例：**

- 面试或问答流程结束通知
- 显示完成进度（如 "已完成3/5个问题"）
- 触发结果汇总或评分流程
- 获取AI的最终回复内容用于后续处理



#### 录制错误事件数据 (RecordingErrorEventData)

该接口用于描述录制过程中发生错误时的事件数据结构。

| 属性名  | 类型             | 描述                   |
| ------- | ---------------- | ---------------------- |
| type    | string           | 错误类型标识符         |
| message | string           | 错误描述信息           |
| details | any \| undefined | 错误的详细信息（可选） |

**使用场景示例：**

- 音频/视频录制失败时的错误处理
- 向用户显示友好的错误提示
- 日志记录与问题诊断



#### 录制状态变化事件数据 (RecordingStatusChangeEventData)

该接口用于描述录制状态发生变化时的事件数据结构。

| 属性名  | 类型                                                        | 描述                       |
| ------- | ----------------------------------------------------------- | -------------------------- |
| status  | 'started' \| 'stopped' \| 'paused' \| 'resumed' \| 'failed' | 录制的当前状态             |
| details | any \| undefined                                            | 状态变化的详细信息（可选） |

**使用场景示例：**

- 更新UI显示当前录制状态
- 根据不同状态执行相应的业务逻辑
- 记录录制会话的状态流转

以上接口设计用于处理文件上传、流式数据传输、会话管理和音视频录制等应用场景，为前后端交互提供了规范化的数据结构。



#### 统一错误事件详情 (ErrorEventDetail)

该接口用于描述系统中发生错误时的详细信息结构。

| 属性名  | 类型                                  | 描述                                       |
| ------- | ------------------------------------- | ------------------------------------------ |
| source  | string                                | 错误发生的来源或组件位置                   |
| error   | any                                   | 原始错误对象，可能包含错误堆栈或系统错误码 |
| message | string                                | 对错误情况的人类可读描述                   |
| type    | 'api' \| 'ui' \| 'network' \| 'other' | 错误类型分类                               |

**类型说明：**

- `api`: 与API调用相关的错误，如服务端返回的错误状态码或响应异常
- `ui`: 用户界面交互过程中发生的错误，如组件渲染失败
- `network`: 网络通信相关错误，如连接超时或断开
- `other`: 不属于以上类别的其他类型错误

**使用场景示例：**

- 统一错误处理系统中记录错误详情
- 向用户展示适当的错误提示信息
- 错误上报与分析


## 测试发版流程

1. 前往 packages/pcm-agents 修改package.json版本号
2. packages/pcm-agents-react和packages/pcm-agents-vue还要修改dependencies下的pcm-agents版本号
3. 执行

```bash
pnpm version:beta # 报错可忽略
pnpm upload:beta
```
packages/pcm-agents-react 和 packages/pcm-agents-vue 同上

pcm-agents-react 操作如上

## 正式服发版流程

1. 修改 .env 为正式服配置
2. 修改各 package.json 版本号
3. packages/pcm-agents-react和packages/pcm-agents-vue还要修改dependencies下的pcm-agents版本号
4. 在三个目录执行

```bash
pnpm upload
```

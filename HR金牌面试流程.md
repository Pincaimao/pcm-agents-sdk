# HR金牌面试流程 - 组件使用指南

## 概述
本文档描述了HR金牌面试系统的完整API调用流程，包括用户鉴权、AI对话、语音合成、视频上传和答案保存等关键步骤。

## 基础配置

### 接口基地址
```
https://api.pincaimao.com/agents/platform/sdk/v1
```

### 认证方式
使用Bearer Token进行身份验证，Token需要在每个请求的`Authorization`头中携带。

## 完整流程

### 第一步：用户鉴权验证
验证用户身份和权限，确保用户可以访问面试系统。

```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/user' \\
  -H 'accept: */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://localhost:4444' \\
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
```

**请求说明：**
- **方法：** GET
- **功能：** 验证用户身份和权限
- **返回：** 用户信息和权限状态

### 第二步：开始AI面试对话
发起与AI面试官的对话，开始面试流程。

```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/chat/chat-messages' \\
  -H 'accept: text/event-stream' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://localhost:4444' \\
  -H 'user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' \\
  --data-raw '{
    \"response_mode\": \"streaming\",
    \"conversation_id\": \"\",
    \"query\": \"我是一名人力资源主管，请您开始提问\",
    \"bot_id\": \"3022316191018880\",
    \"inputs\": {
      \"job_info\": \"人力资源主管\",
      \"dimensional_info\": \"人力资源规划\",
      \"callback_url\": \"https://toa.ylzhaopin.com/api/test/receive\",
      \"display_content_status\": \"1\"
    }
  }'
```

**请求参数说明：**
- **方法：** POST
- **response_mode：** 响应模式，`streaming`表示流式响应
- **conversation_id：** 对话ID，新对话传空字符串
- **query：** 用户输入的消息内容
- **bot_id：** AI机器人ID
- **inputs：** 面试相关输入参数
  - **job_info：** 职位信息
  - **dimensional_info：** 维度信息
  - **callback_url：** 回调地址
  - **display_content_status：** 显示内容状态

### 第三步：生成问题语音
将AI返回的问题文本转换为语音，提升面试体验。

```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/tts/synthesize_audio' \\
  -H 'accept: */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://localhost:4444' \\
  -H 'user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' \\
  --data-raw '{
    \"text\": \"问题 1：请描述您如何根据公司未来三年的战略目标，制定相应的人力资源规划，并确保规划与业务需求紧密匹配？\"
  }'
```

**请求参数说明：**
- **方法：** POST
- **text：** 需要转换为语音的文本内容

### 第四步：上传视频回答

#### 4.1 生成上传URL
```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/files/generate-upload-url' \\
  -H 'accept: */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://192.168.38.123:4444' \\
  -H 'user-agent: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36' \\
  --data-raw '{
    \"filename\": \"answer.webm\",
    \"filesize\": 428996,
    \"sha256\": \"1eeabcf8831e496233b4588b936616638e1d28bac560f02dd7f08c5a2070f5c5\"
  }'
```

**请求参数说明：**
- **方法：** POST
- **filename：** 文件名
- **filesize：** 文件大小（字节）
- **sha256：** 文件SHA256校验值



**向generate-upload-url回调的地址上传文件**





#### 4.2 标记文件上传完成
```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/files/mark-as-upload' \\
  -H 'accept: */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://192.168.38.123:4444' \\
  -H 'user-agent: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36' \\
  --data-raw '{
    \"cos_key\": \"/resources/file/20250527/033b9c16c6adc8b13983b53eedaffcf1.webm\"
  }'
```

**请求参数说明：**
- **方法：** POST
- **cos_key：** 云存储中的文件路径

### 第五步：保存面试答案
将用户的视频回答与对应问题关联保存。

```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/hr_competition/answer' \\
  -H 'accept: */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://192.168.38.123:4444' \\
  -H 'user-agent: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36' \\
  --data-raw '{
    \"conversation_id\": \"2e6aa4fa-d06e-4f28-945c-eb811a196dfb\",
    \"question\": \"问题 1：请描述您如何评估公司当前的培训需求，并制定相应的年度培训计划？\",
    \"file_url\": \"/resources/file/20250527/033b9c16c6adc8b13983b53eedaffcf1.webm\"
  }'
```

**请求参数说明：**
- **方法：** POST
- **conversation_id：** 对话ID（从第二步获取）
- **question：** 面试问题内容
- **file_url：** 回答视频文件的URL路径





### 第六步：结束面试
标记面试结束，完成整个面试流程。

```bash
curl 'https://api.pincaimao.com/agents/platform/sdk/v1/hr_competition/2e6aa4fa-d06e-4f28-945c-eb811a196dfb/end' \\
  -X 'POST' \\
  -H 'accept: */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7,ru;q=0.6' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6IkJlbm55IiwidWlkIjozNTY5NjcwMjE1NzQ4ODEyOCwiY2hhdF91c2VyIjoicGNtLTEyMyIsInNlY3JldF9pZCI6IlIxUXFkYTkzNzVkZmhwblZvYUZUZUppbCIsImV4cCI6MTc0ODM1NTkwMn0.Xw5SyKBgezlBikKf3TFQYmeF1iPrhCI2u014DN4HWCc' \\
  -H 'content-length: 0' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://192.168.38.123:4444' \\
  -H 'user-agent: Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36'
```

**请求说明：**
- **方法：** POST
- **URL参数：** conversation_id（在URL路径中）
- **功能：** 结束当前面试会话，触发面试结果生成

  




## 流程图示

```
用户鉴权 → 开始对话 → 生成语音 → 上传视频 → 保存答案 → 结束面试
    ↓         ↓         ↓         ↓         ↓         ↓
  验证身份   获取问题   问题朗读   回答录制   数据存储   完成会话
````




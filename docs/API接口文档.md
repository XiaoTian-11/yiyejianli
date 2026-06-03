# 壹页简历 (YiYeJianLi) — API 接口文档

> **版本:** v1.0  
> **更新日期:** 2026-06-02  
> **基础 URL:** `http://localhost:3000` (开发) / `https://{your-app}.run.app` (生产)  
> **协议:** HTTP/1.1  
> **内容类型:** `application/json`  

---

## 目录

1. [概述](#1-概述)
2. [服务端 API](#2-服务端-api)
   - [2.1 AI 翻译接口](#21-ai-翻译接口)
   - [2.2 健康检查接口](#22-健康检查接口)
3. [Firestore 客户端 API](#3-firestore-客户端-api)
   - [3.1 获取简历列表](#31-获取简历列表)
   - [3.2 获取单个简历](#32-获取单个简历)
   - [3.3 保存简历](#33-保存简历)
   - [3.4 创建新简历](#34-创建新简历)
   - [3.5 重命名简历](#35-重命名简历)
   - [3.6 删除简历](#36-删除简历)
4. [Firebase Auth API](#4-firebase-auth-api)
   - [4.1 邮箱注册](#41-邮箱注册)
   - [4.2 邮箱登录](#42-邮箱登录)
   - [4.3 登出](#43-登出)
   - [4.4 认证状态监听](#44-认证状态监听)
   - [4.5 演示模式登录](#45-演示模式登录)
5. [AI 简历诊断 API（客户端）](#5-ai-简历诊断-api客户端)
6. [错误码参考](#6-错误码参考)
7. [数据流转图](#7-数据流转图)

---

## 1. 概述

壹页简历的 API 分为两个层级：

| 层级 | 说明 | 运行环境 |
|------|------|---------|
| **服务端 API** | Express 服务器提供，运行在 Node.js 环境 | 服务端（端口 3000） |
| **客户端 API** | Firebase SDK 在前端直接调用 Firestore/Auth | 浏览器端 |

### 1.1 服务端 API 架构

```
                             ┌──────────────────────┐
                             │    Express Server     │
                             │    (server.ts)        │
                             │                       │
  Client  ──POST /api/translate──▶  DeepSeek AI 翻译  │
  Client  ──GET  /api/health─────▶  健康检查         │
                             │                       │
                             │  NODE_ENV=production  │
                             │  → 静态文件服务 (dist/) │
                             │  NODE_ENV≠production   │
                             │  → Vite 开发中间件      │
                             └──────────────────────┘
```

### 1.2 客户端 API 架构

```
  ┌──────────┐     Firebase SDK      ┌─────────────────┐
  │  Browser  │ ◀──────────────────▶  │  Firebase Auth   │
  │  (React)  │                       │  Firestore       │
  └──────────┘                       └─────────────────┘
```

---

## 2. 服务端 API

### 2.1 AI 翻译接口

使用 DeepSeek AI 将简历字段从一种语言翻译为另一种语言。

#### 请求

```
POST /api/translate
Content-Type: application/json
```

**请求体参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `textMap` | `Record<string, string>` | ✅ | 待翻译的键值对映射。键为字段标识，值为待翻译文本 |
| `fromLang` | `string` | ✅ | 源语言代码 |
| `toLang` | `string` | ✅ | 目标语言代码 |

**支持的语言代码：**

| 代码 | 语言 |
|------|------|
| `zh` | 简体中文 |
| `en` | 英语（专业简历标准） |
| `ja` | 日语 |
| `ko` | 韩语 |
| `fr` | 法语 |
| `de` | 德语 |
| `es` | 西班牙语 |

**请求示例：**

```json
{
  "textMap": {
    "summary": "拥有 8 年互联网产品经验，擅长从 0 到 1 构建用户增长体系。",
    "exp_1_desc": "负责核心产品线的迭代优化，通过引入 A/B 测试机制使核心转化率提升了 35%。",
    "skill_1": "产品规划",
    "skill_2": "数据分析"
  },
  "fromLang": "zh",
  "toLang": "en"
}
```

#### 成功响应

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "translatedMap": {
    "summary": "8 years of internet product management experience. Specialized in building user growth systems from 0 to 1.",
    "exp_1_desc": "Led iterative optimization of core product lines, increasing core conversion rate by 35% through A/B testing implementation.",
    "skill_1": "Product Planning",
    "skill_2": "Data Analytics"
  }
}
```

#### 错误响应

**400 Bad Request — 参数无效：**

```json
{
  "error": "Invalid textMap parameter"
}
```

**500 Internal Server Error — API 密钥未配置：**

```json
{
  "error": "DEEPSEEK_API_KEY environment variable is not configured on the server."
}
```

**500 Internal Server Error — AI 服务异常：**

```json
{
  "error": "Empty response from DeepSeek translation service."
}
```

```json
{
  "error": "具体错误信息描述..."
}
```

#### 处理逻辑

1. 验证 `textMap` 参数存在且为对象类型
2. 检查 `DEEPSEEK_API_KEY` 环境变量是否已配置
3. 调用 DeepSeek Chat (V3) 模型（temperature=0.1，低创意性确保翻译准确）
4. 系统指令包含：
   - 返回纯 JSON 对象，保持键名不变
   - 翻译为专业简历级的目标语言
   - 保留技术缩写（SQL、React、Python、API、STAR 等）
   - 如果值包含 HTML 标签，只翻译可见文本，保留标签结构
   - 不翻译 URL 和邮件域名
5. 解析 AI 响应并返回 `{ translatedMap }`

---

### 2.2 健康检查接口

#### 请求

```
GET /api/health
```

#### 成功响应

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "status": "ok",
  "time": "2026-06-02T10:30:00.000Z"
}
```

---

## 3. Firestore 客户端 API

以下 API 通过 Firebase Web SDK 在前端直接调用。所有操作封装在 `src/lib/firebaseService.ts` 中。

### 3.1 获取简历列表

根据用户 ID 获取其所有简历的列表。

#### 函数签名

```typescript
getResumesList(userId: string, isDemo?: boolean): Promise<ResumeDocument[]>
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `userId` | `string` | ✅ | 用户 UID |
| `isDemo` | `boolean` | — | 是否为演示模式（默认 `false`） |

#### 返回类型

```typescript
interface ResumeDocument {
  id: string;                      // 简历文档 ID
  userId: string;                  // 所属用户 ID
  name: string;                    // 简历名称
  data: ResumeData;                // 简历完整数据
  score: number;                   // AI 评分
  status: 'new' | 'draft' | 'completed'; // 状态
  updatedAt: Timestamp | string;   // 更新时间
  templateId?: string;             // 模板 ID
}
```

#### 处理流程

1. **演示模式 (`isDemo=true`):** 从 `localStorage` 读取 `resumes_demo_{userId}` 键
   - 无数据时自动创建默认简历
2. **正常模式:** 查询 Firestore `resumes` 集合，条件 `userId == {userId}`
   - 按 `updatedAt` 降序排列
   - 无数据时检查旧版文档路径并自动迁移
   - 完全无数据时创建默认简历

#### Firestore 查询

```javascript
query(
  collection(db, 'resumes'),
  where('userId', '==', userId)
)
```

---

### 3.2 获取单个简历

> **已废弃，兼容保留。** 实际返回列表中的第一份简历数据。

#### 函数签名

```typescript
getResume(userId: string, isDemo?: boolean): Promise<ResumeData | null>
```

#### 返回值

- 成功：`ResumeData` 对象
- 无数据：`null`

---

### 3.3 保存简历

保存/更新指定简历的全部数据（合并写入）。

#### 函数签名

```typescript
saveResumeWithId(
  userId: string,
  resumeId: string,
  name: string,
  data: ResumeData,
  score: number,
  status: 'new' | 'draft' | 'completed',
  isDemo?: boolean,
  templateId?: string
): Promise<void>
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `userId` | `string` | ✅ | 用户 UID |
| `resumeId` | `string` | ✅ | 简历文档 ID |
| `name` | `string` | ✅ | 简历名称 |
| `data` | `ResumeData` | ✅ | 简历完整数据 |
| `score` | `number` | ✅ | AI 评分 |
| `status` | `'new' \| 'draft' \| 'completed'` | ✅ | 状态 |
| `isDemo` | `boolean` | — | 演示模式 |
| `templateId` | `string` | — | 模板 ID |

#### Firestore 写入

```javascript
setDoc(doc(db, 'resumes', resumeId), {
  userId,
  name,
  data,
  score,
  status,
  updatedAt: serverTimestamp(),
  ...(templateId ? { templateId } : {})
}, { merge: true })
```

#### 自动保存机制

在 `App.tsx` 中实现防抖自动保存：
- 监听 `data` 状态变化
- 与 `lastSavedDataRef` 比较判断是否有实际变更
- 1 秒防抖延迟
- 保存状态指示器：`idle → saving → saved/error`

---

### 3.4 创建新简历

#### 函数签名

```typescript
createNewResume(
  userId: string,
  name: string,
  isDemo?: boolean,
  templateId?: string,
  initialData?: ResumeData
): Promise<string>
```

#### 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|------|------|
| `userId` | `string` | ✅ | — | 用户 UID |
| `name` | `string` | ✅ | — | 简历名称 |
| `isDemo` | `boolean` | — | `false` | 演示模式 |
| `templateId` | `string` | — | `"modern"` | 初始模板 |
| `initialData` | `ResumeData` | — | `INITIAL_DATA` | 初始简历数据（可选行业样本） |

#### 返回值

- 成功：新创建的简历文档 ID（格式：`{randomId}_{userId}`）
- 失败：空字符串 `""`

#### 生成 ID 规则

```javascript
const newId = Math.random().toString(36).substring(2, 9) + '_' + userId;
```

---

### 3.5 重命名简历

#### 函数签名

```typescript
renameResume(
  userId: string,
  resumeId: string,
  newName: string,
  isDemo?: boolean
): Promise<void>
```

#### Firestore 更新

```javascript
updateDoc(doc(db, 'resumes', resumeId), {
  name: newName,
  updatedAt: serverTimestamp()
})
```

---

### 3.6 删除简历

#### 函数签名

```typescript
deleteResume(
  userId: string,
  resumeId: string,
  isDemo?: boolean
): Promise<void>
```

#### Firestore 删除

```javascript
deleteDoc(doc(db, 'resumes', resumeId))
```

---

## 4. Firebase Auth API

所有认证操作通过 Firebase Web SDK (`src/lib/firebase.ts`) 封装。

### 4.1 邮箱注册

#### 函数签名

```typescript
createUserWithEmailAndPassword(auth, email: string, password: string): Promise<UserCredential>
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `email` | `string` | ✅ | 用户邮箱 |
| `password` | `string` | ✅ | 密码（Firebase 要求至少 6 位） |

#### 成功响应

Firebase `UserCredential` 对象，包含 `user` 属性（`User` 类型）。

#### 错误码

| 错误码 | 说明 |
|--------|------|
| `auth/email-already-in-use` | 邮箱已被注册 |
| `auth/invalid-email` | 邮箱格式无效 |
| `auth/weak-password` | 密码强度不足（少于 6 位） |
| `auth/operation-not-allowed` | 邮箱/密码登录方式未启用 |

---

### 4.2 邮箱登录

#### 函数签名

```typescript
signInWithEmailAndPassword(auth, email: string, password: string): Promise<UserCredential>
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| `auth/user-not-found` | 用户不存在 |
| `auth/wrong-password` | 密码错误 |
| `auth/invalid-credential` | 凭证无效 |
| `auth/too-many-requests` | 请求过于频繁，账户暂时锁定 |

---

### 4.3 登出

#### 函数签名

```typescript
signOut(auth): Promise<void>
```

---

### 4.4 认证状态监听

#### 函数签名

```typescript
onAuthStateChanged(auth, callback: (user: User | null) => void): Unsubscribe
```

#### 回调参数

```typescript
interface User {
  uid: string;             // 用户唯一 ID
  email: string | null;    // 邮箱
  emailVerified: boolean;  // 邮箱是否已验证
  isAnonymous: boolean;    // 是否匿名用户
  phoneNumber: string | null;
  providerData: UserInfo[];
  // ...其他 Firebase User 属性
}
```

---

### 4.5 演示模式登录

演示模式不经过 Firebase Auth，直接在应用层模拟用户状态。

#### 演示用户凭据

```typescript
const demoUser = {
  uid: 'demo-user-123',
  email: 'demo@yuejianli.com',
  isAnonymous: false,
  isDemo: true,
  phoneNumber: '测试账号 (演示模式)'
};
```

#### 演示用户权限

```typescript
const demoAppUser: AppUser = {
  id: 'demo-user-123',
  email: 'demo@yuejianli.com',
  tier: 'member',
  memberUntil: '2099-12-31',
  remainingPdfExports: 999,
  remainingPngExports: 999,
  remainingAtsChecks: 999
};
```

#### 数据存储

演示用户数据存储在 `localStorage` 键 `resumes_demo_demo-user-123` 中。

---

## 5. AI 简历诊断 API（客户端）

简历评分/诊断功能在客户端直接计算（无需服务端调用），位于 `src/components/ResumeScoring.tsx`。

### 5.1 评分维度

| 维度 | 满分 | 说明 |
|------|:---:|------|
| **完整度** (Completeness) | 40 分 | 个人信息、经历、教育、技能等字段完整度 |
| **关键词** (Keywords) | 40 分 | 与行业关键词库的匹配程度 |
| **覆盖率** (Coverage) | 10 分 | 简历板块的覆盖范围 |
| **平衡度** (Balance) | 10 分 | 各板块内容长度的均衡性 |

**总分:** 100 分

### 5.2 诊断输出

| 输出项 | 类型 | 说明 |
|--------|------|------|
| 综合得分 | `number` | 0–100 分 |
| 各维度得分 | `{ completeness, keywords, coverage, balance }` | 分项分数 |
| 改进清单 | `AuditItem[]` | 可操作的建议列表（含严重级别） |
| 关键词匹配 | `MatchedKeyword[]` | 匹配到的行业关键词 |
| 行业噪音检测 | `NoiseDetection[]` | 跨行业术语冲突检测 |

### 5.3 改进清单严重级别

| 级别 | 图标 | 说明 |
|------|:---:|------|
| `success` | ✅ | 该项良好 |
| `warning` | ⚠️ | 建议改进 |
| `error` | ❌ | 需要立即修复 |

### 5.4 行业匹配清除

支持一键清除不符合目标行业的术语，并替换为行业标准样本数据。10 个行业包：
`tech`、`product`、`finance`、`medical`、`design`、`engineering`、`law`、`marketing`、`student`、`admin`

---

## 6. 错误码参考

### 6.1 服务端 HTTP 状态码

| 状态码 | 含义 | 触发场景 |
|:---:|------|------|
| `200` | OK | 请求成功 |
| `400` | Bad Request | `textMap` 参数缺失或格式错误 |
| `500` | Internal Server Error | AI 密钥未配置、AI 服务异常、JSON 解析失败 |

### 6.2 Firestore 错误

Firestore 错误通过 `handleFirestoreError()` 统一处理，输出格式：

```json
{
  "error": "错误描述信息",
  "operationType": "create|update|delete|list|get|write",
  "path": "resumes/{resumeId}",
  "authInfo": {
    "userId": "当前用户UID或null",
    "email": "当前用户邮箱或null",
    "emailVerified": true,
    "isAnonymous": false,
    "tenantId": null,
    "providerInfo": [{"providerId": "password", "email": "user@example.com"}]
  }
}
```

### 6.3 Firebase Auth 错误码

| 错误码 | 含义 |
|--------|------|
| `auth/email-already-in-use` | 邮箱已被使用 |
| `auth/invalid-email` | 邮箱格式无效 |
| `auth/weak-password` | 密码强度不足 |
| `auth/user-not-found` | 用户不存在 |
| `auth/wrong-password` | 密码错误 |
| `auth/invalid-credential` | 凭证无效 |
| `auth/too-many-requests` | 请求过于频繁 |
| `auth/network-request-failed` | 网络请求失败 |
| `auth/operation-not-allowed` | 登录方式未启用 |

---

## 7. 数据流转图

### 7.1 完整用户旅程数据流

```
┌──────────────────────────────────────────────────────────────────┐
│                          用户旅程                                  │
└──────────────────────────────────────────────────────────────────┘

  首页 → 模板选择 → 简历编辑 → 预览/导出
    │        │          │           │
    │        │          │           ├─ handlePrint() ──▶ 浏览器打印/PDF
    │        │          │           │
    │        │          ├─ 自动保存 (1s 防抖) ──▶ saveResumeWithId()
    │        │          │                          │
    │        │          │              ┌─ isDemo ──▶ localStorage
    │        │          │              │
    │        │          │              └─ 正常 ────▶ Firestore setDoc()
    │        │          │
    │        │          ├─ AI 翻译 ──▶ POST /api/translate
    │        │          │                  │
    │        │          │                  └─ DeepSeek Chat (V3)
    │        │          │
    │        │          └─ AI 诊断 ──▶ 客户端计算
    │        │
    │        └─ createNewResume() ──▶ Firestore setDoc()
    │
    └─ 认证 ──▶ Firebase Auth
                    │
                    ├─ 邮箱注册
                    ├─ 邮箱登录
                    └─ 演示模式
```

### 7.2 数据持久化选择逻辑

```
isDemo === true?
    │
    ├─ YES → localStorage
    │        Key: resumes_demo_{userId}
    │        Value: JSON.stringify(ResumeDocument[])
    │
    └─ NO  → Firestore
             Collection: resumes
             Document ID: {randomId}_{userId}
             Security: userId 字段匹配当前 auth.uid
```

---

## 附录：服务端完整配置参考

### 环境变量

| 变量 | 必填 | 说明 |
|------|:---:|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |
| `APP_URL` | — | 应用部署 URL |
| `NODE_ENV` | — | `"production"` 时启用静态文件服务模式 |

### AI 模型配置

```typescript
{
  model: "deepseek-chat",   // DeepSeek V3
  temperature: 0.1,         // 低温度，确保翻译准确一致
}
```

### 服务端端口

- 默认端口: `3000`
- 监听地址: `0.0.0.0`（所有网络接口）

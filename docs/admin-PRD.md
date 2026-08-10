# 壹页简历 — 中后台（Admin）PRD 开发文档

> **版本:** v1.0
> **日期:** 2026-08-10
> **技术选型:** shadcn/ui + TanStack + 独立 Vite 应用（详见《admin-架构分析.md》）
> **状态:** 待开发

---

## 目录

1. [产品概述](#1-产品概述)
2. [用户角色与权限](#2-用户角色与权限)
3. [功能清单](#3-功能清单)
4. [详细需求](#4-详细需求)
5. [数据模型](#5-数据模型)
6. [接口设计](#6-接口设计)
7. [非功能需求](#7-非功能需求)
8. [迭代计划](#8-迭代计划)
9. [验收标准](#9-验收标准)
10. [附录：SQL 迁移脚本](#10-附录sql-迁移脚本)

---

## 1. 产品概述

### 1.1 产品定位

壹页简历中后台管理系统，服务于运营与管理者，对平台的**用户、订单**等核心业务数据进行查看、检索、统计与维护。

### 1.2 产品目标

- 让运营**实时掌握**用户规模、订单与收入情况。
- 提供**用户管理**能力：检索、查看会员信息、调整会员权益、禁用账号。
- 提供**订单管理**能力：检索、查看订单详情与支付状态。

### 1.3 核心用户故事

| 角色 | 用户故事 |
|------|---------|
| 运营 | 作为运营，我想在后台查看全部注册用户及其会员等级，以便了解用户结构并做运营干预。 |
| 运营 | 作为运营，我想按邮箱/状态/等级筛选用户，以便精准定位目标人群。 |
| 运营 | 作为运营，我想查看某用户的全部订单与简历，以便处理客诉。 |
| 运营 | 作为运营，我想查看全部订单并按状态/方案/时间筛选，以便核账与监控支付健康度。 |
| 管理者 | 作为管理者，我想在登录后台后看到核心指标（用户数、GMV、转化率），以便快速判断业务状况。 |

---

## 2. 用户角色与权限

| 角色 | 说明 | 中后台权限 |
|------|------|-----------|
| 管理员 | 通过 Supabase 账号登录，且命中管理员判定（`ADMIN_EMAILS` 白名单或 `users.is_admin=true`） | 全量查看与管理 |
| 普通用户 | 已登录 Supabase 但非管理员 | 无访问权（403） |
| 未登录 | 未登录 | 重定向至登录页 |

---

## 3. 功能清单

> 优先级：P0 = 本版本必做；P1 = 本版本建议；P2 = 后续迭代

| 模块 | 功能 | 优先级 | 说明 |
|------|------|:---:|------|
| 认证 | 管理员登录 | P0 | Supabase 邮箱/密码登录 |
| 认证 | 会话保持 / 登出 | P0 | JWT 持久化，刷新不失效 |
| 认证 | 管理员守卫 | P0 | 未登录重定向、非管理员 403 |
| 仪表盘 | 核心指标卡片 | P0 | 用户总数、订单总数、GMV、付费转化率、会员数、简历总数 |
| 仪表盘 | 订单趋势图 | P1 | 近 7/30 天订单量与 GMV 趋势（recharts 或轻量 SVG） |
| 用户管理 | 用户列表 | P0 | 分页 + 搜索（邮箱）+ 筛选（等级/状态） |
| 用户管理 | 用户详情 | P0 | 基本信息、会员信息、关联订单列表、关联简历列表 |
| 用户管理 | 编辑会员信息 | P0 | 修改 tier / member_until / 导出配额 / 单次配额 |
| 用户管理 | 禁用/启用账号 | P1 | users.status 字段（active/disabled） |
| 用户管理 | 用户数统计视图 | P2 | 按等级/时间分布 |
| 订单管理 | 订单列表 | P0 | 分页 + 搜索（订单号）+ 筛选（状态/方案/支付方式） |
| 订单管理 | 订单详情 | P0 | 完整订单字段、关联用户信息 |
| 订单管理 | 订单状态修正 | P1 | 状态机校验下的状态修正（pending/paid/completed/expired/cancelled） |
| 订单管理 | 导出 CSV | P2 | 当前筛选结果导出 |
| 简历管理 | 简历列表 | P1 | 按用户检索，查看简历名称/模板/评分/状态/更新时间 |
| 简历管理 | 简历详情预览 | P2 | 只读预览简历内容 |
| 系统 | 管理员管理 | P2 | 维护 users.is_admin |

---

## 4. 详细需求

### 4.1 认证模块

#### 4.1.1 登录页
- 路径：`/admin/login`（独立应用根路径 `/`）
- 表单：邮箱 + 密码
- 交互：登录中 loading；失败展示 Supabase 错误信息（如邮箱/密码错误）。
- 登录成功后：请求 `GET /api/admin/me` 校验管理员身份：
  - 管理员 → 进入工作台
  - 非管理员 → 提示"无管理权限"，并登出。

#### 4.1.2 会话保持
- 使用 Supabase 客户端 `persistSession: true`，刷新页面自动恢复会话。
- 会话恢复期间展示全局 loading。

#### 4.1.3 守卫
- 未登录访问业务路由 → `<Navigate to="/login" replace />`。
- 登录但身份校验中 → loading。
- 非管理员 → 错误页 + 登出按钮。

### 4.2 仪表盘

#### 4.2.1 指标卡片（P0）

| 指标 | 定义 |
|------|------|
| 用户总数 | `users` 表记录数（去重 email 非空） |
| 订单总数 | `orders` 表记录数 |
| 成交订单数 | `status='completed'` 的订单数 |
| GMV（元） | `status='completed'` 的 `amount` 之和 |
| 付费转化率 | 成交订单数 / 用户总数（百分比） |
| 会员用户数 | `tier='member'` 的用户数 |
| 简历总数 | `resumes` 表记录数 |
| 今日新增用户 | 今日注册用户数（users.created_at） |

#### 4.2.2 趋势图（P1）
- 近 7 天 / 30 天：每日订单数与每日 GMV。
- 数据来源：`GET /api/admin/stats/orders-trend?days=7`。

### 4.3 用户管理

#### 4.3.1 用户列表（P0）
- 路径：`/admin/users`
- 表格列：邮箱、会员等级（guest/free/member）、会员到期日、PDF 导出剩余、PNG 导出剩余、ATS 检测剩余、创建时间、状态、操作。
- 工具栏：
  - 关键词搜索：按邮箱模糊匹配。
  - 筛选：会员等级（全部/free/member）、状态（全部/active/disabled，若有）。
- 分页：服务端分页，默认 20 条/页。
- 行操作：
  - 「详情」→ 打开详情抽屉。
  - 「编辑」→ 打开编辑表单。
- 空态：无匹配数据时展示空状态。

#### 4.3.2 用户详情（P0）
- 抽屉或独立页展示：
  - 基本信息：id、邮箱。
  - 会员信息：等级、到期日、各剩余配额。
  - 关联订单：该用户全部订单（复用订单表格简化版）。
  - 关联简历：该用户全部简历（名称/模板/评分/状态/更新时间）。
- 支持从详情直接跳转编辑。

#### 4.3.3 编辑会员信息（P0）
- 表单字段：
  - `tier`：guest / free / member（下拉）
  - `member_until`：日期时间（可空）
  - `remaining_pdf_exports` / `remaining_png_exports` / `remaining_ats_checks`：数字输入
- 校验：数字非负；member 会员通常设置到期日。
- 提交后刷新列表与详情。

#### 4.3.4 禁用/启用账号（P1）
- 对 `users.status` 字段操作：active ↔ disabled。
- disabled 账号在 C 端登录后应被拦截（需 C 端配合，本版本仅后台标记，接口预留）。

### 4.4 订单管理

#### 4.4.1 订单列表（P0）
- 路径：`/admin/orders`
- 表格列：订单号、用户邮箱、方案（plan_type 映射名称）、金额、支付方式（wechat/alipay）、状态、创建时间、支付时间、完成时间、操作。
- 工具栏：
  - 关键词搜索：订单号。
  - 筛选：状态（pending/paid/completed/expired/cancelled）、方案类型。
- 分页：服务端分页，默认 20 条/页。
- 行操作：「详情」→ 打开详情抽屉。

#### 4.4.2 订单详情（P0）
- 展示全部字段：订单号、用户（id+email）、方案名称、金额（元）、支付方式、状态、创建/支付/完成/过期时间、网关交易号（gateway_trade_no）、回调幂等标记。

#### 4.4.3 订单状态修正（P1）
- 仅允许合法状态流转（状态机）：
  - `pending → completed`（补登支付成功）
  - `pending → cancelled`（取消）
  - `paid → completed`
- 修正订单状态的同时，若标记为 completed 需**同步执行 `completeOrder` 的幂等权益发放逻辑**（升级会员/发放配额），避免"订单完成但用户权益未到账"。

### 4.5 简历管理（P1）

- 列表：简历名称、所属用户邮箱、模板、评分、状态、更新时间。
- 检索：按用户邮箱搜索。
- 查看：只读查看简历 JSON 摘要（不渲染模板）。

### 4.6 通用交互规范

- 所有列表采用 TanStack Table：支持列排序、服务端分页、筛选。
- 所有服务端状态采用 TanStack Query：loading / error / empty 三态。
- 破坏性操作（禁用账号等）需弹确认框。
- 操作成功 / 失败均有 message 提示。

---

## 5. 数据模型

### 5.1 复用的现有表（Supabase）

**users**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 与 auth.users.id 一致 |
| email | text | 邮箱 |
| tier | text | guest/free/member |
| member_until | timestamptz | 会员到期时间 |
| remaining_pdf_exports | int | 剩余 PDF 导出次数 |
| remaining_png_exports | int | 剩余 PNG 导出次数 |
| remaining_ats_checks | int | 剩余 ATS 检测次数 |
| created_at | timestamptz | 创建时间 |

**orders**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text PK | 商户订单号 |
| user_id | uuid | 下单用户 |
| plan_type | text | 方案类型 |
| amount | numeric | 金额（元） |
| payment_method | text | wechat/alipay |
| status | text | pending/paid/completed/expired/cancelled |
| gateway_trade_no | text | 网关交易号 |
| created_at / paid_at / expires_at / completed_at | timestamptz | 各阶段时间 |

**resumes**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text PK | 简历 id |
| user_id | uuid | 所属用户 |
| name | text | 简历名 |
| data | jsonb | 简历内容 |
| score | int | AI 评分 |
| status | text | new/draft/completed |
| template_id | text | 模板 id |
| updated_at | timestamptz | 更新时间 |

### 5.2 建议新增字段（可选，见附录 SQL）

- `users.is_admin boolean default false`
- `users.status text default 'active'`

---

## 6. 接口设计

> 基础路径：`/api/admin/*`，全部需 `Authorization: Bearer <supabase_jwt>`。

### 6.1 认证

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| GET | `/api/admin/me` | 校验当前用户是否为管理员，返回管理员信息 | 200 `{ id, email, isAdmin }` / 401 / 403 |

### 6.2 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats/overview` | 返回核心指标（用户总数、订单总数、成交数、GMV、转化率、会员数、简历数、今日新增） |
| GET | `/api/admin/stats/orders-trend?days=7\|30` | 返回每日订单数与 GMV 序列 |

### 6.3 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users?search=&tier=&status=&page=&pageSize=` | 用户分页列表 |
| GET | `/api/admin/users/:id` | 用户详情（含 orders、resumes） |
| PATCH | `/api/admin/users/:id` | 更新会员信息（tier/member_until/配额/status/is_admin） |
| POST | `/api/admin/users/:id/disable` | 禁用账号（P1） |
| POST | `/api/admin/users/:id/enable` | 启用账号（P1） |

### 6.4 订单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/orders?search=&status=&planType=&page=&pageSize=` | 订单分页列表（含用户邮箱） |
| GET | `/api/admin/orders/:id` | 订单详情 |
| POST | `/api/admin/orders/:id/correct-status` | 状态修正（状态机校验，P1） |

### 6.5 简历

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/resumes?search=&page=&pageSize=` | 简历分页列表（按用户邮箱搜索，P1） |

### 6.6 通用响应约定

```json
// 分页列表
{ "items": [], "total": 0, "page": 1, "pageSize": 20 }

// 错误
{ "error": { "code": "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "INTERNAL", "message": "..." } }
```

### 6.7 状态码

| 状态码 | 场景 |
|:---:|------|
| 200 | 成功 |
| 401 | 未登录 / token 失效 |
| 403 | 非管理员 / 无权限 |
| 400 | 参数校验失败 |
| 404 | 资源不存在 |
| 500 | 服务端异常 |

---

## 7. 非功能需求

| 维度 | 要求 |
|------|------|
| 安全 | service_role key 仅存服务端；admin API 必须过 `requireAdmin`；敏感操作幂等 |
| 性能 | 列表服务端分页 + 筛选；orders.created_at、users.created_at 建立索引 |
| 可维护 | 独立应用、模块化 features 目录；组件基于 shadcn/ui 源码可控 |
| 兼容 | 现代浏览器；桌面优先，适配常见 1280+ 分辨率 |
| 可测试 | 核心服务端逻辑（管理员校验、统计、状态机）可单测（vitest） |
| 部署 | 独立构建产物部署于 `/admin` 子路径或独立域名 |

---

## 8. 迭代计划

| 迭代 | 范围 | 产出 |
|------|------|------|
| **M1（本版本）** | 认证 + 仪表盘 + 用户管理 + 订单管理 | 可用 MVP：登录、看板、用户列表/详情/编辑、订单列表/详情 |
| M2 | 简历管理列表 + 订单状态修正 + 禁用/启用账号 | 增强运营能力 |
| M3 | CSV 导出、趋势图完善、管理员管理、数据报表 | 精细化运营 |

---

## 9. 验收标准

- [ ] 管理员可通过邮箱密码登录中后台，普通用户登录被拒绝。
- [ ] 工作台正确展示核心指标，数据与 Supabase 实际数据一致。
- [ ] 用户列表支持分页、邮箱搜索、等级筛选；可查看详情、编辑会员信息，修改后 C 端可见。
- [ ] 订单列表支持分页、订单号搜索、状态筛选；可查看完整详情。
- [ ] 所有接口均需鉴权；无 token / 非管理员返回 401 / 403。
- [ ] 构建通过（`npm run build:admin`），生产环境 `/admin` 可访问。

---

## 10. 附录：SQL 迁移脚本

```sql
-- 在 Supabase SQL Editor 执行（可选，不执行也可用 ADMIN_EMAILS 白名单）

-- 1) 管理员标记字段
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2) 账号状态字段
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 3) 常用查询索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at  ON public.users  (created_at DESC);

-- 4) 示例：将指定邮箱提升为管理员
-- UPDATE public.users SET is_admin = true WHERE email = 'admin@example.com';
```

---

*本文档与《admin-架构分析.md》配套使用。*

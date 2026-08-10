# 壹页简历 — 中后台（Admin）架构分析文档

> **版本:** v1.0
> **日期:** 2026-08-10
> **状态:** 已评审，技术选型已确认

---

## 目录

1. [背景与目标](#1-背景与目标)
2. [开源方案调研](#2-开源方案调研)
3. [选型结论与理由](#3-选型结论与理由)
4. [目标架构](#4-目标架构)
5. [目录结构](#5-目录结构)
6. [鉴权与权限模型](#6-鉴权与权限模型)
7. [数据模型复用与扩展](#7-数据模型复用与扩展)
8. [与现有系统的关系](#8-与现有系统的关系)
9. [风险与对策](#9-风险与对策)

---

## 1. 背景与目标

### 1.1 背景

壹页简历现有系统为 C 端应用，技术栈为 **React 19 + Vite 6 + Tailwind CSS 4 + Express + Supabase**，功能涵盖模板选择、简历在线编辑、AI 诊断/翻译、会员与支付。

随着业务运行，运营需要一套**中后台管理系统**来管理用户与订单等核心业务数据。当前用户表、订单表、简历表均存于同一 Supabase 项目，但**没有任何管理端**，运营只能直接操作数据库，既不安全也不高效。

### 1.2 目标

- 交付一套**稳定、容易维护**的中后台，第一优先级包含**用户管理**与**订单管理**两大核心模块。
- 复用现有 Supabase 数据与 Express 服务端，**不引入新的数据库**。
- 前后端与 C 端应用**隔离部署**，互不影响。
- 代码结构清晰，便于长期迭代（如后续新增简历管理、数据报表等模块）。

### 1.3 非目标

- 不做 C 端功能的改造与迁移。
- 不做多租户、复杂 RBAC（本项目只需"管理员/普通用户"两级）。
- 不引入微前端。

---

## 2. 开源方案调研

### 2.1 调研范围与筛选标准

调研对象：主流开源中后台框架 / UI 体系（2026 年活跃维护）。

筛选标准：

| 维度 | 说明 |
|------|------|
| 稳定性与维护活跃度 | 有持续的版本发布与社区维护 |
| 与现有技术栈匹配度 | 必须是 React + Vite 生态，尽量贴合 Tailwind 4 |
| 长期维护成本 | 依赖锁定风险、升级成本、代码可控性 |
| 学习成本 | 团队成员熟悉程度 |
| 业务适配 | 表格/表单/筛选/分页等 CRUD 能力是否开箱即用 |

### 2.2 候选方案横向对比

| 方案 | 出处/维护方 | 核心形态 | 稳定性 | Tailwind 适配 | 维护成本 | 说明 |
|------|------------|---------|:---:|:---:|:---:|------|
| **Ant Design Pro** | 蚂蚁集团 | 企业级组件库 + 官方脚手架（ProLayout/ProTable） | ★★★★★ | 差（独立 CSS-in-JS token 体系） | 中高（大版本有破坏性变更） | 国内最成熟，CRUD 组件最强，但样式体系与 Tailwind 冲突 |
| **shadcn/ui** | 社区（Radix + Tailwind） | "源码即服务"，组件 TSX 直接进仓库 | ★★★★★ | 原生（基于 Tailwind CSS 变量） | 极低（0 运行时依赖，无版本锁定） | 代码完全可控，AI 辅助开发最佳 |
| **Refine** | Refine 团队 | Headless 中后台框架 + 可配 AntD/MUI/Tailwind | ★★★★ | 可配 | 中（引入框架层） | 声明式 CRUD、官方 Supabase 集成，但增加学习与依赖成本 |
| **React-Admin** | Marmelab | 组件式框架（绑定 MUI） | ★★★★ | 差（MUI 绑定） | 中高（高级功能需企业版） | MUI 绑定，与现有 Tailwind 体系不符 |
| **Vben Admin (Vue3)** | 社区 | Vue3 + Shadcn + 多 UI 适配 | ★★★★ | 可配 | 中 | 技术栈为 Vue，与现有 React 项目割裂 |
| **若依 RuoYi** | 社区 | Java 后端 + Vue 前端全家桶 | ★★★★ | 可配 | 高（前后端全栈强绑定） | 强绑定 Java + Vue，与本项目技术栈完全不匹配 |
| **TailAdmin** | 社区 | React 19 + Tailwind 4 模板 | ★★★★ | 原生 | 低 | 现成模板，但表单/表格高级能力需自建 |

### 2.3 关键调研发现

1. **shadcn/ui 增长最快**：GitHub 星标已反超 Ant Design，npm 周下载量 187 万。核心优势是"代码归你所有"——组件源码直接复制进仓库，`0` 个运行时依赖，**没有版本锁定与破坏性升级问题**，是长期维护成本最低的方案。
2. **Ant Design 最成熟**：蚂蚁官方持续维护，60+ 企业级组件、ProTable 等高层模式开箱即用，适合重数据 CRUD；但样式基于 CSS-in-JS token，与项目现有 Tailwind 4 构成**双 UI 体系**，且升级伴随破坏性变更。
3. **既有项目强约束**：现有 C 端全部使用 Tailwind 4，开发方已熟悉该写法。若中后台改用 AntD，会引入第二套样式体系、增加维护心智负担。
4. **AI 辅助开发友好度**：shadcn/ui 组件就是仓库里的纯 TSX 文件，Cursor / Claude Code 可直接读写，无需查询组件库 API，契合本项目使用 AI 辅助开发的现状。

---

## 3. 选型结论与理由

### 3.1 结论

| 维度 | 选型 |
|------|------|
| 应用形态 | **独立 Vite 应用**（`admin/` 目录，独立构建、独立入口） |
| UI 体系 | **shadcn/ui**（Tailwind 4 + Radix 底层） |
| 数据表格 | **TanStack Table** |
| 数据请求/状态 | **TanStack Query** |
| 路由 | **React Router 7** |
| 后端 API | 复用现有 **Express server**，新增 `/api/admin/*` 管理接口 |
| 数据存储 | 复用 **Supabase**（users / orders / resumes 表） |
| 认证 | **Supabase Auth**（邮箱密码）+ 服务端管理员校验 |

### 3.2 理由

1. **与现有技术栈零冲突**：Tailwind 4 + React 19 + Vite 6 与 C 端完全一致，只有一套 UI 体系，样式统一、维护心智负担最小。
2. **稳定且可控**：shadcn/ui 无运行时依赖、无版本锁定，组件源码属于仓库，bug 修复可直接改源码；满足"稳定、容易维护"的硬要求。
3. **隔离部署、互不影响**：独立 Vite 应用，独立构建产物，部署为 `/admin` 子路径或独立域名；C 端发布与中后台发布互不阻塞。
4. **复用现有后端与数据**：Express 已持有 Supabase `service_role` admin client，管理 API 天然可绕过 RLS 读取全量数据；无需新数据库。
5. **可扩展**：TanStack Table 具备排序/筛选/分页/列显隐等企业级能力，满足用户、订单两大 CRUD 模块；后续新增简历管理、报表等模块只需在 `admin/` 内加路由与页面。

---

## 4. 目标架构

### 4.1 架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         浏览器（两个独立入口）                              │
│                                                                           │
│  ┌─────────────────────────┐            ┌─────────────────────────────┐  │
│  │  C 端应用 (React SPA)    │            │  中后台 Admin (独立 Vite)    │  │
│  │  /                        │            │  /admin                    │  │
│  │  Tailwind 4 + React 19   │            │  shadcn/ui + TanStack      │  │
│  └────────────┬─────────────┘            └──────────────┬──────────────┘  │
└───────────────┼────────────────────────────────────────┼─────────────────┘
                │ Supabase SDK (anon, 用户自见数据)         │ fetch (Bearer JWT, 管理数据)
                ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Express 服务端 (server.ts)                          │
│                                                                           │
│  /api/translate            ──  DeepSeek AI 翻译                          │
│  /api/payment/*            ──  支付/订单（已有）                          │
│  /api/admin/*              ──  新增：管理接口（管理员校验中间件）           │
│                                                                           │
│        │ service_role client（绕过 RLS）                                  │
│        ▼                                                                 │
│  ┌──────────────────────────────────────────────┐                        │
│  │              Supabase (PostgreSQL)            │                        │
│  │  auth.users │ users │ orders │ resumes        │                        │
│  └──────────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 技术栈明细

| 层 | 技术 | 说明 |
|----|------|------|
| 框架 | React 19 | 与 C 端一致 |
| 构建 | Vite 6 + TypeScript | 独立 `admin/` 构建入口 |
| 样式 | Tailwind CSS 4 + shadcn/ui | shadcn 组件基于 Radix + Tailwind 变量 |
| 路由 | React Router 7 | 嵌套路由 + 布局 + 路由守卫 |
| 数据表格 | @tanstack/react-table | 排序、筛选、分页、列显隐 |
| 服务端状态 | @tanstack/react-query | 列表/详情缓存、失效重取 |
| 请求 | fetch 封装 + JWT | 统一 admin API 客户端 |
| 表单 | react-hook-form（可选） | 编辑用户等表单场景 |
| 服务端 | Express（复用现有） | 新增 admin API 模块 |
| 图表 | recharts 或轻量 SVG | 仪表盘趋势图（可选） |

---

## 5. 目录结构

```
yiyejianli/
├── server.ts                  # 现有入口（新增挂载 admin 路由）
├── server/
│   ├── paymentService.ts      # 现有支付逻辑
│   └── adminAuth.ts           # 【新增】管理员鉴权中间件
│   └── adminUsers.ts          # 【新增】用户管理接口
│   └── adminOrders.ts         # 【新增】订单管理接口
│   └── adminStats.ts          # 【新增】仪表盘统计接口
│
├── admin/                     # 【新增】中后台独立 Vite 应用
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx           # 入口（React Router）
│       ├── App.tsx            # 路由配置
│       ├── components/
│       │   └── ui/            # shadcn/ui 组件源码
│       ├── layouts/
│       │   └── AdminLayout.tsx # 侧边栏 + 顶栏 + 内容区
│       ├── lib/
│       │   ├── api.ts         # admin API 客户端（JWT）
│       │   ├── auth.ts        # 登录/会话/管理员守卫
│       │   └── utils.ts       # cn() 等
│       ├── features/
│       │   ├── auth/LoginPage.tsx
│       │   ├── dashboard/DashboardPage.tsx
│       │   ├── users/
│       │   │   ├── UsersPage.tsx
│       │   │   ├── UserDetailPage.tsx
│       │   │   └── UserEditDrawer.tsx
│       │   └── orders/
│       │       ├── OrdersPage.tsx
│       │       └── OrderDetailDrawer.tsx
│       └── types.ts           # Admin 领域类型
└── docs/
    ├── admin-架构分析.md      # 本文档
    └── admin-PRD.md           # PRD 开发文档
```

---

## 6. 鉴权与权限模型

### 6.1 权限模型

系统只需**两级**权限：

| 角色 | 能力 |
|------|------|
| 管理员 | 登录中后台，查看/管理全部用户、订单 |
| 普通用户 | 无中后台访问权限（返回 403） |

### 6.2 管理员判定（双通道，任一命中即管理员）

| 通道 | 说明 |
|------|------|
| 环境变量 `ADMIN_EMAILS` | 逗号分隔的管理员邮箱白名单，如 `admin@example.com,ops@example.com`，**无需数据库迁移即可启用** |
| `users.is_admin` 字段 | 若 users 表存在 `is_admin` 布尔字段，值为 `true` 即管理员（为后续运营在后台提权预留） |

> **推荐做法**：初期使用 `ADMIN_EMAILS` 环境变量，零迁移成本；待需要在后台管理"管理员"后再落库 `is_admin` 字段。

### 6.3 服务端鉴权流程（中间件 `requireAdmin`）

```
请求 → Authorization: Bearer <supabase_jwt>
  │
  ├─ 无 token → 401
  │
  ├─ supabase.auth.getUser(jwt) 解析失败/过期 → 401
  │
  ├─ 判定管理员（ADMIN_EMAILS 白名单 或 users.is_admin=true）→ 非管理员 → 403
  │
  └─ 通过 → 注入 req.adminUser，进入业务处理
```

> **安全要点**：`service_role` key 仅存在于服务端，管理员接口只在服务端执行数据访问，前端永不接触 `service_role` key。

### 6.4 前端守卫

- 未登录访问 `/admin/*` → 重定向到登录页。
- 登录但非管理员（403）→ 提示无权限并登出。

---

## 7. 数据模型复用与扩展

### 7.1 复用的现有表

| 表 | 现有字段（摘要） | 中后台用途 |
|----|-----------------|-----------|
| `auth.users` | id, email, created_at | 用户注册信息基线 |
| `users` | id, email, tier, member_until, remaining_pdf_exports, remaining_png_exports, remaining_ats_checks | 用户会员信息（展示与编辑） |
| `orders` | id, user_id, plan_type, amount, payment_method, status, gateway_trade_no, created_at, paid_at, expires_at, completed_at | 订单管理（列表/详情/状态） |
| `resumes` | id, user_id, name, data(jsonb), score, status, template_id, updated_at | 简历管理（查看，P1 可选） |

### 7.2 建议新增字段（迁移脚本，PRD 附录提供）

| 表 | 新增字段 | 类型 | 说明 |
|----|---------|------|------|
| `users` | `is_admin` | boolean, default false | 管理员标记（可选，配合 ADMIN_EMAILS 双通道） |
| `users` | `status` | text, default 'active' | 用户状态（active / disabled）—— 便于封禁（可选） |

> 不新增字段也能先跑通全部功能（用户列表、订单列表、详情、编辑会员等级与配额）。

---

## 8. 与现有系统的关系

| 维度 | 关系说明 |
|------|---------|
| 数据 | 完全共享同一 Supabase 项目，无复制 |
| 服务端 | 复用现有 Express，仅新增 `/api/admin/*` 模块与中间件 |
| 前端 | 完全独立（`admin/` 独立构建），C 端代码零改动 |
| 部署 | 生产模式下 Express 托管 `dist/`（C 端）与 `dist/admin/`（中后台，/admin 子路径）；也可由 Nginx 独立反代 |
| 开发 | `npm run dev`（C 端）+ `npm run dev:admin`（中后台），互不干扰 |

---

## 9. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| `service_role` 泄露 | 数据全量泄露 | key 仅存服务端 env；admin API 全部经 `requireAdmin` 校验 |
| 管理员密码弱 | 后台被入侵 | 沿用 Supabase Auth；建议启用邮箱验证 |
| users 表无 is_admin 字段 | 管理员无法落库标记 | 用 `ADMIN_EMAILS` 白名单零迁移启用 |
| 大表列表性能 | 用户/订单量增长后查询慢 | 支持分页 + 服务端筛选 + 必要索引（orders.user_id, orders.created_at 等） |
| 中后台误操作（改错会员、误标订单） | 业务数据异常 | 关键操作二次确认；订单状态变更做状态机校验 |
| shadcn/ui 组件需自行组合 | 高级表格能力略多工作量 | TanStack Table 已覆盖；复杂能力按需渐进引入 |

---

*本文档为架构决策依据，具体功能需求见《admin-PRD.md》。*

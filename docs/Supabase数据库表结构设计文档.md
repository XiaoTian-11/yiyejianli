# 壹页简历 (YiYeJianLi) — Supabase 数据库表结构设计文档

> **版本:** v2.0  
> **更新日期:** 2026-06-02  
> **数据库类型:** PostgreSQL (via Supabase)  
> **认证服务:** Supabase Auth (GoTrue)  
> **依据:** [PRICING.md](../PRICING.md), [会员体系产品规格文档](./会员体系产品规格文档.md)  
> **说明:** v2.0 从 Firebase Firestore 迁移至 Supabase PostgreSQL，并新增会员相关表

---

## 目录

1. [数据库概述](#1-数据库概述)
2. [表结构设计](#2-表结构设计)
3. [SQL 建表语句](#3-sql-建表语句)
4. [行级安全策略 (RLS)](#4-行级安全策略-rls)
5. [索引设计](#5-索引设计)
6. [触发器](#6-触发器)
7. [数据迁移](#7-数据迁移)
8. [定价方案数据](#8-定价方案数据)

---

## 1. 数据库概述

### 1.1 技术选型

| 项目 | 选型 | 说明 |
|------|------|------|
| 数据库 | **Supabase (PostgreSQL 15+)** | 开源 BaaS，提供关系型数据库 |
| 认证 | **Supabase Auth** | 基于 GoTrue，支持邮箱/密码、手机号、OAuth |
| 存储结构 | **关系表** | 以 `resumes` 表为核心，新增 `users`/`orders` 表 |
| 客户端 SDK | `@supabase/supabase-js` | Web SDK |
| 迁移说明 | 从 Firebase Firestore (v1.0) 迁移至 Supabase PostgreSQL (v2.0) |

### 1.2 Supabase 项目信息

```
项目 URL:   https://yrwpnnkqfcylszankmuo.supabase.co
API Key:   (环境变量 SUPABASE_API_KEY)
匿名 Key:  (在 supabase.ts 中配置)
数据库类型: PostgreSQL 15+
认证方式:  邮箱密码登录 (Supabase Auth)
```

---

## 2. 表结构设计

### 2.1 表关系总览

```
auth.users (Supabase 内置)
    │
    ├── 1:1 ── public.users (会员信息)
    │
    ├── 1:N ── public.resumes (简历文档)
    │
    └── 1:N ── public.orders (支付订单)
```

### 2.2 表：`public.resumes`（简历）

当前核心数据表，存储用户简历。

#### 2.2.1 列定义

| 列名 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | `TEXT` | PK | — | 简历 ID（格式：`{randomId}_{userId}`） |
| `user_id` | `UUID` | FK → auth.users.id, NOT NULL | — | 用户 UID |
| `name` | `TEXT` | NOT NULL | `'未命名简历'` | 简历名称 |
| `data` | `JSONB` | NOT NULL | — | 简历完整数据（ResumeData） |
| `score` | `INTEGER` | — | `80` | AI 诊断评分（0-100） |
| `status` | `TEXT` | — | `'new'` | 简历状态：`'new'` / `'draft'` / `'completed'` |
| `template_id` | `TEXT` | — | `'modern'` | 当前使用的模板 ID |
| `updated_at` | `TIMESTAMPTZ` | — | `NOW()` | 最后更新时间 |

#### 2.2.2 当前 CREATE TABLE SQL

```sql
-- 如尚未创建，执行以下语句
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '未命名简历',
  data JSONB NOT NULL,
  score INTEGER DEFAULT 80,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'draft', 'completed')),
  template_id TEXT DEFAULT 'modern',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2.3 JSONB `data` 字段结构

`data` 列存储完整的简历数据，其 TypeScript 类型为 `ResumeData`：

```typescript
interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  summary_secondary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  skills_secondary?: string[];
  projects: Project[];
  customSections?: CustomSection[];
  sections: ResumeSection[];
  primaryLanguage?: string;       // 'zh' | 'en' | etc.
  secondaryLanguage?: string;
  displayMode?: 'primary' | 'secondary' | 'bilingual';
}
```

> 子类型定义详见 [API接口文档.md](./API接口文档.md) 附录。

### 2.3 表：`public.users`（用户会员信息）

**状态：** 待创建（P1 阶段实现）

存储用户的会员层级和导出配额。

#### 2.3.1 列定义

| 列名 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | `UUID` | PK, FK → auth.users.id | — | 用户 UID（与 auth.users 一对一） |
| `email` | `TEXT` | NOT NULL | — | 邮箱 |
| `tier` | `TEXT` | NOT NULL, CHECK | `'free'` | 会员层级：`'guest'` / `'free'` / `'member'` |
| `member_until` | `TIMESTAMPTZ` | — | `NULL` | 会员到期时间（NULL 表示非会员） |
| `remaining_pdf_exports` | `INTEGER` | NOT NULL | `0` | 剩余 PDF 导出次数 |
| `remaining_png_exports` | `INTEGER` | NOT NULL | `0` | 剩余 PNG 导出次数（未实现） |
| `remaining_ats_checks` | `INTEGER` | NOT NULL | `0` | 剩余 ATS 检测次数（未实现） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 注册时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 最后更新时间 |

#### 2.3.2 会员到期日计算方法

```typescript
function calculateMemberUntil(planType: PlanType): string {
  const now = new Date();
  switch (planType) {
    case 'week':         return addDays(now, 7);
    case 'month':        return addMonths(now, 1);
    case 'quarter':      return addMonths(now, 3);
    case 'year':         return addYears(now, 1);
    case 'lifetime':     return '2099-12-31T23:59:59Z';  // 永不过期
    case 'student_year': return addYears(now, 1);
    case 'single_export': return null;  // 单次导出不改 tier
  }
}
```

### 2.4 表：`public.orders`（订单记录）

**状态：** 待创建（P2 阶段实现）

存储用户的支付订单记录。

#### 2.4.1 列定义

| 列名 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | `TEXT` | PK | — | 订单号（格式：`WX/ALI_时间戳_随机`） |
| `user_id` | `UUID` | FK → auth.users.id, NOT NULL | — | 用户 UID |
| `plan_type` | `TEXT` | NOT NULL | — | 方案类型（`PlanType`） |
| `amount` | `NUMERIC(10,2)` | NOT NULL | — | 支付金额（元） |
| `payment_method` | `TEXT` | NOT NULL, CHECK | — | 支付方式：`'wechat'` / `'alipay'` |
| `status` | `TEXT` | NOT NULL, CHECK | `'pending'` | 状态：`'pending'` / `'paid'` / `'completed'` / `'expired'` / `'cancelled'` |
| `gateway_trade_no` | `TEXT` | — | `NULL` | 支付网关交易号 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | 创建时间 |
| `paid_at` | `TIMESTAMPTZ` | — | `NULL` | 支付时间 |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | — | 订单过期时间 |
| `completed_at` | `TIMESTAMPTZ` | — | `NULL` | 完成时间 |

#### 2.4.2 订单状态机

```
  pending ──────▶ paid ──────▶ completed
     │               │
     │               └──────────▶ refunded
     │
     ├──────────▶ expired (超时未支付)
     │
     └──────────▶ cancelled (用户取消)
```

---

## 3. SQL 建表语句

### 3.1 完整建表 DDL

```sql
-- ============================================================
-- 壹页简历 数据库建表 DDL
-- 在 Supabase SQL Editor 中按顺序执行
-- ============================================================

-- 3.1 resumes 表（已存在，如未创建则执行）
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '未命名简历',
  data JSONB NOT NULL,
  score INTEGER DEFAULT 80,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'draft', 'completed')),
  template_id TEXT DEFAULT 'modern',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 users 表（P1 阶段创建）
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('guest', 'free', 'member')),
  member_until TIMESTAMPTZ,
  remaining_pdf_exports INTEGER NOT NULL DEFAULT 0,
  remaining_png_exports INTEGER NOT NULL DEFAULT 0,
  remaining_ats_checks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 orders 表（P2 阶段创建）
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'expired', 'cancelled')),
  gateway_trade_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);
```

### 3.2 索引创建

```sql
-- resumes 表索引
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_updated ON public.resumes(user_id, updated_at DESC);

-- orders 表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- users 表索引（PK 自带索引）
```

---

## 4. 行级安全策略 (RLS)

### 4.1 resumes 表 RLS

```sql
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 读取：仅允许访问自己的简历
CREATE POLICY "Users can read own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

-- 写入：仅允许写入自己的简历（user_id 必须匹配当前用户）
CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新：仅允许更新自己的简历
CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

-- 删除：仅允许删除自己的简历
CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.2 users 表 RLS

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 读取：用户只能读取自己的数据
CREATE POLICY "Users can read own user data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 写入：仅服务端可通过触发器写入，客户端不可直接操作
CREATE POLICY "Users can insert own user data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 更新：允许用户更新自己的导出次数（服务端更新 membership 需使用 admin API）
CREATE POLICY "Users can update own user data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 4.3 orders 表 RLS

```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 读取：用户只能读取自己的订单
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- 创建：用户可创建自己的订单
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新/删除：禁止客户端直接修改订单（仅服务端通过支付回调操作）
-- （注意：这里不创建 UPDATE/DELETE policy，默认 deny）
```

---

## 5. 索引设计

### 5.1 当前索引

| 表 | 索引名称 | 列 | 类型 | 用途 |
|----|---------|-----|:----:|------|
| `resumes` | `idx_resumes_user_id` | `user_id` | B-tree | 按用户查询简历 |
| `resumes` | `idx_resumes_user_updated` | `user_id, updated_at DESC` | 复合 | 简历列表排序 |

### 5.2 建议补充索引

| 表 | 索引 | 用途 | 优先级 |
|----|------|------|:----:|
| `orders` | `(user_id, created_at DESC)` | 用户订单列表 | P2 |
| `orders` | `(status)` | 按状态筛选订单（批量处理） | P2 |
| `resumes` | `(user_id, status)` | 按状态筛选用户简历 | 可选 |

---

## 6. 触发器

### 6.1 自动更新 `updated_at`

```sql
-- 通用函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用到 resumes 表
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 应用到 users 表
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 6.2 注册时自动创建用户记录

```sql
-- 用户注册 Supabase Auth 后自动在 public.users 创建记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, remaining_pdf_exports)
  VALUES (NEW.id, NEW.email, 'free', 0);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 7. 数据迁移

### 7.1 Firebase → Supabase 数据迁移

因 v1 版本使用 Firebase Firestore，现有数据需迁移至 Supabase。

#### 7.1.1 迁移脚本（Node.js）

```typescript
// scripts/migrate-firebase-to-supabase.ts
import { firebaseDb } from './firebase-admin';
import { supabaseAdmin } from './supabase-admin';

async function migrateResumes() {
  // 1. 从 Firebase Firestore 读取所有简历
  const snapshot = await firebaseDb.collection('resumes').get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // 2. 写入 Supabase
    const { error } = await supabaseAdmin.from('resumes').insert({
      id: doc.id,
      user_id: data.userId,
      name: data.name || '未命名简历',
      data: data.data || {},
      score: data.score || 80,
      status: data.status || 'draft',
      template_id: data.templateId || 'modern',
      updated_at: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
    
    if (error) console.error(`迁移失败: ${doc.id}`, error);
  }
}
```

### 7.2 旧版数据兼容

当前代码在 `supabaseService.ts` 中已实现旧版路径兼容：

```
查询 resumes (WHERE user_id == X)
  │
  ├─ 有结果 → 返回列表
  │
  └─ 无结果 → 检查旧版 id == userId
       │
       ├─ 存在 → 规范化后写回
       │
       └─ 不存在 → 创建默认简历
```

---

## 8. 定价方案数据

### 8.1 方案列表（客户端常量）

此数据在 `src/constants.ts` 中维护，**非数据库存储**。

| type | 名称 | 价格 (¥) | 日均价格 | 分类 | 导出配额 |
|------|------|:---:|------|:-------:|:--------:|
| `single_export` | 单次导出 | 5.9 | — | `one_time` | 1 |
| `week` | 周卡会员 | 9.9 | 1.4 元/天 | `subscription` | — |
| `month` | 月卡会员 | 15.0 | 0.5 元/天 | `subscription` | — |
| `quarter` | 季卡会员 | 36.0 | 0.4 元/天 | `subscription` | — |
| `year` | 年卡会员 | 99.0 | 0.27 元/天 | `subscription` | — |
| `lifetime` | 终身卡 | 199.0 | — | `subscription` | — |
| `student_year` | 学生年卡 | 49.0 | 0.13 元/天 | `subscription` | — |

### 8.2 TypeScript 类型定义（`src/types.ts`）

```typescript
type PlanType = 'single_export' | 'week' | 'month' | 'quarter' | 'year' | 'lifetime' | 'student_year';
type PlanCategory = 'one_time' | 'subscription';

interface Plan {
  type: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  dailyPrice: string;
  target: string;
  features: string[];
  highlight?: boolean;
  category: PlanCategory;     // 新增
  exportQuota?: number;       // 新增
}
```

---

## 附录 A：与 v1.0（Firebase）对比

| 项目 | v1.0 (Firebase) | v2.0 (Supabase) |
|------|-----------------|-----------------|
| 数据库类型 | Firestore NoSQL | PostgreSQL 关系型 |
| 认证服务 | Firebase Auth | Supabase Auth |
| 客户端 SDK | `firebase` | `@supabase/supabase-js` |
| 简历存储 | 集合 `resumes` | 表 `public.resumes` |
| 用户数据 | 仅在应用层内存中 | 表 `public.users` |
| 订单数据 | 无 | 表 `public.orders` |
| 字段类型 | 无 Schema | 严格的列类型 + CHECK 约束 |
| 安全规则 | Firestore Rules | RLS Policies |
| 旧版兼容 | `localStorage` demo + 旧路径 | 旧版路径自动检测迁移 |

## 附录 B：相关文件位置

| 文件 | 说明 |
|------|------|
| `src/lib/supabase.ts` | Supabase 客户端初始化 |
| `src/lib/supabaseService.ts` | 简历 CRUD 操作封装 |
| `src/types.ts` | TypeScript 类型定义 |
| `src/constants.ts` | 定价方案常量 |
| `src/App.tsx` | 用户状态管理（需改造持久化） |

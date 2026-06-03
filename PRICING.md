# 壹页简历 — 定价策略文档

> 基于代码现状整理的会员权益体系与定价策略。
> 更新日期：2026-06-02

---

## 一、用户分层

| 层级 | 类型标签 | 说明 |
|------|----------|------|
| `guest` | 未登录访客 | 未注册/未登录用户，仅可浏览首页、模板列表和定价页 |
| `free` | 普通用户（免费） | 已注册登录，未付费。可创建和编辑简历，但不可导出 |
| `member` | 尊享会员 | 已付费订阅用户，解锁全部高级功能 |

---

## 二、功能权益矩阵

### 2.1 模板系统

| 功能 | `guest` / `free` | `member` |
|------|:-:|:-:|
| 浏览模板列表 | ✅ | ✅ |
| 预览模板详情 | ✅ | ✅ |
| 使用基础模板（free 模板） | ✅ | ✅ |
| 使用 premium 模板 | ❌ | ✅ |
| 模板总数 | 6 套免费 | 14 套全部 |

**免费模板（6 套）：** 现代商务、经典学术、极简风格、雅雅风尚商务、现代双栏效率

**会员专属模板（8 套）：** 大厂高通过率模板、应届生校招模板、开源极客风格、金融投资精英、麦肯森医疗科研、创意视觉设计、大国重器工程建设、市场高能销售、律所高端合伙人

> 注：页面文案写"500+ 套精选模板"，实际代码中仅有 14 套——这是宣传文案夸大，需统一。

### 2.2 简历管理

| 功能 | `free` | `member` |
|------|:-:|:-:|
| 创建/编辑简历 | ✅ | ✅ |
| 简历数量上限 | 5 份 | 30 份 |
| 自动保存 | ✅ | ✅ |
| 版本管理 | 有限 | 30 个版本 |

### 2.3 编辑功能限制

| 功能 | `free` | `member` |
|------|:-:|:-:|
| 核心模块编辑 | ✅ | ✅ |
| 自定义板块 | 最多 3 个 | 最多 99 个 |
| 双语排版 | ✅ | ✅ |
| 模块拖拽排序 | ✅ | ✅ |

### 2.4 导出与下载

| 功能 | `free` | `member` |
|------|:-:|:-:|
| PDF 导出 | ❌ 不可导出（需购买） | ✅ 无限次无水印导出 |
| 单次购买导出 | ✅ 支付后可导出（无水印） | — |
| PNG 导出 | ❌ 未实现 | ❌ 未实现 (计划中) |
| 预览水印 | ❌ 无水印 | ❌ 无水印 |

**免费用户导出流程：**

```
用户点击"导出 PDF"
  → 检查 remainingPdfExports
  → 为 0 → 弹出购买弹窗（见下图）
  → 选择"单次导出"或"开通会员"
  → 支付成功 → remainingPdfExports +1（单次）或变为 ∞（会员）
  → 执行导出（无水印）
```

**购买弹窗内容：**
- **单次导出** — ¥5.9，立即支付，获得 1 次 PDF 导出机会
- **开通会员** — 跳转到会员方案页，无限次导出 + 全部权益
- 弹窗底部显示："您当前没有导出次数，请选择以上方式继续"

**设计原则：** 预览是编辑体验的一部分，不应设限。水印只应在导出的 PDF 中出现（由 PDF 生成层控制），而非预览层。当前代码在预览 DOM 上叠加水印，需移除。**导出限制通过次数门禁实现，而非视觉遮挡。**

---

## 三、定价方案

### 3.1 方案列表

| 方案 | 类型 | 价格 | 日均价 | 定位 |
|------|------|:----:|:------:|------|
| **单次导出** | `single_export` | **¥5.9** | — | 临时需要导出一次 |
| **周卡会员** | `week` | ¥9.9 | 1.4 元/天 | 临时求职用户 |
| **月卡会员** | `month` | ¥15 | 0.5 元/天 | 短期求职用户（最受欢迎） |
| **季卡会员** | `quarter` | ¥36 | 0.4 元/天 | 跳槽季用户 |
| **年卡会员** | `year` | ¥99 | 0.27 元/天 | 职场新人 |
| **终身卡** | `lifetime` | ¥199 | — | 长期职场人士 |
| **学生年卡** | `student_year` | ¥49 | 0.13 元/天 | 在校学生 |

### 3.2 各方案权益明细

| 权益 | 单次导出 | 所有订阅会员 |
|------|:-:|:-:|
| 全部 14 套专业模板 | ❌（仅 6 套免费） | ✅ |
| 无水印 PDF 导出 | ✅ 1 次 | ✅ 无限次 |
| 实时自动保存 | ✅ | ✅ |
| 专属人工客服 | ❌ | ✅ |
| ATS 兼容性检测 | ❌ | ✅（未实装） |
| 30 个简历版本管理 | ❌（5 份上限） | ✅ |
| 跨设备实时同步 | ✅ | ✅ |

**单次导出设计要点：**
- 不改变用户 `tier`，仅增加 `remainingPdfExports` 计数
- 导出的 PDF 无水印
- 不可累积（单次购买的次数在导出后即消耗）
- 定价 ¥5.9 ≈ 月卡价格的 1/3，形成价格锚定（"月卡 ¥15 可无限导出，单次就要 ¥5.9"）

### 3.3 价格锚定策略

```
单次导出 ¥5.9  ← 锚点：让月卡 ¥15 显得"超值"
      ↓
月卡 ¥15         ← 主推方案：比单次多 2 次就回本
      ↓
年卡 ¥99         ← 长期锁定：日均 ¥0.27 让用户觉得"不买就亏"
```

---

## 四、后端状态清单

### 已实现 ✅

- [x] 用户登录/注册认证（Supabase Auth）
- [x] 简历 CRUD（Supabase 数据库）
- [x] ~~预览水印~~ **→ 已决定移除，预览不再加水印**
- [x] 模板筛选（免费/会员模板标记与门禁）
- [x] 自定义板块数量限制（free: 3, member: 99）
- [x] 简历数量限制（free: 5, member: 30）
- [x] 升级弹窗触发（触发条件齐全）

### 未实现 / 待完善 ❌

- [ ] **`tier` 持久化到 Supabase** — 当前仅在 React state 中。刷新后所有用户恢复为 `free`
- [ ] **`memberUntil` 过期检查** — 定义但从未读取。会员过期后应自动降级为 `free`
- [ ] **PDF 导出次数限制** — `remainingPdfExports` 已定义但从未检查/递减
- [ ] **免费用户导出拦截** — 当前免费用户可无限导出，需改为 0 次 + 弹出购买弹窗
- [ ] **单次导出（`single_export`）购买入口** — 点击导出时弹窗，提供单次购买选项
- [ ] **单次导出计费逻辑** — 支付后 `remainingPdfExports + 1`，导出后 `-1`
- [ ] **`PlanType` 添加 `single_export`** — 类型定义中补充，`PLANS` 常量中新增方案
- [ ] **移除预览水印** — `ResumePreview.tsx` 中删除 watermark DOM 层，预览不再显示"壹页简历·未激活"字样
- [ ] **PNG 导出** — UI 中无入口，后端也未实现
- [ ] **ATS 检测次数限制** — `remainingAtsChecks` 已定义但从未使用
- [ ] **真实支付对接** — `UpgradeModal` 和 `PaymentPage` 都是前端 `setTimeout` 模拟
- [ ] **不同订阅方案逻辑区分** — 周卡/月卡/年卡/终身卡等 6 种方案在代码中无任何行为差异
- [ ] **统一宣传文案** — "500+ 套模板"改为实际数量

---

## 五、用户流程

### 注册 → 免费用户
```
用户注册 → Supabase Auth → 初始化 appUser（tier: 'free', remainingPdfExports: 0）
  → 进入 Dashboard → 创建/编辑简历 → 实时预览（无水印）
  → 点击导出 PDF → 次数为 0 → 弹出购买弹窗
  →   ├─ 选择"单次导出 ¥5.9" → 支付 → remainingPdfExports = 1 → 导出（无水印）
  │   └─ 选择"开通会员" → 跳转定价页 → 支付 → tier = 'member' → 无限导出
```

### 升级 → 会员用户
```
用户点击升级 → UpgradeModal 弹窗
  → 选择方案 → 模拟支付
  → onSuccess() → appUser.tier = 'member'
  → appUser.remainingPdfExports = 999
  → 刷新页面 → appUser 重新初始化为 'free'（← 需修复持久化）
```

### 会员权益生效
```
tier === 'member' 时：
  - ResumeEditor 自定义板块上限 99
  - Dashboard 简历上限 30
  - TemplatesPage premium 模板可选
  - 导出按钮直接导出，无购买弹窗
```

---

## 六、建议实现优先级

### P0 — 核心流程（必须先做）
1. **免费用户导出拦截 + 购买弹窗** — 点击导出时检查次数，为 0 时弹窗
2. **`PlanType` 添加 `single_export`** — 类型定义 + `PLANS` 常量
3. **单次导出支付回调** — 支付成功后 `remainingPdfExports + 1`
4. **导出次数扣减** — 导出后 `remainingPdfExports - 1`（仅对非会员）

### P1 — 会员体系完善
5. **`tier` 持久化到 Supabase** — `users` 表 + 登录时读取
6. **`memberUntil` 过期检查** — 登录时检查，过期自动降级
7. **统一宣传文案** — "500+ 套模板"改为实际数量

### P2 — 商业闭环
8. **真实支付对接** — 接入微信/支付宝支付 API
9. **订单记录** — 写入 Supabase，Dashboard 展示真实订单
10. **PNG 导出** — UI 添加入口

---

## 七、需要修改的代码文件

| 文件 | 修改内容 |
|------|----------|
| `src/types.ts` | `PlanType` 添加 `'single_export'`；添加 `PlanCategory` 区分 subscription / one-time |
| `src/constants.ts` | `PLANS` 添加单次导出方案；`TEMPLATES` 文案修正 |
| `src/App.tsx` | `setAppUser` 初始化 `remainingPdfExports: 0`；导出按钮点击时检查次数 |
| `src/components/ResumePreview.tsx` | 移除预览水印 DOM 层（约 181-187 行） |
| `src/components/UpgradeModal.tsx` | 改为通用购买弹窗，支持单次和订阅两种模式 |
| `src/pages/PricingPage.tsx` | 定价页展示单次导出方案 |

---

## 八、数据模型

### User 对象（当前定义，保持不变）

```typescript
interface User {
  id: string;
  email: string;
  tier: MembershipTier;           // 'free' | 'member'
  memberUntil?: string;           // 会员到期日
  remainingPdfExports: number;    // 剩余 PDF 导出次数
  remainingPngExports: number;    // 剩余 PNG 导出次数（未实现）
  remainingAtsChecks: number;     // 剩余 ATS 检测次数（未实现）
}
```

### Plan 对象（需扩展）

```typescript
type PlanType = 'single_export' | 'week' | 'month' | 'quarter' | 'year' | 'lifetime' | 'student_year';
type PlanCategory = 'one_time' | 'subscription';  // 新增：区分单次购买和订阅

interface Plan {
  type: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  dailyPrice: string;
  target: string;
  features: string[];
  highlight?: boolean;
  category: PlanCategory;          // 新增
  exportQuota?: number;            // 新增：单次方案给多少次导出
}
```

### 初始化值

```typescript
// 注册时
const defaultAppUser = {
  tier: 'free',
  remainingPdfExports: 0,
  remainingPngExports: 0,
  remainingAtsChecks: 0,
};

// 升级为 member 时
const memberAppUser = {
  tier: 'member',
  memberUntil: '2026-12-31',
  remainingPdfExports: 999,
  remainingPngExports: 999,
  remainingAtsChecks: 999,
};

// 购买单次导出时
appUser.remainingPdfExports += 1;
```

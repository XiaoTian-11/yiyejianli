export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  website: string;
  linkedin: string;
  photo?: string; // base64 data URL
  fullName_secondary?: string;
  location_secondary?: string;
  jobTitle_secondary?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  company_secondary?: string;
  position_secondary?: string;
  description_secondary?: string;
  startDate_secondary?: string;
  endDate_secondary?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  school_secondary?: string;
  degree_secondary?: string;
  startDate_secondary?: string;
  endDate_secondary?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link?: string;
  role?: string;
  role_secondary?: string;
  startDate?: string;
  endDate?: string;
  startDate_secondary?: string;
  endDate_secondary?: string;
  name_secondary?: string;
  description_secondary?: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  content: string;
  title_secondary?: string;
  content_secondary?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
  title_secondary?: string;
}

export type SectionType = 'personal' | 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'custom';

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  title_secondary?: string; // Optional subtitle/translation
  customId?: string; // For linking to customSections
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  customSections?: CustomSection[];
  sections: ResumeSection[];
  primaryLanguage?: string; // e.g. 'zh'
  secondaryLanguage?: string; // e.g. 'en'
  displayMode?: 'primary' | 'secondary' | 'bilingual';
  summary_secondary?: string;
  skills_secondary?: string[];
  /** 纯翻译模式：记录翻译前的原始语言，如 'zh' */
  _sourceLanguage?: string;
  /** 纯翻译模式：翻译前的原始内容 JSON 备份，用于恢复原文 */
  _originalBackup?: string;
}

export type TemplateId = string;

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  isPremium: boolean;
  tags: string[];
}

export interface TemplateProps {
  data: ResumeData;
}

export interface ResumeMeta {
  id: string;
  name: string;
  updatedAt: string;
  status: 'new' | 'draft' | 'completed';
  score: number;
}

export interface Order {
  id: string;
  title: string;
  orderNumber: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending';
}

export type MembershipTier = 'guest' | 'free' | 'member';

export interface User {
  id: string;
  email: string;
  tier: MembershipTier;
  memberUntil?: string; // ISO date string
  remainingPdfExports: number;
  remainingPngExports: number;
  remainingAtsChecks: number;
  /** 账户状态：disabled 表示已被管理员禁用，登录后将被自动登出 */
  status?: 'active' | 'disabled';
  /** 用户专属邀请码（6 位） */
  inviteCode?: string;
  /** 已邀请人数 */
  invitedCount?: number;
  /** 已获邀请奖励次数（0-2） */
  referralBonusCount?: number;
}

/** 邀请进度（个人中心卡片展示用） */
export interface ReferralStats {
  invitedCount: number;      // 已邀请人数
  bonusCount: number;        // 已获得邀请奖励次数（0-2）
}

/** 邀请奖励活动配置（总开关） */
export interface AppConfig {
  referralEnabled: boolean;  // 活动总开关
}

export type PlanType = 'single_export' | 'week' | 'month' | 'quarter' | 'year' | 'lifetime' | 'student_year';

export type PlanCategory = 'one_time' | 'subscription';

export interface Plan {
  type: PlanType;
  name: string;
  price: number;
  originalPrice?: number;
  dailyPrice: string;
  target: string;
  features: string[];
  highlight?: boolean;
  category: PlanCategory;
  exportQuota?: number;
}

export type Page = 'home' | 'templates' | 'pricing' | 'builder' | 'dashboard' | 'payment';

export type DashboardSection = 'overview' | 'resumes' | 'orders' | 'members' | 'settings';

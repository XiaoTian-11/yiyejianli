import type { Page } from '../types';

/** 页面 → URL 路径的单一数据源 */
export const PAGE_PATH: Record<Page, string> = {
  home: '/',
  templates: '/templates',
  pricing: '/pricing',
  builder: '/builder',
  dashboard: '/dashboard',
  payment: '/payment',
};

/** 需要登录才能访问的路径 */
export const PROTECTED_PATHS = ['/dashboard', '/builder', '/payment'];

export const isProtectedPath = (p: string): boolean => PROTECTED_PATHS.includes(p);

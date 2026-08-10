#!/usr/bin/env node
/**
 * 壹页简历 — Supabase 配置自检脚本
 * 用法：node scripts/check-supabase.mjs
 *
 * 检测项：
 *  1. .env 是否包含 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *  2. URL 格式是否正确（https://<project-ref>.supabase.co）
 *  3. 项目域名是否可解析（DNS）
 *  4. 认证服务是否可达（auth/v1/health）
 * 常见的"注册/登录连不上服务器"问题，90% 能在这里定位。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dns from 'node:dns/promises';

const envPath = resolve(process.cwd(), '.env');

function parseEnv(filePath) {
  try {
    const text = readFileSync(filePath, 'utf8');
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!m) continue;
      out[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
    return out;
  } catch {
    return null;
  }
}

const fail = (label, msg) => { console.log(`  ❌ ${label}: ${msg}`); return false; };
const pass = (label, msg) => { console.log(`  ✅ ${label}: ${msg}`); return true; };

console.log('Supabase 配置自检\n');

const env = parseEnv(envPath);
if (!env) { console.log('  ❌ 未找到 .env 文件'); process.exit(1); }

const url = env.VITE_SUPABASE_URL || '';
const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
let ok = true;

// 1. 必填项
console.log('— 1. 环境变量 —');
if (!url) { ok = false; fail('VITE_SUPABASE_URL', '缺失'); }
if (!anonKey) { ok = false; fail('VITE_SUPABASE_ANON_KEY', '缺失'); }
if (url && anonKey) pass('环境变量', '已配置');

// 2. URL 格式
console.log('\n— 2. URL 格式 —');
const m = /^https:\/\/([a-z0-9-]+)\.supabase\.co$/.exec(url);
if (url && !m) { ok = false; fail('URL 格式', `不合法: ${url}`); }
else if (url) { ok = false; pass('URL 格式', url); }

// 3. 域名解析（DNS）
if (m) {
  console.log('\n— 3. 域名解析（DNS）—');
  try {
    const addrs = await dns.lookup(m[1] + '.supabase.co');
    console.log(`  ✅ 解析成功 → ${addrs.address}`);
  } catch (e) {
    ok = false;
    console.log(`  ❌ 解析失败: ${e.code || e.message}`);
    console.log(`     → 项目域名不存在。项目可能已删除/被暂停/ref 写错。`);
    console.log(`       请到 https://supabase.com/dashboard/projects 核对，或看该项目 Settings → API 中的 Project URL。`);
  }
}

// 4. 认证服务可达性
if (url) {
  console.log('\n— 4. 认证服务可达性 —');
  try {
    const start = Date.now();
    // 注意：auth/v1/health 不带 apikey 会返回 401（这是正常行为），必须带 anon key 判断
    const res = await fetch(url + '/auth/v1/health', {
      headers: anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : undefined,
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - start;
    if (res.ok) {
      pass('auth/v1/health', `HTTP ${res.status}，认证服务正常（${ms}ms）`);
      if (ms > 1000) {
        ok = false;
        console.log(`     ⚠️ 延迟 ${ms}ms 偏高。supabase.co 在境内访问通常 2~4s，`);
        console.log(`       面向国内用户建议迁移到国内自托管 Supabase 或国内 BaaS。`);
      }
    } else {
      ok = false;
      console.log(`  ❌ HTTP ${res.status}（项目可能被暂停，请到 Dashboard 恢复）`);
    }
  } catch (e) {
    ok = false;
    console.log(`  ❌ 连接失败: ${e.message}`);
    console.log(`     → 域名不可达。可能原因：项目被删除/暂停、网络无法访问 supabase.co`);
  }
}

console.log('\n' + (ok ? '✅ 全部正常，注册/登录应可正常工作' : '❌ 存在配置问题，请按上方提示修复后再试'));
process.exit(ok ? 0 : 1);

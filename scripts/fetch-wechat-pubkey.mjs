// ============================================================================
// 拉取微信支付公钥（微信支付公钥模式）
// 调用 GET /v3/platservice/public-keys，用商户 API 证书签名，返回 PEM 公钥列表。
// 验证与 .env 的 WECHAT_PUB_KEY_ID 匹配后，写入 certs/wechatpay_pub.pem
//
// 用法：node scripts/fetch-wechat-pubkey.mjs
// 前置：.env 已配置 WECHAT_MCHID / WECHAT_SERIAL_NO / WECHAT_PRIVATE_KEY_PATH
//       WECHAT_PUB_KEY_ID（可选，商户平台「微信支付公钥」旁的 ID，用于校验）
// ============================================================================
import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

const API_BASE = 'https://api.mch.weixin.qq.com';
const URL_PATH = '/v3/platservice/public-keys';

const mchid = process.env.WECHAT_MCHID || '';
const serialNo = process.env.WECHAT_SERIAL_NO || '';
const keyPath = process.env.WECHAT_PRIVATE_KEY_PATH || './certs/apiclient_key.pem';
const expectedId = process.env.WECHAT_PUB_KEY_ID || ''; // 可选校验

if (!mchid || !serialNo) {
  console.error('❌ 缺少 WECHAT_MCHID / WECHAT_SERIAL_NO，请检查 .env');
  process.exit(1);
}

// 构建 APIv3 签名头
const timestamp = Math.floor(Date.now() / 1000);
const nonce = crypto.randomBytes(16).toString('hex');
const message = `GET\n${URL_PATH}\n${timestamp}\n${nonce}\n\n`;
const privateKey = readFileSync(path.resolve(root, keyPath), 'utf8');
const signature = crypto.createSign('RSA-SHA256').update(message).sign(privateKey, 'base64');
const authorization = [
  'WECHATPAY2-SHA256-RSA2048',
  `mchid="${mchid}"`,
  `nonce_str="${nonce}"`,
  `signature="${signature}"`,
  `timestamp="${timestamp}"`,
  `serial_no="${serialNo}"`,
].join(',');

console.log('==> 请求微信支付公钥接口...');
const res = await fetch(`${API_BASE}${URL_PATH}`, {
  headers: { Authorization: authorization, Accept: 'application/json' },
});
const text = await res.text();

if (!res.ok) {
  console.error(`❌ 请求失败 (${res.status}): ${text}`);
  process.exit(1);
}

const json = JSON.parse(text);
const keys = json.data || [];
console.log(`   接口返回 ${keys.length} 个公钥`);

keys.forEach((k) => {
  console.log(`   serial_no=${k.serial_no}  生效=${k.effective_time} 过期=${k.expire_time}`);
});

// 校验目标公钥
let target = keys[0];
if (expectedId) {
  target = keys.find((k) => k.serial_no === expectedId);
  if (!target) {
    console.error(`❌ 未找到 serial_no=${expectedId} 的公钥。`);
    console.error(`   实际列表：${keys.map((k) => k.serial_no).join(', ')}`);
    process.exit(1);
  }
  console.log(`✅ ID 校验通过：${target.serial_no}`);
}

const pem = target.public_key;
if (!pem || !pem.includes('-----BEGIN')) {
  console.error('❌ 返回内容缺少 PEM 公钥：', JSON.stringify(target));
  process.exit(1);
}

const outPath = path.join(root, 'certs', 'wechatpay_pub.pem');
writeFileSync(outPath, pem);
console.log(`✅ 已写入 ${outPath}`);
console.log(`   文件头: ${pem.split('\n')[0]}`);
console.log(`   文件长: ${pem.length} 字节`);

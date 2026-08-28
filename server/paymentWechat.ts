import crypto from 'crypto';
import { readFileSync } from 'fs';
import type { OrderProvider, JsapiParams } from './paymentService';

// ============================================================================
// 微信支付 APIv3 Native 扫码支付 provider（PAYMENT_PROVIDER=wechat）
//
// 切到真实支付前，需在 .env 配置：
//   PAYMENT_PROVIDER=wechat
//   WECHAT_APPID=wx...                     商户绑定的小程序/公众号 appid
//   WECHAT_MCHID=1900...                   商户号
//   WECHAT_SERIAL_NO=...                   商户 API 证书序列号
//   WECHAT_PRIVATE_KEY=...                 商户 API 私钥（PEM 内容，单行 base64 或路径）
//   WECHAT_API_V3_KEY=...                  商户 APIv3 密钥（32 字节，用于回调解密）
//   WECHAT_PLATFORM_PUBLIC_KEY=...         微信支付平台公钥（PEM，用于回调验签）
// 且服务器需 HTTPS 域名，并确保 APP_URL 指向线上地址（回调通知用）。
//
// 参考：https://pay.weixin.qq.com/doc/v3/merchant/4012791881
// ============================================================================

const API_BASE = 'https://api.mch.weixin.qq.com';

function readPemFromEnv(value: string | undefined, pathVal: string | undefined, label: string): string {
  const fromPath = (p?: string) => (p ? readFileSync(p, 'utf8') : undefined);
  const pem = value || fromPath(pathVal);
  if (!pem) throw new Error(`微信支付缺少配置: ${label}`);
  // 允许 base64 单行
  if (!pem.includes('-----BEGIN')) {
    const decoded = Buffer.from(pem, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN')) return decoded;
  }
  return pem;
}

export function loadWechatConfig() {
  return {
    appid: process.env.WECHAT_APPID || '',
    mchid: process.env.WECHAT_MCHID || '',
    serialNo: process.env.WECHAT_SERIAL_NO || '',
    privateKey: readPemFromEnv(process.env.WECHAT_PRIVATE_KEY, process.env.WECHAT_PRIVATE_KEY_PATH, 'WECHAT_PRIVATE_KEY'),
    apiV3Key: process.env.WECHAT_API_V3_KEY || '',
    platformPublicKey: readPemFromEnv(process.env.WECHAT_PLATFORM_PUBLIC_KEY, process.env.WECHAT_PLATFORM_PUBLIC_KEY_PATH, 'WECHAT_PLATFORM_PUBLIC_KEY'),
  };
}

/** 构建 APIv3 请求签名头 */
function buildAuthorization(method: string, urlPath: string, bodyStr: string, cfg: ReturnType<typeof loadWechatConfig>): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${bodyStr}\n`;
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(cfg.privateKey, 'base64');
  // 官方格式：scheme + 空格 + 逗号分隔参数（WECHATPAY2-SHA256-RSA2048 mchid="...",nonce_str="...",...）
  return `WECHATPAY2-SHA256-RSA2048 ${[
    `mchid="${cfg.mchid}"`,
    `nonce_str="${nonce}"`,
    `signature="${signature}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${cfg.serialNo}"`,
  ].join(',')}`;
}

async function requestWechat(method: string, urlPath: string, body: unknown): Promise<any> {
  const cfg = loadWechatConfig();
  if (!cfg.appid || !cfg.mchid || !cfg.serialNo) {
    throw new Error('微信支付未配置完整（WECHAT_APPID/WECHAT_MCHID/WECHAT_SERIAL_NO），请检查 .env');
  }
  const bodyStr = body ? JSON.stringify(body) : '';
  const authorization = buildAuthorization(method, urlPath, bodyStr, cfg);
  const url = `${API_BASE}${urlPath}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: bodyStr || undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`微信支付请求失败(${res.status}): ${text}`);
    }
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timer);
  }
}

/** 使用 APIv3 密钥解密微信回调资源（AES-256-GCM） */
export function decryptResource(apiV3Key: string, resource: { ciphertext: string; nonce: string; associated_data?: string }): string {
  const key = Buffer.from(apiV3Key, 'utf8');
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  if (ciphertext.length < 16) throw new Error('回调密文长度非法');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'));
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
  }
  return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
}

/** 验证微信回调签名（用微信支付平台公钥） */
export function verifyNotifySignature(
  cfg: ReturnType<typeof loadWechatConfig>,
  headers: Record<string, string | undefined>,
  rawBody: string
): void {
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const signature = headers['wechatpay-signature'];
  if (!timestamp || !nonce || !signature) {
    throw new Error('微信回调缺少验签头（Wechatpay-Timestamp/Nonce/Signature）');
  }
  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(message);
  const ok = verifier.verify(cfg.platformPublicKey, signature, 'base64');
  if (!ok) throw new Error('微信回调验签失败');
}

/** 构建 JSAPI 调起签名（微信内 WeixinJSBridge 用） */
function buildJsapiPaySign(cfg: ReturnType<typeof loadWechatConfig>, params: { appId: string; timeStamp: string; nonceStr: string; package: string }): string {
  const message = `${params.appId}\n${params.timeStamp}\n${params.nonceStr}\n${params.package}\n`;
  return crypto.createSign('RSA-SHA256').update(message).sign(cfg.privateKey, 'base64');
}

/** 生成 JSAPI 调起参数（微信内直接拉起支付，无需扫码） */
function makeJsapiParams(cfg: ReturnType<typeof loadWechatConfig>, prepayId: string): JsapiParams {
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const pkg = `prepay_id=${prepayId}`;
  return {
    appId: cfg.appid,
    timeStamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign: buildJsapiPaySign(cfg, { appId: cfg.appid, timeStamp, nonceStr, package: pkg }),
  };
}

/** 公众号网页授权：code 换 openid（用于 JSAPI 支付） */
export async function getOpenidByCode(code: string): Promise<{ openid: string; scope?: string }> {
  const appid = process.env.WECHAT_APPID || '';
  const secret = process.env.WECHAT_APPSECRET || '';
  if (!appid || !secret) throw new Error('微信JSAPI支付需要 WECHAT_APPID + WECHAT_APPSECRET（公众号AppSecret）');
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.openid) throw new Error(`换取openid失败: ${JSON.stringify(data)}`);
  return { openid: data.openid, scope: data.scope };
}

/** 退款结果（微信 /v3/refund/domestic/refunds 响应的关键字段） */
export interface WechatRefundResult {
  refund_id?: string;
  out_refund_no: string;
  out_trade_no: string;
  /** 退款状态：SUCCESS=成功 CLOSED=关闭 PROCESSING=处理中 ABNORMAL=异常 */
  status?: 'SUCCESS' | 'CLOSED' | 'PROCESSING' | 'ABNORMAL';
  refund_amount?: number;
  [key: string]: unknown;
}

/**
 * 发起退款（APIv3）。outRefundNo 是幂等键：同单号重复请求微信返回同一退款单。
 * 文档：https://pay.weixin.qq.com/doc/v3/merchant/4012791881（退款）
 */
export async function wechatRefund(input: {
  outTradeNo: string;
  outRefundNo: string;
  /** 退款金额（分），必须 ≤ 原支付金额 */
  refundFen: number;
  /** 原订单金额（分） */
  totalFen: number;
  reason?: string;
  /** 退款结果回调地址（POST，成功后状态变更会通知） */
  notifyUrl?: string;
}): Promise<WechatRefundResult> {
  const cfg = loadWechatConfig();
  const body: Record<string, unknown> = {
    out_trade_no: input.outTradeNo,
    out_refund_no: input.outRefundNo,
    amount: { refund: input.refundFen, total: input.totalFen, currency: 'CNY' },
  };
  if (input.reason) body.reason = input.reason.slice(0, 80);
  if (input.notifyUrl) body.notify_url = input.notifyUrl;
  return await requestWechat('POST', '/v3/refund/domestic/refunds', body) as WechatRefundResult;
}

/** 查询退款单状态（out_refund_no 商户退款单号），兜底回调丢失 */
export async function queryWechatRefund(outRefundNo: string): Promise<WechatRefundResult> {
  return await requestWechat('GET', `/v3/refund/domestic/refunds/${encodeURIComponent(outRefundNo)}`, null) as WechatRefundResult;
}

export const wechatProvider: OrderProvider = {
  name: 'wechat',

  async createOrder({ orderId, description, amountFen, notifyUrl, channel, openid }) {
    const cfg = loadWechatConfig();

    // 微信内（JSAPI）：直接调起支付，需要 openid
    if (channel === 'jsapi') {
      if (!openid) throw new Error('JSAPI支付缺少 openid（需先通过公众号网页授权获取）');
      const body = {
        appid: cfg.appid,
        mchid: cfg.mchid,
        description: description.slice(0, 127),
        out_trade_no: orderId,
        notify_url: notifyUrl,
        amount: { total: amountFen, currency: 'CNY' },
        payer: { openid },
      };
      const data = await requestWechat('POST', '/v3/pay/transactions/jsapi', body);
      if (!data.prepay_id) throw new Error(`JSAPI下单未返回 prepay_id: ${JSON.stringify(data)}`);
      return { codeUrl: '', gatewayTradeNo: undefined, jsapiParams: makeJsapiParams(cfg, data.prepay_id) };
    }

    // 默认：Native 扫码支付（桌面/非微信浏览器；个体户资质不支持 H5 支付，故非微信手机浏览器也退回扫码）
    const body = {
      appid: cfg.appid,
      mchid: cfg.mchid,
      description: description.slice(0, 127),
      out_trade_no: orderId,
      notify_url: notifyUrl,
      amount: { total: amountFen, currency: 'CNY' },
    };
    const data = await requestWechat('POST', '/v3/pay/transactions/native', body);
    if (!data.code_url) throw new Error(`微信下单未返回 code_url: ${JSON.stringify(data)}`);
    return { codeUrl: data.code_url };
  },

  async refundOrder(input) {
    return await wechatRefund(input);
  },
};

import express from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { getAdminClient } from "./server/supabaseAdmin";
import { createOrder, completeOrder, queryOrder, PaymentError } from "./server/paymentService";
import { getPaymentProvider } from "./server/paymentProvider";
import { decryptResource, verifyNotifySignature, loadWechatConfig } from "./server/paymentWechat";
import { adminRouter } from "./server/adminRouter";

dotenv.config();

const ai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

async function startServer() {
  const app = express();
  // 支持环境变量指定端口（默认 3000）。生产与拼团共存时用 PORT=3001 避开冲突
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware to parse JSON
  // verify 回调保留原始 body 字符串，供微信支付回调验签使用
  app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); },
  }));

  // gzip 压缩静态资源（JS/CSS/JSON），打包产物可压缩到 1/3 大小，加快加载
  app.use(compression());

  // API Route for secure DeepSeek AI Translation
  app.post("/api/translate", async (req, res) => {
    try {
      const { textMap, fromLang, toLang } = req.body;

      if (!textMap || typeof textMap !== 'object') {
        res.status(400).json({ error: "Invalid textMap parameter" });
        return;
      }

      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "DEEPSEEK_API_KEY environment variable is not configured on the server." });
        return;
      }

      // Convert from/to language code names to readable text (e.g. 'zh' -> 'Chinese', 'en' -> 'English')
      const getLangName = (code: string) => {
        const names: Record<string, string> = {
          zh: 'Chinese (Simplified)',
          en: 'English (Professional CV Standard)',
          ja: 'Japanese',
          ko: 'Korean',
          fr: 'French',
          de: 'German',
          es: 'Spanish'
        };
        return names[code] || code;
      };

      const sourceLang = getLangName(fromLang || 'zh');
      const targetLang = getLangName(toLang || 'en');

      const systemInstruction = `Translate JSON CV fields from ${sourceLang} to ${targetLang}.
Rules: (1) Return same-keys JSON only. (2) Use professional CV language, preserve acronyms (SQL/React/API). (3) Keep HTML tags intact. (4) Leave URLs/emails as-is.`;

      // Only non-empty values to minimize tokens
      const filtered = Object.fromEntries(
        Object.entries(textMap).filter(([, v]) => typeof v === 'string' && v.trim())
      );

      const contents = `Translate:\n${JSON.stringify(filtered)}`;

      const response = await ai.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: contents },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      });

      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from DeepSeek translation service.");
      }

      const translatedMap = JSON.parse(responseText.trim());
      res.json({ translatedMap });
    } catch (error: any) {
      console.error("DeepSeek Translation Error:", error);
      res.status(500).json({ error: error?.message || "Internal translation server error" });
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // ==========================================================================
  // 支付 / 订单 API
  // 默认 PAYMENT_PROVIDER=mock（本地模拟，今天即可跑通全流程）
  // ==========================================================================

  // 统一支付错误响应
  const paymentError = (res: express.Response, err: any) => {
    if (err instanceof PaymentError) {
      return res.status(400).json({ error: { code: err.code, message: err.message } });
    }
    console.error("Payment error:", err);
    return res.status(500).json({ error: { code: "INTERNAL", message: err?.message || "服务器错误" } });
  };

  // 解析当前用户：优先用 Authorization Bearer JWT（Supabase 验证），否则退回 body.userId（mock 阶段兼容）
  const resolveUserId = async (req: express.Request): Promise<string> => {
    const authz = req.headers.authorization || "";
    if (authz.startsWith("Bearer ")) {
      const token = authz.slice(7);
      const anon = createSupabaseClient(
        process.env.VITE_SUPABASE_URL || "",
        process.env.VITE_SUPABASE_ANON_KEY || "",
        // Node <22 无原生 WebSocket（服务器 Node 20），注入 ws 避免 RealtimeClient 抛错
        { realtime: { transport: WebSocket as any } }
      );
      const { data, error } = await anon.auth.getUser(token);
      if (error || !data.user) throw new PaymentError("UNAUTHORIZED", "登录已过期，请重新登录");
      return data.user.id;
    }
    const uid = (req.body && req.body.userId) || "";
    if (!uid) throw new PaymentError("UNAUTHORIZED", "缺少身份信息（请登录后携带 userId 或 Authorization）");
    return uid;
  };

  // POST /api/payment/create-order — 创建支付订单
  // body: { planType, paymentMethod, channel?: 'native'|'jsapi', openid?: string }
  //   channel='jsapi'（微信内直接调起）需要 openid；默认 native（扫码）
  app.post("/api/payment/create-order", async (req: express.Request, res: express.Response) => {
    try {
      const admin = getAdminClient();
      const provider = getPaymentProvider();
      const userId = await resolveUserId(req);
      const { planType, paymentMethod, channel, openid } = req.body || {};
      const result = await createOrder({ admin, provider }, { userId, planType, paymentMethod, channel, openid });
      res.json({
        orderId: result.order.id,
        amount: result.order.amount,
        amountFen: result.amountFen,
        codeUrl: result.codeUrl,
        jsapiParams: result.jsapiParams || undefined,
        expiresAt: result.order.expires_at,
        provider: provider.name,
      });
    } catch (err) {
      paymentError(res, err);
    }
  });

  // GET /api/payment/wechat/oauth-url?planType=month 或 ?back=/payment?plan=month
  //   planType：支付意图授权（state=pay:<planType>，回跳 /payment?openid&plan，前端自动继续支付）
  //   back：    通用预授权（state=pre:<base64url(back)>，回跳 back?openid&p=<plan>，仅存 openid 不触发支付）
  // 微信 WebView 会清空 sessionStorage，支付意图/回跳目标都经 state 随授权往返，不能依赖 sessionStorage
  app.get("/api/payment/wechat/oauth-url", (req: express.Request, res: express.Response) => {
    const appid = process.env.WECHAT_APPID || "";
    if (!appid) {
      return res.status(500).json({ error: { code: "CONFIG", message: "未配置 WECHAT_APPID" } });
    }
    const planType = String(req.query.planType || "").replace(/[^a-zA-Z0-9_]/g, "");
    const back = String(req.query.back || "");
    let state = "pay";
    if (planType) {
      state = `pay:${planType}`;
    } else if (back) {
      // back 必须是站内路径（防开放重定向），编码进 state
      if (!back.startsWith("/")) {
        return res.status(400).json({ error: { code: "BAD_BACK", message: "back 必须是站内路径" } });
      }
      state = `pre:${Buffer.from(back).toString("base64url")}`;
    }
    const redirectUri = encodeURIComponent(`${(process.env.APP_URL || "").replace(/\/$/, "")}/api/payment/wechat/oauth/callback`);
    const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_base&state=${encodeURIComponent(state)}#wechat_redirect`;
    res.json({ url });
  });

  // GET /api/payment/wechat/oauth/callback — 微信授权回调：code 换 openid，302 回前端
  //   state=pay:<planType>   → /payment?openid&plan（支付意图，前端自动继续 JSAPI）
  //   state=pre:<back>       → back 原路径?openid&p=<plan>（预授权，仅带回 openid，不触发自动支付）
  app.get("/api/payment/wechat/oauth/callback", async (req: express.Request, res: express.Response) => {
    try {
      const code = String(req.query.code || "");
      if (!code) {
        return res.redirect(`${(process.env.APP_URL || "").replace(/\/$/, "")}/payment?oauth_error=1`);
      }
      const state = String(req.query.state || "pay");
      const { getOpenidByCode } = await import("./server/paymentWechat");
      const { openid } = await getOpenidByCode(code);
      const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");

      if (state.startsWith("pre:")) {
        // 预授权：回跳原路径，plan 改名 p（避免被当作支付意图触发自动支付）
        let back = "/";
        try {
          back = Buffer.from(state.slice(4), "base64url").toString("utf8");
        } catch { /* 解码失败回首页 */ }
        const url = new URL(back, appUrl);
        const plan = url.searchParams.get("plan");
        url.searchParams.delete("plan");
        url.searchParams.set("openid", openid);
        if (plan) url.searchParams.set("p", plan);
        return res.redirect(url.toString());
      }

      // 支付意图：回 /payment?openid&plan=<planType>
      const planType = state.startsWith("pay:") ? state.slice(4) : "";
      const frontUrl = `${appUrl}/payment?openid=${encodeURIComponent(openid)}${planType ? `&plan=${encodeURIComponent(planType)}` : ""}`;
      res.redirect(frontUrl);
    } catch (err: any) {
      console.error("[oauth] 换取openid失败:", err?.message || err);
      res.redirect(`${(process.env.APP_URL || "").replace(/\/$/, "")}/payment?oauth_error=1`);
    }
  });

  // GET /api/payment/query/:orderId — 查询订单状态（前端轮询）
  app.get("/api/payment/query/:orderId", async (req: express.Request, res: express.Response) => {
    try {
      const admin = getAdminClient();
      const provider = getPaymentProvider();
      const order = await queryOrder({ admin, provider }, req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "订单不存在" } });
      }
      res.json({
        orderId: order.id,
        status: order.status,
        planType: order.plan_type,
        amount: order.amount,
        createdAt: order.created_at,
        expiresAt: order.expires_at,
      });
    } catch (err) {
      paymentError(res, err);
    }
  });

  // POST /api/payment/notify/wechat — 微信支付异步回调（真实模式）
  app.post("/api/payment/notify/wechat", async (req: express.Request, res: express.Response) => {
    try {
      if (getPaymentProvider().name !== "wechat") {
        // 非微信模式：返回失败，微信会重试
        return res.status(404).json({ code: "FAIL", message: "NOT_FOUND" });
      }
      const cfg = loadWechatConfig();
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      verifyNotifySignature(cfg, req.headers as Record<string, string | undefined>, rawBody);

      const payload = JSON.parse(rawBody);
      const plain = decryptResource(cfg.apiV3Key, payload.resource);
      const event = JSON.parse(plain);
      const { out_trade_no, transaction_id, trade_state } = event;

      if (trade_state !== "SUCCESS") {
        // 非成功状态不处理，返回成功防止微信持续重试
        return res.json({ code: "SUCCESS", message: "ok" });
      }

      const admin = getAdminClient();
      const provider = getPaymentProvider();
      await completeOrder({ admin, provider }, out_trade_no, { gatewayTradeNo: transaction_id });

      res.json({ code: "SUCCESS", message: "成功" });
    } catch (err) {
      console.error("Wechat notify error:", err);
      res.status(500).json({ code: "FAIL", message: (err as Error).message });
    }
  });

  // ==========================================================================
  // 中后台管理 API（/api/admin/*）— 全部经 requireAdmin 鉴权
  // ==========================================================================
  app.use("/api/admin", adminRouter);

  // POST /api/payment/notify/mock — 模拟支付确认（仅 mock 模式可用）
  app.post("/api/payment/notify/mock", async (req: express.Request, res: express.Response) => {
    try {
      const provider = getPaymentProvider();
      if (provider.name !== "mock") {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "当前为真实支付模式，请通过真实支付完成" } });
      }
      const orderId = (req.body && req.body.orderId) || "";
      if (!orderId) throw new PaymentError("INVALID_PARAM", "缺少 orderId");
      const admin = getAdminClient();
      const result = await completeOrder({ admin, provider }, orderId);
      res.json({ ok: true, status: result.order.status, alreadyCompleted: result.alreadyCompleted, userUpdate: result.userUpdate });
    } catch (err) {
      paymentError(res, err);
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // 中后台（独立构建产物：dist/admin），以 /admin 子路径访问
    const adminDistPath = path.join(process.cwd(), 'dist', 'admin');
    if (fs.existsSync(adminDistPath)) {
      app.use('/admin', express.static(adminDistPath));
      app.get('/admin/*', (req, res) => {
        res.sendFile(path.join(adminDistPath, 'index.html'));
      });
    } else {
      console.warn('[server] 未找到 dist/admin，中后台未启用（请先运行 npm run build:admin）');
    }

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    startSupabaseKeepalive();
  });
}

// ============================================================================
// Supabase 免费项目保活：项目约 7 天无 API 请求会被暂停（暂停后域名下线，
// 注册/登录/支付全部不可用）。此定时器定期打一次真实的业务请求，
// 只要本服务持续运行（本地常开或部署到 Cloud Run 等），项目就不会被暂停。
// 若本服务不常驻，请另配外部定时任务（如 UptimeRobot / GitHub Actions）
// 定时 GET https://<ref>.supabase.co/rest/v1/users?select=id&limit=1 带上 anon key。
// ============================================================================
function startSupabaseKeepalive() {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.warn("[keepalive] 未配置 VITE_SUPABASE_URL/ANON_KEY，跳过保活任务");
    return;
  }

  const ping = async () => {
    try {
      const res = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      console.log(`[keepalive] Supabase ping → HTTP ${res.status}`);
    } catch (err: any) {
      console.warn(`[keepalive] Supabase ping 失败: ${err?.message || err}`);
    }
  };

  // 启动 30 秒后先 ping 一次；之后每 24 小时一次（随机分钟偏移，避免整点扎堆）
  setTimeout(() => ping(), 30_000);
  setInterval(() => ping(), 24 * 60 * 60 * 1000);
}

startServer();

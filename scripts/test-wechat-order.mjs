// ============================================================================
// 微信支付真实下单自检（不扣款：仅调用下单接口，验证配置/签名/商户关联）
// 临时覆盖 PAYMENT_PROVIDER=wechat，import 后调用 createOrder 并打印 code_url 前缀
//
// 用法：node scripts/test-wechat-order.mjs
// 成功标志：返回 code_url（weixin://wxpay/... 或 https://... 链接）即配置全通
// ============================================================================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 先加载 .env（与 server.ts 一致），再覆盖 PAYMENT_PROVIDER
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
process.env.PAYMENT_PROVIDER = 'wechat';

const { getAdminClient } = await import('../server/supabaseAdmin.ts');
const { getPaymentProvider } = await import('../server/paymentProvider.ts');
const { createOrder } = await import('../server/paymentService.ts');

const admin = getAdminClient();
const provider = getPaymentProvider();

console.log(`==> provider = ${provider.name}`);

try {
  const userId = (await admin.auth.admin.listUsers()).data.users[0]?.id;
  if (!userId) throw new Error('云 Supabase 无用户，先注册一个');
  console.log(`==> 使用用户 ${userId}`);

  const result = await createOrder(
    { admin, provider },
    { userId, planType: 'week', paymentMethod: 'wechat' }
  );

  console.log('✅ 下单成功！');
  console.log(`   orderId : ${result.order.id}`);
  console.log(`   amount  : ${result.amountFen} 分 (¥${result.order.amount})`);
  console.log(`   codeUrl : ${String(result.codeUrl).slice(0, 60)}...`);
  console.log(`   provider: ${result.provider}`);
  console.log('');
  console.log('配置全通：签名 ✔ 商户号 ✔ AppID关联 ✔ APIv3密钥 ✔');
} catch (err) {
  console.error('❌ 下单失败:', err?.message || err);
  process.exit(1);
}

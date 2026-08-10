import type { OrderProvider } from './paymentService';
import { mockProvider } from './paymentMock';
import { wechatProvider } from './paymentWechat';

/**
 * 支付 provider 工厂：PAYMENT_PROVIDER=mock|wechat
 * - mock（默认）：本地模拟，无需任何商户资质，今天即可跑通全流程
 * - wechat：真实微信支付 APIv3，需填 .env 中的商户配置后切换
 */
export function getPaymentProvider(): OrderProvider {
  const provider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  switch (provider) {
    case 'wechat':
      return wechatProvider;
    case 'mock':
      return mockProvider;
    default:
      throw new Error(`未知 PAYMENT_PROVIDER: ${provider}（可选 mock | wechat）`);
  }
}

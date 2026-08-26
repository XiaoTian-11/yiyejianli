import type { OrderProvider } from './paymentService';

/**
 * 模拟支付 provider（PAYMENT_PROVIDER=mock，默认）
 *
 * 不调用任何外部网关，仅生成一个假二维码内容。
 * 支付确认由前端"模拟支付成功"按钮 → POST /api/payment/notify/mock 触发，
 * 走与真实微信回调完全相同的 completeOrder 落库流程。
 * 切到真实支付时无需改任何业务代码。
 */
export const mockProvider: OrderProvider = {
  name: 'mock',

  async createOrder({ orderId }) {
    // 生成一个形似微信 native 支付链接的假 URL，保证二维码渲染链路与真实一致
    const rand = Math.random().toString(36).slice(2, 10);
    return {
      codeUrl: `weixin://wxpay/bizpayurl?pr=${orderId.slice(-8)}${rand}`,
    };
  },

  async markPaid() {
    // 模拟确认：无实际动作，订单状态由 notify/mock 端点驱动
  },
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Check, ArrowRight, Printer, AlertCircle } from 'lucide-react';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'service' | 'privacy';
}

export const AgreementModal: React.FC<AgreementModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'service' 
}) => {
  const [activeTab, setActiveTab] = useState<'service' | 'privacy'>(initialTab);

  // Sync state if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] print:hidden"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[85vh] bg-white rounded-[2rem] shadow-2xl z-[210] overflow-hidden border border-slate-100 flex flex-col print:relative print:top-0 print:left-0 print:translate-x-0 print:translate-y-0 print:w-full print:h-auto print:shadow-none print:border-none print:z-0"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-50/50 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  {activeTab === 'service' ? <FileText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-slate-800 tracking-tight">
                    {activeTab === 'service' ? '壹页简历用户服务协议' : '壹页简历个人信息隐私保护政策'}
                  </h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">
                    版本更新日期：2026年05月28日 | 正式生效日期：2026年05月28日
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2.5 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/60 font-bold text-xs text-slate-600 flex items-center gap-1.5"
                  title="打印协议"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">打印此件</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-650"
                  aria-label="关闭窗口"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="px-6 md:px-8 py-3 bg-white border-b border-slate-100 flex gap-4 shrink-0 print:hidden">
              <button
                onClick={() => setActiveTab('service')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'service'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 bg-slate-55'
                }`}
              >
                <span>服务协议</span>
                {activeTab === 'service' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'privacy'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 bg-slate-55'
                }`}
              >
                <span>隐私政策</span>
                {activeTab === 'privacy' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-sm leading-relaxed text-slate-600 font-sans print:overflow-visible print:p-0">
              
              {activeTab === 'service' ? (
                /* Service Agreement Content */
                <div className="space-y-6">
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100/60 text-xs text-amber-805 flex items-start gap-3 print:hidden">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="font-semibold">
                      【特别提示】在使用“壹页简历”平台服务前，请您务必审慎阅读本《用户服务协议》。特别是免除或者限制责任的条款、法律适用和争议解决条款。当您登录、使用、下载、登记以及使用本站服务时，即代表您与本平台达成一致并同意接受本协议约束。
                    </p>
                  </div>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">一、服务条款的确认与接纳</h4>
                    <p>
                      1.1 “壹页简历”平台（以下简称“本平台”或“我们”）提供的各项电子化服务的所有权、知识产权和运营权归属于运营团队。
                    </p>
                    <p>
                      1.2 本协议内容包括协议正文及所有我们已经发布或将来可能发布的各项规则、规范或者通知。所有规则为本协议不可分割的组成部分，与协议正文具有同等法律效力。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">二、用户账号的注册、使用与安全</h4>
                    <p>
                      2.1 用户可选择通过第三方认证、微信或常用电子邮件作为身份标识注册登录。您在注册时应承诺提供合法、真实、准确的个人信息并根据变化及时更正。
                    </p>
                    <p>
                      2.2 用户不应将其账号、密码转让、借用、赠与及进行其他非正常转让。因用户保管不善、将密码告知他人或遭受钓鱼网站攻击而发生的安全泄露与财产损失，本平台概不承担任何责任关系。
                    </p>
                    <p>
                      2.3 平台为了方便用户体验提供了“免登录离线编辑模式”。离线模式下的所有简历内容仅备份和暂存于您本机的临时存储（LocalStorage / IndexedDB）中。一旦清除浏览器历史缓存，数据将被抹除，因清理缓存产生的数据丢失由您自理承担。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">三、平台服务内容与资费说明</h4>
                    <p>
                      3.1 壹页简历提供包括基础版免费简历模板编辑、高阶会员（尊享版）专属名企模板解锁、高级AI润色工具、高级排版自适应微调、简历综合质量打分以及高纯度PDF文档与PNG图片无损打印导出服务。
                    </p>
                    <p>
                      3.2 <b>会员专属资费：</b>我们提供按年订阅或单次解锁等阶梯级会员套餐（详情以本站《定价方案》明示数值为准）。高阶会员服务一经开通，将立刻解锁相应模板库及高级特权权限。
                    </p>
                    <p>
                      3.3 <b>关于退款：</b>鉴于本平台输出的简历模板、ATS优化机制、AI简历打分以及导出接口属于典型的<b>数字化虚拟增值服务形式</b>，在会员权限被调拨或用户开通相关特权后，我们<b>原则上不予以受理退换款</b>（除非因技术物理故障导致平台根本性无法向您提供任何编辑及正常导出能力长达75小时）。请您在支付升级前，务必谨慎考核及通过实时预览系统确定实际版式体验无损。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">四、用户在使用中的行为规范</h4>
                    <p>
                      4.1 您郑重同意，在使用本服务时会严格遵守并符合国家关于互联网安全的各项合规标准。不得在编辑简历的过程中注入、编辑、发布任何具有欺诈性、捏造作假、违法反科学、带有侵略性诽谤色彩以及侵害他人肖像、知识产权和绝对隐私的内容信息。
                    </p>
                    <p>
                      4.2 您不可利用任何自动化机器人、高频爬虫、注入脚本等越权行为来读取或侵害本平台的程序及服务框架。一经发现，我们将即刻停用您的服务账号并移留有关日志底证送呈主管部门。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">五、知识产权声明及用户成果保障</h4>
                    <p>
                      5.1 壹页简历模板库中的核心排版算法、自适应一页纸保护机制、CSS样式框架、组件代码均由本运营团队原生开发，其一切相关底层代码及衍生专利知识产权全权归运营方所有。
                    </p>
                    <p>
                      5.2 <b>版权授受：</b>对于您在本平台填空、生成并最终导出的PDF简历或成品求职纸件，<b>您依法享有完全不受剥夺的所有权、排他使用权与商业自主裁量权。</b>我们绝不会对您的个人履历及产出文件主张任何额外的使用权。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">六、免责声明及法律管辖</h4>
                    <p>
                      6.1 本平台致力于通过高水平技术为您提供最佳一页纸简历排版规范，但因求职录用受大盘行情、面试能力、经验匹配度等多重客观物理要素左右，<b>我们无法为您提供任何关于“百分百获得面试、成功录用”的口头及书面保证关系。</b>
                    </p>
                    <p>
                      6.2 凡因您自身数据丢失、作假履历引发的招聘劳动争议纠纷、被企业取消录用资格等负面责任，均由您自行开释化解，本平台完全不为此担负责任。
                    </p>
                    <p>
                      6.3 本协议在履行和适用中若遇争议，应首先通过友好协商商议，若5日内协商未成，可在运营方所属地有管辖权的人民法院提起诉讼。
                    </p>
                  </section>
                </div>
              ) : (
                /* Privacy Policy Content */
                <div className="space-y-6">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60 text-xs text-emerald-805 flex items-start gap-3 print:hidden">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="font-semibold">
                      【隐私至上】我们深知求职履历中蕴含着您的姓名、电话、常住地址、公司变迁轨迹等极高等级的个人敏感信息。壹页简历秉持“非必要不储存，去隐私化传输，多副本本地托管”的行业顶尖安全理念，竭尽全力全周期守护您的数字主权。
                    </p>
                  </div>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">一、我们如何采集和使用您的个人信息</h4>
                    <p>
                      1.1 <b>账号认证基本信息：</b>当您创建账号时，我们会记录您的账户识别号（UID）以及必要联系方式（邮箱/微信公钥认证等），用以核对您的会员计费套餐到期状况以及在不同终端中同步您的数据。
                    </p>
                    <p>
                      1.2 <b>您自主录入的简历明细：</b>包括但不限于：您的姓名、求职职位、核心邮箱、联系手机、履历时段、项目STAR描述、专业外语水平等。收集这些信息的唯一目是为您完美编排、实时渲染和高精度导出标准格式。
                    </p>
                    <p>
                      1.3 <b>客户端本地自动留存数据：</b>当您处于非登录（演示模式/离线状态）下使用本平台时，为了保障刷新网页不导致未完稿件丢失，我们会将输入的表单数据保存在您电脑的 LocalStorage 中。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">二、核心数据安全的防线与技术逻辑</h4>
                    <p>
                      2.1 <b>全站加密协议：</b>所有浏览器与云端服务器之间的通路交互，均受到超高强度的数字安全证书（HTTPS）及业界高阶标准加密算法（AES-256）保护，杜绝任何中间人劫持或明文探听。
                    </p>
                    <p>
                      2.2 <b>ATS质量扫描与AI润色数据保护：</b>当您主动呼唤“AI 诊断功能”或“简历评分中心”服务时，为了给您更精确的建议，平台需通过服务器网关把经过脱敏（我们会在云端剥除明显的真实名字、手机、纯住宅地址等）的部分骨架短句短词通过安全密道调用大语言模型进行处理，AI 对调数据不会被模型服务商用于任何反向训练。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">三、我们绝对不做的事（隐私承诺）</h4>
                    <p>
                      3.1 <b>坚决不转售、共享、交易受托数据：</b>我们对一切“灰色贩卖用户数据、兜售求职电话库给商业猎头机构、倒卖简历获利”的操作秉持绝对鄙夷态度。我们绝对不会将您的任何求职细节及档案披露转售给任何第三方外部公司或未经您本人授权的媒介机构。
                    </p>
                    <p>
                      3.2 <b>无暗地跟踪追踪器：</b>我们不设置任何侵入式、非关联的广告追踪模块（SDK）。我们仅做服务所需的极简内部性能统计，确保平台响应延迟处于优质状态。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">四、关于您对数据的自主管理与彻底注销权利</h4>
                    <p>
                      4.1 <b>手动一键彻底抹除：</b>只要您随时感到不适，可以在控制台中点击【账户设定】，对您在云端存储的各个简历版本进行“一键彻底抹除”或在编辑器中对工作履历、个人肖象、核心业绩数据进行彻底清空。一旦您按下“彻底删除简历”确认，我们将立即从关联的高规格数据库中执行不可逆碎屑擦除。
                    </p>
                    <p>
                      4.2 <b>彻底注销关联账号：</b>如您未来不需要继续使用本服务，可向我们的邮箱（support@yuejianli.com）发起彻底注销账号申请。我们在核实您账户套餐归属后，一定会在 7 个工作日内对该账号下的全部云端库和用户数据进行绝对切碎、注销归空处理，让您在我们的系统和日志中达到“数据遗忘和痕迹擦除”。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">五、对未成年人信息的保护说明</h4>
                    <p>
                      我们非常注重对青年及在校青少年的隐私安全保障。本服务并非针对未满 14 周岁的极端低龄未成年人。若非得到家长或合法监护人明确知情并同意，我们一律不允许注册和登记使用。
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-slate-800">六、变更通知与联系路径</h4>
                    <p>
                      如果我们的隐私规范和技术处理机制发生重磅变革，我们将提前 3 天在本站页面显著区块发布变动通告。如有任何与隐私指引相关的疑问、指控，或需要获取更先进的私有部署方案，皆可通过电子邮件取得联系。
                    </p>
                  </section>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0 print:hidden justify-end">
              <p className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                壹页简历，为您筑牢最坚固的求职安全防线。
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                我已经阅读并同意
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

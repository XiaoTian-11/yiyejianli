import React from 'react';
import { motion } from 'motion/react';
import { Check, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { PLANS } from '../constants';
import { MembershipTier } from '../types';

interface PricingPageProps {
  onSelectPlan?: (id: string) => void;
  currentTier: MembershipTier;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, currentTier }) => {
  return (
    <div className="py-24 px-6 relative overflow-hidden">
      <SEO 
        title="定价方案" 
        description="查看壹页简历的会员套餐与其专属权益。从免费基础版到专业尊享版，助力您的职业晋升之旅。"
        keywords="壹页简历定价, 会员套餐, 简历服务价格, 专业简历润色价格"
      />
      <div className="max-w-7xl mx-auto">
        <header className="text-center space-y-4 mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm font-medium text-pink-600 border border-pink-100"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>透明定价，由心而选</span>
          </motion.div>
          <h1 className="text-5xl font-display font-bold">加速您的职场晋升</h1>
          <p className="text-slate-500 max-w-xl mx-auto italic">
            {currentTier === 'member' ? '您当前已经是尊享会员，感谢您的支持。' : '选择最适合您当前职业目标的方案。所有方案均包含专业技术支持。'}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-12">
          {PLANS.map((plan) => (
            <PriceCard
              key={plan.type}
              title={plan.name}
              price={plan.price.toString()}
              description={plan.target}
              features={plan.features}
              highlight={plan.highlight}
              dailyPrice={plan.dailyPrice}
              isCurrent={currentTier === 'member' && plan.type !== 'week'} // Simplified
              onSelect={() => onSelectPlan?.(plan.type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface PriceCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
  dailyPrice: string;
  isCurrent?: boolean;
  onSelect: () => void;
}

const PriceCard: React.FC<PriceCardProps> = ({ title, price, description, features, highlight = false, dailyPrice, isCurrent, onSelect }) => (
  <div className={cn(
    "relative p-8 rounded-[2.5rem] bg-white border transition-all duration-500 flex flex-col h-full",
    highlight 
      ? "border-blue-200 shadow-2xl shadow-blue-200/40 z-10 py-12 ring-4 ring-blue-50/50" 
      : "border-slate-100 hover:border-slate-200 opacity-90 hover:opacity-100"
  )}>
    {highlight && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
        最受欢迎
      </div>
    )}
    <div className="mb-8">
      <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-display font-bold">¥</span>
        <span className="text-6xl font-display font-bold">{price}</span>
        {price !== '0' && (
          <div className="ml-2 flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ 期</span>
            {dailyPrice !== '-' && <span className="text-pink-500 text-[10px] font-black uppercase tracking-tighter">折合 {dailyPrice}</span>}
          </div>
        )}
      </div>
      <p className="text-slate-500 mt-2 italic">{description}</p>
    </div>

    <div className="space-y-4 mb-10 flex-1">
      {features.map((f, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className={cn("w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0", highlight ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400")}>
            <Check className="w-3 h-3" />
          </div>
          <span className="text-slate-600 text-sm font-medium leading-tight">{f}</span>
        </div>
      ))}
    </div>

    <button 
      onClick={onSelect}
      disabled={isCurrent}
      className={cn(
        "w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg",
        isCurrent
          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
          : highlight
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
            : "bg-slate-900 text-white hover:bg-black shadow-slate-200"
      )}
    >
      {isCurrent ? '当前持有' : '立即选择'}
    </button>
  </div>
);

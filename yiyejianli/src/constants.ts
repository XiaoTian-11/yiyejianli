import { ResumeData, Template, Plan } from './types';

export const INITIAL_DATA: ResumeData = {
  personalInfo: {
    fullName: '张悦悦',
    email: 'zhang.yue@example.com',
    phone: '138-0000-0000',
    location: '上海',
    jobTitle: '高级产品经理',
    website: 'https://github.com/zhangyue',
    linkedin: 'linkedin.com/in/zhangyue',
  },
  summary: '拥有 8 年互联网产品经验，擅长从 0 到 1 构建用户增长体系。精通数据驱动决策，曾主导过日活千万级产品的核心优化，具备优秀的跨团队沟通与领导力。',
  experience: [
    {
      id: '1',
      company: '悦科技股份有限公司',
      position: '高级产品经理',
      startDate: '2020-01',
      endDate: '至今',
      description: '负责核心产品线的迭代优化，通过引入 A/B 测试机制使核心转化率提升了 35%。带领 10 人团队完成了平台架构升级，大幅降低了系统响应延迟。',
    },
    {
      id: '2',
      company: '创新实验室',
      position: '产品经理',
      startDate: '2017-06',
      endDate: '2019-12',
      description: '主导了交互式数据看板的设计与开发，利用 D3.js 实现了复杂数据的可视化呈现。通过优化交互流程，将用户留存率提高了 20%。',
    },
  ],
  education: [
    {
      id: '1',
      school: '复旦大学',
      degree: '计算机科学与技术 本科',
      startDate: '2013-09',
      endDate: '2017-06',
    },
  ],
  skills: ['产品规划', '原型设计', '数据分析', 'SQL', 'Python', '敏捷开发', '用户研究', '增长策略'],
  projects: [
    {
      id: '1',
      name: '开源简历排版引擎',
      description: '一个基于 React 的高度可定制化简历生成引擎，支持多种行业标准模板。',
      role: '项目发起人兼核心开发者',
      startDate: '2024.01',
      endDate: '至今',
    },
  ],
  sections: [
    { id: 'sec-personal', type: 'personal', title: '基本信息' },
    { id: 'sec-summary', type: 'summary', title: '自我评价' },
    { id: 'sec-experience', type: 'experience', title: '工作经历' },
    { id: 'sec-education', type: 'education', title: '教育经历' },
    { id: 'sec-projects', type: 'projects', title: '项目经历' },
    { id: 'sec-skills', type: 'skills', title: '专业技能' },
  ],
};

export const TEMPLATES: Template[] = [
  { 
    id: 'modern', 
    name: '现代商务', 
    description: '清晰专业的布局，带侧边栏设计，适合大多数商务职场。', 
    category: '通用',
    isPremium: false,
    tags: ['商务', '侧边栏', '热门']
  },
  { 
    id: 'classic', 
    name: '经典学术', 
    description: '传统学术风格，注重内容排版，适合求职投递与学术交流。', 
    category: '传统',
    isPremium: false,
    tags: ['传统', '严谨']
  },
  { 
    id: 'minimal', 
    name: '极简风格', 
    description: '去繁就简，优雅大气，适合设计与创意类行业。', 
    category: '创意',
    isPremium: false,
    tags: ['设计', '创意']
  },
  { 
    id: 'executive', 
    name: '大厂高通过率模板', 
    description: '模拟大厂人力资源系统标准，提升机器初筛通过率。', 
    category: '大厂',
    isPremium: true,
    tags: ['大厂', 'ATS']
  },
  { 
    id: 'student', 
    name: '应届生校招模板', 
    description: '针对无工作经验的应届生设计，突出教育背景与实习项目。', 
    category: '校招',
    isPremium: true,
    tags: ['校招', '应届生']
  },
  { 
    id: 'tech_focused', 
    name: '开源极客风格', 
    description: '受知名开发社区欢迎的高密度排版，适合技术专家与开发者。', 
    category: '技术',
    isPremium: true,
    tags: ['技术', '极客', '精简']
  },
  { 
    id: 'finance_elite', 
    name: '金融投资精英', 
    description: '高端对称布局，沉稳深藏青点缀，凸显大盘分析、项目投资与全面预算管理成就。', 
    category: '金融财务',
    isPremium: true,
    tags: ['金融', '投行', '券商', '分析师']
  },
  { 
    id: 'medical_academic', 
    name: '麦肯森医疗科研', 
    description: '严谨的医学及科研学术风格，高质绿意微光点缀，突出科研项目、SCI论文与学术声誉。', 
    category: '医疗健康',
    isPremium: true,
    tags: ['医疗', '科研', '学术', '医生']
  },
  { 
    id: 'creative_designer', 
    name: '创意视觉设计', 
    description: '非对称美学布局，渐变色勋章与优雅圆角组合，适合艺术、创意及UI/UX视觉设计。', 
    category: '创意设计',
    isPremium: true,
    tags: ['创意', '作品集', 'UI/UX', '多媒体']
  },
  { 
    id: 'engineering_tech', 
    name: '大国重器工程建设', 
    description: '专为建筑、基建设计及工程项目经理打造，刚硬精细色调，突出千亿级项目大节点把控。', 
    category: '建筑工程',
    isPremium: true,
    tags: ['工程', '土木基建', '项目管控', '全周期']
  },
  { 
    id: 'elegant', 
    name: '雅雅风尚商务', 
    description: '温润雅气对称美学，豪华红泥点缀，凸显高级管理与艺术风范。', 
    category: '管理行政',
    isPremium: false,
    tags: ['管理', '行政', '对称']
  },
  { 
    id: 'two_column', 
    name: '现代双栏效率', 
    description: '结构分明的双栏布局，最大化信息层级与多维度的专业呈现。', 
    category: '通用',
    isPremium: false,
    tags: ['双栏', '设计', '高密度']
  },
  { 
    id: 'marketing_sales', 
    name: '市场高能销售', 
    description: '充满能量的亮橙色调，结构性成就区块，契合业绩增长和客户开拓。', 
    category: '销售市场',
    isPremium: true,
    tags: ['销售', '市场', '公关', '核心业绩']
  },
  { 
    id: 'legal_consulting', 
    name: '律所高端合伙人', 
    description: '大气的双线饰边与硬朗造型，完美展现法律、金融审计与高端智库专家形象。', 
    category: '法律咨询',
    isPremium: true,
    tags: ['法律', '咨询', '律师', '顾问']
  },
];

export const PLANS: Plan[] = [
  {
    type: 'week',
    name: '周卡会员',
    price: 9.9,
    dailyPrice: '1.4 元/天',
    target: '临时求职用户',
    features: ['全部 500+ 专业模板', '无限次无水印 PDF 导出', '实时自动保存', '专属人工客服'],
  },
  {
    type: 'month',
    name: '月卡会员',
    price: 15,
    dailyPrice: '0.5 元/天',
    target: '短期求职用户',
    features: ['覆盖求职全周期', '无限制自定义样式', 'ATS 兼容性检测', '30 个简历版本管理'],
    highlight: true,
  },
  {
    type: 'quarter',
    name: '季卡会员',
    price: 36,
    dailyPrice: '0.4 元/天',
    target: '跳槽季用户',
    features: ['性价比之选', '大厂专供模板', '深度简历分析报告', '优先体验新功能'],
  },
  {
    type: 'year',
    name: '年卡会员',
    price: 99,
    dailyPrice: '0.27 元/天',
    target: '职场新人',
    features: ['全年简历无忧', '专家一对一建议', '跨设备实时同步', '全方位数据保护'],
  },
  {
    type: 'lifetime',
    name: '终身卡',
    price: 199,
    dailyPrice: '-',
    target: '长期职场人士',
    features: ['一次付费永久使用', '所有高级功能永久解锁', '终身技术支持', '至尊身份标识'],
  },
  {
    type: 'student_year',
    name: '学生年卡',
    price: 49,
    dailyPrice: '0.13 元/天',
    target: '在校学生',
    features: ['学生专属特惠', '校招绿色通道', '求职技能礼包', '实习直通车'],
  },
];

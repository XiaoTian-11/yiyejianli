import { ResumeData } from '../types';

export interface IndustrySample {
  industryName: string;
  category: string;
  data: ResumeData;
}

export const INDUSTRY_SAMPLES: Record<string, IndustrySample> = {
  product: {
    industryName: '互联网产品与运营',
    category: '产品管理与增长',
    data: {
      personalInfo: {
        fullName: '张悦悦',
        email: 'zhang.yue@example.com',
        phone: '138-0000-0000',
        location: '北京',
        jobTitle: '高级产品经理',
        website: 'github.com/zhangyue',
        linkedin: 'linkedin.com/in/zhangyue',
        fullName_secondary: 'Yueyue Zhang',
        location_secondary: 'Beijing',
        jobTitle_secondary: 'Senior Product Manager',
      },
      summary: '拥有 8 年一线大厂互联网产品管理经验，擅长从 0 到 1 构建用户增长体系。精通数据驱动决策与 A/B 测试，曾主导过日活千万级产品的核心推荐机制优化，具备优秀的跨团队沟通与战略领导力。',
      summary_secondary: '8 years of internet product management experience. Specialized in building user growth machines from 0 to 1. Advanced skills in data-driven decisions and A/B testing, led core recommendation optimization for a 10M+ DAU product.',
      experience: [
        {
          id: 'exp-1',
          company: '北京跃动互联科技有限公司',
          position: '高级产品经理 / 增长负责人',
          startDate: '2020-03',
          endDate: '至今',
          description: '1. 主导核心推荐算法与用户留存机制重构，通过 A/B 流量测试将次周用户留存率从 22% 提升至 34.5%。\n2. 带领 12 人跨职能团队，设计并上线了裂变转介绍活动模块，累计带来 400 万新增注册用户，降低 CAC 达 28%。\n3. 深度分析漏斗变现节点，规划高额付费转化包，直接赋能产生 1.25 亿流水业绩。',
          company_secondary: 'Yuedong Internet Technology Co., Ltd.',
          position_secondary: 'Senior PM / Growth Lead',
          startDate_secondary: '2020-03',
          endDate_secondary: 'Present',
          description_secondary: '1. Led recommendation algorithm & retention redesign, boosted next-week retention from 22% to 34.5% via A/B testing.\n2. Guided a 12-person cross-functional team to deliver viral referral logic, driving 4M+ new registrations, cutting CAC by 28%.\n3. Analyzed conversion funnels, designed premium monetization kits, generating 125M RMB in direct gross revenue.',
        },
        {
          id: 'exp-2',
          company: '字节跳动 (精品应用业务部)',
          position: '产品经理',
          startDate: '2017-07',
          endDate: '2020-02',
          description: '1. 负责核心分发场景的交互流转效率，应用 D3 复杂看板监控点击行为，优化关键按钮位置，点击率（CTR）整体提升了 18.2%。\n2. 参与自研音视频组件在 5 款子应用中的全生命周期封装部署，在排期紧张的情况下按时实现 100% 成功交付。',
          company_secondary: 'ByteDance (Premium Apps Dept)',
          position_secondary: 'Product Manager',
          startDate_secondary: '2017-07',
          endDate_secondary: '2020-02',
          description_secondary: '1. Managed clickstream CTR for distribution hubs, tracking interaction via comprehensive D3-based analytical dashboards; boosted overall CTR by 18.2%.\n2. Collaborated in modular video-codec encapsulation and continuous deployment across 5 core products, achieving 100% on-time delivery.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '北京大学',
          degree: '信息管理与信息系统 本科',
          startDate: '2013-09',
          endDate: '2017-07',
          school_secondary: 'Peking University',
          degree_secondary: 'B.S. in Information Management',
          startDate_secondary: '2013-09',
          endDate_secondary: '2017-07',
        }
      ],
      skills: ['产品生命周期', '用户增长策略', '数据分析与SQL', 'D3.js & Python', 'A/B 测试', '竞品与痛点分析', '高颗粒度原型设计', '跨部门协同能力'],
      skills_secondary: ['Product Lifecycle', 'Growth Hacking', 'SQL & BI', 'Data Analytics', 'A/B Testing', 'Scenario Analysis', 'Axure / Figma', 'Cross-functional'],
      projects: [
        {
          id: 'proj-1',
          name: '千万级应用个性化动态流主导项目',
          description: '通过个性化推荐系统的冷启动升级和千人千面的权重流改动，全平台人均使用时长中位数由每日 12 分钟递增至 21.5 分钟。',
          link: 'yuejianli.com/portfolio-pm',
          name_secondary: '10M DAU Custom Feed Engine',
          description_secondary: 'Optimized cold-start heuristics & scoring weights, growing platform-wide median daily duration from 12 to 21.5 minutes per active user.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  tech: {
    industryName: '技术研发与全栈开发',
    category: '技术研发',
    data: {
      personalInfo: {
        fullName: '李极客',
        email: 'geek.li@example.com',
        phone: '139-1111-2222',
        location: '深圳',
        jobTitle: '高级全栈开发工程师',
        website: 'github.com/geekli',
        linkedin: 'linkedin.com/in/geekli',
        fullName_secondary: 'Gavin Li',
        location_secondary: 'Shenzhen',
        jobTitle_secondary: 'Senior Full Stack Engineer',
      },
      summary: '6 年软件开发经验，专注于高并发微服务架构与前端工程化。精通 Go/Java 及 React/TypeScript 技术栈，曾重构千万级高频结算系统。推崇极客精神与敏捷规范，多次为主流开源项目贡献代码。',
      summary_secondary: '6 years of software engineer experience. Focused on high-concurrency microservices and front-end engineering. Proficient in Go, Java, React, and server-side deployment. Advocate of clean code & agility.',
      experience: [
        {
          id: 'exp-1',
          company: '腾讯科技 (云原生基础设施部)',
          position: '资深全栈开发工程师',
          startDate: '2021-04',
          endDate: '至今',
          description: '1. 主导云账单结算中台微服务重构，运用 Go 并发模型及 Redis 高可用缓存机制，系统 QPS 峰值承载上限由 5k 重写并提升至 48k。\n2. 封装高性能 API 服务总线，标准化跨端 RPC 接口接入流程，成功将内部中间件平均响应时间缩短 42ms。\n3. 设计并落地 CI/CD 自动化流水线调优，结合 Kubernetes 滚动部署策略，将灰度发布故障率降低达 75%。',
          company_secondary: 'Tencent Technology (Cloud Native)',
          position_secondary: 'Senior Full-Stack Engineer',
          startDate_secondary: '2021-04',
          endDate_secondary: 'Present',
          description_secondary: '1. Led Cloud billing microservices rewrite in Go, utilizing custom concurrency models and Redis high-availability caching; surged billing QPS threshold from 5k to 48k.\n2. Built lightweight, high-performance API event router, lowering standard RPC calling latency by 42ms.\n3. Optimized CI/CD build scripts and Docker container footprints, cutting canary deployment failure rate by 75%.',
        },
        {
          id: 'exp-2',
          company: '深圳数智物联研发中心',
          position: '前端开发组长',
          startDate: '2019-01',
          endDate: '2021-03',
          description: '1. 主导千万级工业设备动态看板（基于 React 18 & Three.js 渲染），运用 WebWorker 处理海量实时包并解决单线程重绘卡顿瓶颈。\n2. 推动前端代码模组组件化、引入 Jest 单元测试覆盖率标准至 82%，减少线上意外回归故障。',
          company_secondary: 'Shenzhen Digital IoT Center',
          position_secondary: 'Frontend Lead',
          startDate_secondary: '2019-01',
          endDate_secondary: '2021-03',
          description_secondary: '1. Designed 3D equipment dashboard using React & WebGL, using multithreading WebWorkers to parse real-time IoT events and eliminate UI thread bottleneck.\n2. Integrated comprehensive automated testing standards in Jest, improving critical test coverages to 82%.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '哈尔滨工业大学',
          degree: '软件工程 本科',
          startDate: '2015-09',
          endDate: '2019-06',
          school_secondary: 'Harbin Institute of Technology',
          degree_secondary: 'B.S. in Software Engineering',
          startDate_secondary: '2015-09',
          endDate_secondary: '2019-06',
        }
      ],
      skills: ['Golang & Java', 'React / TypeScript', 'Gin / Spring Boot', 'Redis & Postgres', 'K8s & Docker', '高性能微服务', 'API 接口高可用', '数据加密合规'],
      skills_secondary: ['Golang & Java', 'React / TS', 'Gin & Hibernate', 'High Concurrency', 'Kubernetes & Docker', 'Redis Caching', 'API Optimization', 'Security Compliance'],
      projects: [
        {
          id: 'proj-1',
          name: '自研高性能键值（KV）存储系统',
          description: '利用 LSM-Tree 存储结构独立编写的高性能引擎，读写吞吐达成高吞吐指标，保障复杂场景不丢数据。',
          link: 'github.com/geekli/kv-database',
          name_secondary: 'High-Performance Log-Structured Merge Store',
          description_secondary: 'A custom disk-backed LSM-Tree key-value DB in Go, optimizing write amplification and index queries.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  finance: {
    industryName: '金融、财务与投资分析',
    category: '金融财务',
    data: {
      personalInfo: {
        fullName: '赵金融',
        email: 'financial.zhao@example.com',
        phone: '135-2222-3333',
        location: '上海',
        jobTitle: '资深投资分析师 / 注册会计师',
        website: 'cpa-zhao-elite.com',
        linkedin: 'linkedin.com/in/zhaofinance',
        fullName_secondary: 'Edward Zhao',
        location_secondary: 'Shanghai',
        jobTitle_secondary: 'Senior Financial Analyst / CPA',
      },
      summary: '取得我国注册会计师（CPA）与特许金融分析师（CFA Level III），7 年著名投资银行与大型集团资产管理、财务审计运营实践。主导过多起拟上市、企业并购及千亿级全面筹划重构，精通精算建模。',
      summary_secondary: 'CPA & CFA Candidate with 7 years in investment banking and asset management. Skilled in financial forecasting models, cross-border M&A consulting, asset evaluation, risk management, and ROI tracking.',
      experience: [
        {
          id: 'exp-1',
          company: '中金公司 (投资银行部)',
          position: '资深资本运作与财务顾问',
          startDate: '2021-08',
          endDate: '至今',
          description: '1. 主导某半导体百亿级借壳重置并构建资本模型，全面把控标的公司估值分析、偿债红线与税务筹划，保障项目一次性高水平过会。\n2. 开展严密尽职调查（Due Diligence），筛选和重整过往 5 年财务报表，调整历史累计误差，筛除潜在衍生债权隐患近 1.8 亿元。',
          company_secondary: 'CICC (Investment Banking)',
          position_secondary: 'Senior Financial Analyst',
          startDate_secondary: '2021-08',
          endDate_secondary: 'Present',
          description_secondary: '1. Formulated standard corporate valuation & risk hedging models for a 10B RMB semiconductor restructuring transition, passing state audits securely.\n2. Executed deep-dive due diligence, consolidating audit records of the past 5 fiscal years and clearing 180M RMB of non-performing debt exposures.',
        },
        {
          id: 'exp-2',
          company: '德勤华永会计师事务所',
          position: '高级审计员',
          startDate: '2019-06',
          endDate: '2021-07',
          description: '1. 负责 8 家大型上市集团年度合并会计报表主干审计。编制关键测试、重置资本流水追踪，出具严密无保留意见审计报告。\n2. 发现被审计单位运营流动性冗余资产，协助重组资本结构并额外盘活资金盈余达 15%。',
          company_secondary: 'Deloitte & Touche LLT',
          position_secondary: 'Senior Auditor (Audit Dept)',
          startDate_secondary: '2019-06',
          endDate_secondary: '2021-07',
          description_secondary: '1. Managed full-process legal audits on consolidated financial statements for 8 major listed corporations.\n2. Detected dormant capital assets, resulting in a restructured liquidity layout that revitalized 15% in liquid equity reserves.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '复旦大学',
          degree: '金融学 硕士',
          startDate: '2017-09',
          endDate: '2019-06',
          school_secondary: 'Fudan University',
          degree_secondary: 'Master in Finance & Asset Management',
          startDate_secondary: '2017-09',
          endDate_secondary: '2019-06',
        }
      ],
      skills: ['注册会计师执照', '金融估值建模', '合并报表审计', '风险评级管控', '企业境内外IPO', '全面零基预算', '外汇及对冲机制', '资本运营合规'],
      skills_secondary: ['CPA / CFA III', 'Financial Valuation', 'Consolidated Auditing', 'Due Diligence', 'IPO & Compliance', 'Zero-base Budgeting', 'Hedging Models', 'Audit Risk Matrix'],
      projects: [
        {
          id: 'proj-1',
          name: '特大型制造业核心跨国并购案财务控制',
          description: '深度分析标的公司现金流折现（DCF），运用敏感度分析工具推演对岸利率波动，锁定估值安全边际。',
          link: 'capital-analyst-sh.com',
          name_secondary: 'Cross-border Acquisition DCF Framework',
          description_secondary: 'Constructed DCF modeling with dynamic sensitivity ranges, tracking global currency shifts and saving valuation variance by 8.5%.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  medical: {
    industryName: '医疗科研、医学研究与医生',
    category: '医疗健康',
    data: {
      personalInfo: {
        fullName: '陈医学',
        email: 'dr.chen@medical-core.net',
        phone: '136-3333-4444',
        location: '北京',
        jobTitle: '心内科主治医师 / 医学博士',
        website: 'pubmed.org/search?q=chen-yx',
        linkedin: 'researchgate.net/profile/chen-yx',
        fullName_secondary: 'Yuxuan Chen, M.D.',
        location_secondary: 'Beijing',
        jobTitle_secondary: 'Attending Cardiologist / PhD',
      },
      summary: '10 年临床医学与心血管多中心研究经验，兼修医学信息学。第一作者或通讯作者发表中科院一区 SCI 期刊论文 5 篇，主持国家自然科学基金青年项目，擅长基于电子病历的大数据挖掘与分析。',
      summary_secondary: 'Attending Cardiologist with PhD in Medicine. Research focus on cardiothoracic bioinformatics. Published 5 high-impact SCI papers in top-tier cardiovascular journals as first-author. PI for national medical grants.',
      experience: [
        {
          id: 'exp-1',
          company: '北京协和医院 (心血管内科)',
          position: '主治医师 / 科研项目PI',
          startDate: '2020-08',
          endDate: '至今',
          description: '1. 承担心肌缺血多中心RCT临床试验的总协调。指导数据采集并制定临床筛选指标，样本随访质量提升 15%，高水平交付临床报告。\n2. 每日独立完成心脏介入导管微创手术 2~3 例，无一例严重不良事件。联合软件团队重构急诊卒中绿通流程，使入院到血管再通（D2B）中位数时长由 72 分钟缩短至 53 分钟。',
          company_secondary: 'Peking Union Medical College Hospital (Cardiology)',
          position_secondary: 'Attending Physician / PI',
          startDate_secondary: '2020-08',
          endDate_secondary: 'Present',
          description_secondary: '1. Acting as clinical coordinator for national multi-center cardiovascular RCT trial. Improved follow-up data consistency by 15%.\n2. Successfully conducted 2-3 minimally invasive cardiac interventions daily on average, zero surgical adverse events. Optimized stroke green channel workflow, cutting median D2B latency from 72 to 53 mins.',
        },
        {
          id: 'exp-2',
          company: '医学科学院心血管研究中心',
          position: '博士后研究员 / 助理研究员',
          startDate: '2017-09',
          endDate: '2020-07',
          description: '1. 主导微小RNA对心肌肥厚机制的靶向分析。主理小鼠转基因及病理切片荧光检测。SCI 顶刊发表成果。在业内学术大会中代表中心做大会交流汇报。\n2. 结合 R 语言完成单细胞转录组测序的大型生信分析，有效过滤高达 40% 的非非典型突变细胞噪点点。',
          company_secondary: 'Institute of Medical Sciences, CAMS',
          position_secondary: 'Postdoc Research Associate',
          startDate_secondary: '2017-09',
          endDate_secondary: '2020-07',
          description_secondary: '1. Led targeted analysis of microRNA signaling pathways in cardiac hypertrophy, resulting in top-tier SCI publications.\n2. Programmed multi-dimensional transcriptomic pipelines in R, effectively cleansing 40% genomic sequencing noise from unclassified single-cell databases.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '北京协和医学院',
          degree: '临床医学 八年制博士（M.D., Ph.D.）',
          startDate: '2009-09',
          endDate: '2017-07',
          school_secondary: 'Peking Union Medical College',
          degree_secondary: 'M.D. & Ph.D. Program in Medicine',
          startDate_secondary: '2009-09',
          endDate_secondary: '2017-07',
        }
      ],
      skills: ['微创介入技术', '临床多中心试验', 'SCI 学术撰写', '临床决策树模型', '生信数据清洗 (R)', '医学伦理常识', '电子病历分析', '英语流利口语'],
      skills_secondary: ['Cardiology Intervention', 'Multi-center Trials', 'SCI Publishing', 'Biostatistics (R)', 'Statistical Models', 'Medical Bio-Ethics', 'EHR Analytics', 'Scientific Editing'],
      projects: [
        {
          id: 'proj-1',
          name: '靶向心肌特异性非编码 RNA 诊疗路径基金课题',
          description: '国家自然科学基金青年科学基金资助项目。探索非编码核酸在心衰终末期重写细胞凋亡的精准病理靶点。',
          link: 'nsfc.gov.cn/project-chen',
          name_secondary: 'NSFC Cardiomyopathy Research Grant',
          description_secondary: 'Principal Investigator of a grant investigating gene targeting mechanisms to prevent cardiac remodeling in chronic heart failure models.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  design: {
    industryName: '创意视觉传达与 UI/UX 体验',
    category: '创意设计',
    data: {
      personalInfo: {
        fullName: '王创意',
        email: 'creative.wang@design-atelier.pro',
        phone: '137-4444-5555',
        location: '上海',
        jobTitle: '创意视觉总监 / 资深 UI/UX 设计师',
        website: 'behance.net/creativewang',
        linkedin: 'dribbble.com/creativewang',
        fullName_secondary: 'Edison Wang',
        location_secondary: 'Shanghai',
        jobTitle_secondary: 'Creative Director / Lead UI/UX',
      },
      summary: '获德国红点奖（Red Dot Award）、iF 设计奖金奖，9 年多媒体视觉和跨端 UX 规范建立历程。擅长极简非对称美学、色彩学与互动动效落地，用视觉设计语言为产品赋能商业感知与强力辨识度。',
      summary_secondary: 'Red Dot & iF Design Award Gold Winner. 9 years of visual and cross-platform UX framework definition. Master of minimalism, asymmetric grids, branding narratives, motion feedback, and multi-platform consistency.',
      experience: [
        {
          id: 'exp-1',
          company: '美团 (到店事业群创意设计部)',
          position: '资深交互专家 / 视觉中心负责人',
          startDate: '2021-11',
          endDate: '至今',
          description: '1. 跨团队制定 5 大消费场景全链路交互设计规范（Meituan-Aesthetic），组件化一致性极佳，极大精炼开发重用率并降低前端走查成本 30%。\n2. 设计上线了美团 2022 年度用户复盘活动，融入高级情绪色学与动效触发系统，创造近 2400 万自主社交网络刷屏裂变，品牌满意度递增至 93%。',
          company_secondary: 'Meituan (In-Store Business Creative)',
          position_secondary: 'Lead Interactive / UX Specialist',
          startDate_secondary: '2021-11',
          endDate_secondary: 'Present',
          description_secondary: '1. Structured dynamic brand & UI interface system ("Meituan-Aesthetic") used across 5 primary business segments, cutting dev overhead by 30%.\n2. Guided core creative for Meituan Annual Recap, utilizing custom color scripts & micro-interactions, resulting in 24M viral shares.',
        },
        {
          id: 'exp-2',
          company: 'ARK Design (上海创意数字创意)',
          position: '资深UI设计师 / 高级项目主管',
          startDate: '2018-05',
          endDate: '2021-10',
          description: '1. 操盘 4 款面向新锐电商品牌的定制高颗粒度作品集平台设计。深入拆解和优化用户移动点击节点多余步骤，使结余付费闭环耗时减少 12%。\n2. 引入 D3.js 复杂组件并协助前端高品质呈现，融合物理拖拽拟真手感，得到客户极佳评价。',
          company_secondary: 'ARK Design Consultancy Shanghai',
          position_secondary: 'Senior Brand & UI Designer',
          startDate_secondary: '2018-05',
          endDate_secondary: '2021-10',
          description_secondary: '1. Shipped bespoke high-fidelity designs for 4 modern e-commerce mobile products. Restructured user shopping flow, reducing cart abandonment rate by 12%.\n2. Conceptualized custom D3 charts dynamic skins, ensuring beautiful layouts that blended realistic drag mechanics and UI transitions.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '同济大学',
          degree: '视觉传达学 硕士',
          startDate: '2015-09',
          endDate: '2018-03',
          school_secondary: 'Tongji University',
          degree_secondary: 'M.F.A. in Visual Communication & Media',
          startDate_secondary: '2015-09',
          endDate_secondary: '2018-03',
        }
      ],
      skills: ['Figma 深度架构', '非对称排版网格', '移动多端交互 UX', '高级三维动效策划', '品牌美学讲座', 'Web前端还原度把控', 'D3.js 数据精饰', '国际设计奖项申报'],
      skills_secondary: ['Figma Expert', 'Grid Systems & Gaps', 'Responsive UX / UI', 'Interactive Prototypes', 'Branding Aesthetics', 'Frontend QA Precision', 'Red Dot Guidelines', 'User Journey Mapping'],
      projects: [
        {
          id: 'proj-1',
          name: '智能家居中央中控屏极高清晰概念界面',
          description: '为知名硬件商独立定制的 8 吋纯实体中控端系统组件库，首创将空气阻尼动力学物理回弹映射至触屏体验中。',
          link: 'creative-wang-homes.com',
          name_secondary: 'Next-Gen Smart Home Control Panel Interface',
          description_secondary: 'An innovative central OS user experience, pioneering physical friction damping feedback models mapped straight to glass touchscreen layers.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  engineering: {
    industryName: '基建特大型工程建设与管理',
    category: '建筑工程',
    data: {
      personalInfo: {
        fullName: '林工程',
        email: 'lin.pm@engineering-heavy.com',
        phone: '138-1111-9999',
        location: '广州',
        jobTitle: '特大型基建项目总监 / 一级建筑建造师',
        website: 'architectures-lin.net',
        linkedin: 'linkedin.com/in/linprojectpm',
        fullName_secondary: 'Justin Lin, P.E.',
        location_secondary: 'Guangzhou',
        jobTitle_secondary: 'Senior Project Director / First-Class Constructor',
      },
      summary: '注册一级建造师（市政、建筑双专业），高级工程师。12 年大型路桥、市政、高层商业综合体全生命周期现场管控和指挥实力。精通总包统筹管理、进度安全预警规避及精细零超标核算，管理最大单体造价 85 亿元。',
      summary_secondary: 'Certified First-Class Constructor (Municipal & Architecture). Heavy Infrastructure PM Director with 12 years of core field experience. Handled massive project operations over 8.5 Billion RMB.',
      experience: [
        {
          id: 'exp-1',
          company: '中国建筑第三工程局 (华南总部)',
          position: '特大型项目工程总监 / 指挥部高级副总指挥',
          startDate: '2020-05',
          endDate: '至今',
          description: '1. 主导某国家级高新园区 220 米超高主塔与 3 期综合体工程，带队完成 8 大班组高效安全联调。通过自主引入新型深基坑降水模块，防汛安全度增加 100%。\n2. 高频管控总计达 1.45 亿元的劳务与大宗原材料，应用最优化算法模型精炼预算偏差，实现年度结算与初投成本零超支、零特大安全生产记录。',
          company_secondary: 'China Construction Third Engineering Bureau Co.',
          position_secondary: 'Heavy Infrastructure Director',
          startDate_secondary: '2020-05',
          endDate_secondary: 'Present',
          description_secondary: '1. Commanded construction of a modern 220m skyscraper and its 3rd phase ecosystem, engineering custom deep-pit drainage modules and scaling safety margins by 100%.\n2. Managed high-consequence Procurement worth 145M RMB. Balanced multiple specialized subcontractors, achieving zero delays, zero accidents, and budget margins matching targets perfectly.',
        },
        {
          id: 'exp-2',
          company: '广州城市基建投资总公司',
          position: '大型市政路网现场技术负责人',
          startDate: '2016-03',
          endDate: '2020-04',
          description: '1. 负责广州某快速高架多跨钢折梁预制拼接专项工程，精确校准拼装拼峰线误差在 3 毫米级高级标度，属省内先进水平。\n2. 统筹与供电、规划、水利等多门政企的管线迁改交叉公关，将多跨路段施工总周期较原排期压缩 38 天。',
          company_secondary: 'Guangzhou Municipal Infrastructure Invest.',
          position_secondary: 'Site Chief Technical Engineer',
          startDate_secondary: '2016-03',
          endDate_secondary: '2020-04',
          description_secondary: '1. Controlled prefabricated modular installation for multi-span overhead highway truss systems, maintaining millimeter-level precision limits.\n2. Negotiated and smoothed complex utility displacement clearances across municipal, water, and power authorities, cutting estimated project timelines by 38 calendar days.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '华南理工大学',
          degree: '土木工程 本科',
          startDate: '2012-09',
          endDate: '2016-06',
          school_secondary: 'South China University of Technology',
          degree_secondary: 'B.Eng. in Civil Engineering & Construction Management',
          startDate_secondary: '2012-09',
          endDate_secondary: '2016-06',
        }
      ],
      skills: ['注册一级建造师资格', '超高层大跨度现场管控', '总承包BIM多极精控', '特大事故防御闭环', '零超标预算控制', '政企跨机构交叉公关', '分供链全系谈判', '绿色建筑施工指引'],
      skills_secondary: ['National P.E. License (CN)', 'Skyscraper/Heavy Infrastructure', 'BIM Coordination', 'Safety Matrix Assurance', 'Cost Auditing & Estimation', 'Stakeholder Communications', 'Subcontractor Management', 'Green Building Design'],
      projects: [
        {
          id: 'proj-1',
          name: '沿江超大直径泥水果盘式盾构隧道指挥工程',
          description: '操盘双向 6 车道跨境海底隧道基建大盾构推进行业范本。处理高承压复杂软硬交界水质，零地面沉降安全指标。',
          link: 'lin-tunnels-build.com',
          name_secondary: 'Subsea Large-Diameter Shield Tunneling Command',
          description_secondary: 'Directed a dual-6-lane subsea shield tunneling project, navigating highly-pressurized unstable formations with absolute zero land subsidence incidents.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  law: {
    industryName: '律所合伙人与法律顾问',
    category: '法律咨询',
    data: {
      personalInfo: {
        fullName: '孙法律',
        email: 'lawyer.sun@apex-jurist.com',
        phone: '131-0000-8888',
        location: '上海',
        jobTitle: '资深法律顾问 / 资深执业律师',
        website: 'apex-jurist-partner.com',
        linkedin: 'linkedin.com/in/sundecheng-justice',
        fullName_secondary: 'Decheng Sun, Esq.',
        location_secondary: 'Shanghai',
        jobTitle_secondary: 'Senior Partner / Attorney-at-Law',
      },
      summary: '11 年高端诉讼执业史与大型投资合规风控实务。拥有中国国家法律职业资格证书（A证）。主要为投融资并购、跨境知识产权合规、复杂民商事重大纠纷提供精准解决方案，累计挽回或避免潜在经济损失达 4.5 亿元。',
      summary_secondary: 'Attorney-at-Law (Holder of Grade A Legal License) with 11 years of high-stakes corporate litigation and legal counsel. Leading expert in cross-border tech transactions, M&A equity compliance, and complex civil trials.',
      experience: [
        {
          id: 'exp-1',
          company: '上海市盈科律师事务所 (总所)',
          position: '高级合伙人 / 知识产权部门副主任',
          startDate: '2019-03',
          endDate: '至今',
          description: '1. 主导某跨国软硬件科技企业诉著名平台的侵权重大纠纷案件，起草上百份高质量核心答辩状及调取核心证据目录，帮助委托人取得一审及最高人民法院终审全面胜诉，挽回商誉和知识产权资产溢价 1.25 亿元。\n2. 承担多起上市前合规风控体检，对 15 家高增长 SaaS 公司的企业内部股权激励、合同排雷提出穿透式清理报告。',
          company_secondary: 'Yingke Law Firm (Shanghai Headquarter)',
          position_secondary: 'Senior Partner / VP of IP Dept',
          startDate_secondary: '2019-03',
          endDate_secondary: 'Present',
          description_secondary: '1. Handled high-stakes multinational technology copyright infringement lawsuits, drafting hundreds of strategic pleadings; secured total victory in Supreme People\'s Court, recovering 125M RMB.\n2. Scheduled enterprise-wide pre-IPO compliance audits across 15 SaaS companies, ensuring complete shareholder protection mechanisms.',
        },
        {
          id: 'exp-2',
          company: '国浩律师 (上海) 事务所',
          position: '专职律师 / 高级顾问团队主管',
          startDate: '2015-05',
          endDate: '2019-02',
          description: '1. 主理多起外商直接投资 (FDI) 跨境架构合规文件。协助大型物流巨头出具英文跨境尽调法律意见书，措辞滴水不漏。\n2. 深度处理并排查合同条款超过 800 余份。曾精准审查出一款涉外融资租赁协议中的连带保证漏洞，为主力基金挽回被诉赔付的重大潜在亏空。',
          company_secondary: 'Grandall Law Firm (Shanghai)',
          position_secondary: 'Associate Attorney',
          startDate_secondary: '2015-05',
          endDate_secondary: '2019-02',
          description_secondary: '1. Facilitated multiple Foreign Direct Investment (FDI) structure alignments; authored bilingual due diligence reports for global shipping groups.\n2. Audited over 800 premium contracts, detecting secondary financial lease guarantees loophole and directly shielding capital lines.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '华东政法大学',
          degree: '法学 硕士（民商法方向）',
          startDate: '2012-09',
          endDate: '2015-06',
          school_secondary: 'East China University of Political Science and Law',
          degree_secondary: 'LL.M. in Civil and Commercial Law',
          startDate_secondary: '2012-09',
          endDate_secondary: '2015-06',
        }
      ],
      skills: ['法律职业资格证A证', '高精尖涉外诉讼代理', '跨国知识产权风控', '境内外并购股权穿透', '双语滴水不漏答辩', '严苛法律意见书撰写', '企业合规破产重整', '极佳商业博弈谈判'],
      skills_secondary: ['Bar Exam License (A)', 'Cross-border Litigation', 'IP Auditing & Patents', 'Equity Restructuring', 'Bilingual Legal Drafting', 'IPO Risk Assessments', 'Bankruptcy Compliance', 'Strategic Negotation'],
      projects: [
        {
          id: 'proj-1',
          name: '境外上市红筹/VIE架构拆解与返A合规专项',
          description: '全面梳理并打通底层多维嵌套资产控股权链路。撰写了 12 万字高水平涉外重整可行性论证及法律合规分析。',
          link: 'legal-advisor-sh.net/redchip-project',
          name_secondary: 'Corporate Red-Chip & VIE Equity Alignment',
          description_secondary: 'Delivered restructuring framework maps to dismantle unstable offshore shell VIE designs, aligning the core capital base for domestic high-tier listing requirements.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  marketing: {
    industryName: '销售突破与数字整合营销',
    category: '销售市场',
    data: {
      personalInfo: {
        fullName: '钱营销',
        email: 'growth.qian@marketing-peak.com',
        phone: '132-8888-9999',
        location: '杭州',
        jobTitle: '市场营销总监 / 资深业务增长总架构师',
        website: 'qian-marketing-growth.xyz',
        linkedin: 'linkedin.com/in/qianmarketinglead',
        fullName_secondary: 'Justin Qian',
        location_secondary: 'Hangzhou',
        jobTitle_secondary: 'Marketing Director / Growth Lead',
      },
      summary: '9 年数字整合营销与大客户（Key Accounts）开拓总操盘手。精通用户全生命周期全场景爆破体系，打造过 3 起引爆主流自媒体的高点击、超高 ROI 病毒营销样板。曾带领市场团队完成年度 1.8 亿净销售额指标。',
      summary_secondary: '9 years of digital consolidated marketing and enterprise key account sales strategy. Growth leader who executed 3 viral digital PR social campaigns with extremely high ROIs. Built sales channels delivering 180M RMB annually.',
      experience: [
        {
          id: 'exp-1',
          company: '阿里巴巴 (淘天集团数字推广部)',
          position: '高级市场营销总监 / KA KA 华东区客总总负责人',
          startDate: '2021-02',
          endDate: '至今',
          description: '1. 主导某年度旗舰消费节的多渠道流量分流、采置策略。精准监控和分配 4500 万元流量预算，通过严密漏斗模型让流量转化买家比例提高 24%，整体投资回报率（ROI）首创 1:12 行业最佳流水。\n2. 谈定并签署了 12 家主流核心快消巨头华东独家联名合作协议，直接带动新入淘宝首单买家注册新增近 350 万户。',
          company_secondary: 'Alibaba Group (Taobao & Tmall Group)',
          position_secondary: 'Senior Marketing Director',
          startDate_secondary: '2021-02',
          endDate_secondary: 'Present',
          description_secondary: '1. Commanded advertising funnels and dynamic allocation for 45M RMB digital ads budget, raising transaction rates by 24% and achieving class-leading ROI of 1:12.\n2. Concluded strategic agreements with 12 world-class retail brands, bringing 3.5M brand-new active store registrations with minimum budget.',
        },
        {
          id: 'exp-2',
          company: '网易杭州研究院 (严选事业部组群)',
          position: '资深增长营销及媒介公关主管',
          startDate: '2017-06',
          endDate: '2021-01',
          description: '1. 操盘新产品上市自自媒体及社群裂变口碑爆款策略。利用跨平台多层KOL金字塔矩阵，制造出总共 1 亿以上播放/阅读的爆发式品牌霸屏。\n2. 组建和培训一线的 15 人高能商务及公关团队，年度出击销售额指标达成 100% 绿色通过，且无任何公共舆情隐患风险点。',
          company_secondary: 'NetEase (Yanxuan Premium Commerce)',
          position_secondary: 'Senior PR & Growth Manager',
          startDate_secondary: '2017-06',
          endDate_secondary: '2021-01',
          description_secondary: '1. Formulated cross-platform influencer matrices and viral launch campaigns, gaining 100M+ combined organic readings.\n2. Built and trained a 15-person high-velocity PR & outbound BD department, meeting all sales growth metrics without public relations risks.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '浙江大学',
          degree: '工商管理与市场营销 本科',
          startDate: '2013-09',
          endDate: '2017-06',
          school_secondary: 'Zhejiang University',
          degree_secondary: 'B.A. in Business Administration & Marketing',
          startDate_secondary: '2013-09',
          endDate_secondary: '2017-06',
        }
      ],
      skills: ['高爆网络整合营销', '超级品牌故事矩阵', '极高广告投流 ROI', '大客户战略首发谈判', '金字塔多级 KOL 拆分', '危机公关与溢价维稳', '高维自建爆款裂变', '商业漏斗指标核算'],
      skills_secondary: ['Digital Campaigns', 'Brand Copywriting', 'High ROI Advertisement', 'KA Strategic Partnerships', 'KOL & Influencer Strategy', 'Public Relations Control', 'Viral Growth Hacking', 'Conversion Funnel Optimizations'],
      projects: [
        {
          id: 'proj-1',
          name: '新锐新食零售速食品牌“一炮引爆”全景品牌发布',
          description: '通过定位年轻态低卡健康，操盘在抖音快手小红书的阶梯状多维度内容爆发，首月达成淘内类目第一。',
          link: 'qian-brand-recap.com/food-viral',
          name_secondary: 'Retail FMCG FMCG Brand Social Launch Project',
          description_secondary: 'Engineered content triggers tailored to health-conscious target audiences, securing Category No.1 in TMall within 30 days of campaign inception.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  student: {
    industryName: '应届毕业生与校招实习',
    category: '校招',
    data: {
      personalInfo: {
        fullName: '周校招',
        email: 'intern.zhou@topgraduate.edu.cn',
        phone: '136-9999-8888',
        location: '南京',
        jobTitle: '软件研发工程师 (应届毕业生 / 校招求职)',
        website: 'blog.zhou-student-dev.io',
        linkedin: 'github.com/zhou-intern',
        fullName_secondary: 'William Zhou',
        location_secondary: 'Nanjing',
        jobTitle_secondary: 'Software Engineer Graduate (Campus Recruitment)',
      },
      summary: '高绩点毕业生，年级前 3%，曾获得国家奖学金。具有 2 次一线大厂分布式中间件与大前端系统开发实习经历，算法竞赛基础踏实（LeetCode 刷题 400+），热衷于高可用系统的技术钻研与技术探索。',
      summary_secondary: 'Top-tier CS graduate (GPA 3.92/4.00, top 3%). Standard scholarship prize winner. 2 Software Engineering intern experiences at major Tech companies. Proficient in classical algorithms (Codeforces 1800 Rating).',
      experience: [
        {
          id: 'exp-1',
          company: '美团 (到家研发部核心交易组)',
          position: '软件工程实习生',
          startDate: '2023-06',
          endDate: '2023-11',
          description: '1. 在高级架构师带领下，协助治理和重构高流量下单接口的预检缓存逻辑。主笔设计分片加载策略、分摊瞬时并发，使结算阶段加载耗时降至 110 毫秒级。\n2. 编写了 40 余个核心交易流程的 API 自动化黑盒、白盒回归测试用例，覆盖率高达 96%，实习期间拦截高危漏洞故障 3 次。',
          company_secondary: 'Meituan (Core Trading System Intern Group)',
          position_secondary: 'Software Engineering Intern',
          startDate_secondary: '2023-06',
          endDate_secondary: '2023-11',
          description_secondary: '1. Under mentorship of Principal Engineers, refactored high-concurrency order cache query workflows, slicing standard page-render times to 110ms.\n2. Authored 40+ dynamic functional API integration test files in Java, detecting 3 critical logic regression leaks prior to main branch merge.',
        },
        {
          id: 'exp-2',
          company: '字节跳动 (核心商业化前台技术部)',
          position: '前端开发实习生',
          startDate: '2022-09',
          endDate: '2023-02',
          description: '1. 负责广告商自助投放数据后台的多维度交互迭代。参与重写多图表的弹性排布，确保在小屏幕平板和移动浏览器中极致适配且零错乱错位。\n2. 自主重构公共通用模态框及防抖输入组件，提高研发小组件利用，研发重复写时间总体降低约 15%。',
          company_secondary: 'ByteDance (Commercialization UI Intern Dept)',
          position_secondary: 'Frontend Web Intern',
          startDate_secondary: '2022-09',
          endDate_secondary: '2023-02',
          description_secondary: '1. Handled merchant-facing advertising analytics components, migrating layout to flex grids that resolve 100% of historical responsiveness bugs.\n2. Refactored utility debounce inputs and popup animations, shaving redundant CSS sizes and improving codebase modularity by 15%.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '南京大学',
          degree: '计算机科学与技术 本科 (GPA: 3.92 / 4.0)',
          startDate: '2020-09',
          endDate: '2024-06',
          school_secondary: 'Nanjing University',
          degree_secondary: 'B.S. in Computer Science (Outstanding Candidate)',
          startDate_secondary: '2020-09',
          endDate_secondary: '2024-06',
        }
      ],
      skills: ['算法与数据结构', 'Java & Golang 开发', '高密度前端 React', '微服务 Spring Boot', 'MySQL & 慢 SQL 优化', '分布式并发及缓存', 'Git 优雅提交流程', '优秀无障碍团队合作'],
      skills_secondary: ['Algorithms & LeetCode', 'Java/Go Foundations', 'React App State', 'Spring Rest API', 'Relational Database (SQL)', 'Docker Foundations', 'Git Team Workflows', 'Fluent Scientific Reading'],
      projects: [
        {
          id: 'proj-1',
          name: '校级极客杯一等奖开源“跳蚤市场”交易系统主创',
          description: '独立编写支持 JWT 鉴权、RabbitMQ 瞬时结算削峰的完整学生二手流转站。全校注册用户 5,000+，实战磨砺。',
          link: 'github.com/zhou-intern/flea-market-system',
          name_secondary: 'Flea-Market High-Throughput Student Hub',
          description_secondary: 'Built campus-wide transactional backend supporting stateless JWT security, WebSocket live updates, using RabbitMQ buffers for spike orders. Engaged 5000+ college peers.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  },
  admin: {
    industryName: '高级行政总监与综合管理',
    category: '管理行政',
    data: {
      personalInfo: {
        fullName: '郑行政',
        email: 'zheng.admin@governance-exec.com',
        phone: '138-2222-7777',
        location: '广州',
        jobTitle: '高级行政总监 / 总裁办总协调官',
        website: 'zheng-admin-expert.org',
        linkedin: 'linkedin.com/in/zhengadmin',
        fullName_secondary: 'Vivian Zheng',
        location_secondary: 'Guangzhou',
        jobTitle_secondary: 'Senior Administrative Director',
      },
      summary: '12 年大型知名科技、制造业与上市公司综管及行政治理履历。擅长集团各层组织流程、大型峰会公关接待、高能级全方位办公设施降租降碳管控及总裁办督办事项强效落地，全面保障大型组织后勤极致运转。',
      summary_secondary: '12 years of specialized administrative governance, building facilities coordinate, major summits hosting, internal workflows streamlining, and presidential suite administration for Fortune 500 tech environments.',
      experience: [
        {
          id: 'exp-1',
          company: '网易集团 (广州行政中心总部)',
          position: '高级行政总监 / 综管中心总协调负责人',
          startDate: '2020-02',
          endDate: '至今',
          description: '1. 操盘和打通多园区 (涵盖近 2.3 万人) 的智能化办公室和物业重组运营。重写并压缩后勤供应合同，直接节省年均行政与物业能源账单高达 1450 万元。\n2. 兼任网易全球数字峰会后厅接待总督办。全面落地 5 个国家大使、140 家全球知名媒体的高品质安全公关接待方案，保障零失误与零延迟。\n3. 主导开发内部行政审批机器人系统，让全员资产办公审批、流程流转损耗降低 55%。',
          company_secondary: 'NetEase Group (Guangzhou Admin Headquarter)',
          position_secondary: 'Senior Administrative Director',
          startDate_secondary: '2020-02',
          endDate_secondary: 'Present',
          description_secondary: '1. Structured automated workflows and facility re-contracts for multiple science parks (safeguarding over 23k staff), slashing annual facilities expenses by 14.5M RMB.\n2. Reorganized event frameworks for NetEase Digital Summits, serving ambassadors, central agencies, and listed founders with absolute zero security incidents.\n3. Sponsored in-house digitized task management modules, increasing standard office request efficiency by 55%.',
        },
        {
          id: 'exp-2',
          company: '极速车联股份有限公司 (总裁办)',
          position: '总裁办行政总协调 / 高级行政主管',
          startDate: '2015-04',
          endDate: '2020-01',
          description: '1. 紧密支持总裁办与董事会决策事项。负责跟进年度目标分解（OKR/KPI）进展，督办关键研发中心里程碑。整理输出 60 余次高水准保密级会议备忘。\n2. 独立管理和审核 180 万美元年度办公备用差旅出具盘活、优化公司用车及差率商洽政策。',
          company_secondary: 'Jisuan Auto Networks Co. (Executive Suite)',
          position_secondary: 'Chief Executive Coordinator',
          startDate_secondary: '2015-04',
          endDate_secondary: '2020-01',
          description_secondary: '1. Streamlined execution of board-level directives, tracking executive OKRs, drafting highly sensible company-wide governance guidelines, and keeping historic records of board events.\n2. Audited travel pipelines and negotiated with airlines and logistics providers, saving 15% in corporate travel expenses annually.',
        }
      ],
      education: [
        {
          id: 'edu-1',
          school: '中山大学',
          degree: '行政管理学 本科',
          startDate: '2011-09',
          endDate: '2015-06',
          school_secondary: 'Sun Yat-sen University',
          degree_secondary: 'B.A. in Public & Administrative Administration',
          startDate_secondary: '2011-09',
          endDate_secondary: '2015-06',
        }
      ],
      skills: ['集团化多园区大局管控', '大型商业峰会统筹督办', '行政预算深度零差率核算', '极强跨团队协调与沟通', '政商多维高规格接待', '无缝总裁办督办落地', '数字化行政资产审批', '出勤后勤极速保障机制'],
      skills_secondary: ['Enterprise Campus Admin', 'Large Scale VIP Events', 'Cost Reduction Controls', 'Corporate OKR Tracking', 'High Stakes Protocols', 'Executive Communications', 'Facility Smart Digitization', 'Internal Audit Integration'],
      projects: [
        {
          id: 'proj-1',
          name: '华南绿色科技园区数字化办公零碳升级',
          description: '主理集团新总部大楼 24 万平方米无纸化智能化控制中心升级。将温控能耗精细调优、自动调光节能落实，获得行业奖。',
          link: 'governancezheng-lowcarbon-report.org',
          name_secondary: 'Tech HQ Zero-Emission Intelligent Upgrade',
          description_secondary: 'Administered green re-engineering of a 240,000 sqm headquarter. Installed smart LED motion tracking systems, locking carbon drop benchmarks.',
        }
      ],
      sections: [
        { id: 'sec-personal', type: 'personal', title: '基本信息' },
        { id: 'sec-summary', type: 'summary', title: '自我评价' },
        { id: 'sec-experience', type: 'experience', title: '工作经历' },
        { id: 'sec-education', type: 'education', title: '教育经历' },
        { id: 'sec-projects', type: 'projects', title: '项目经历' },
        { id: 'sec-skills', type: 'skills', title: '专业技能' },
      ],
    }
  }
};

/**
 * Maps template IDs to their best-match industry keys
 */
export const TEMPLATE_INDUSTRY_MAP: Record<string, string> = {
  modern: 'product',
  two_column: 'product',
  executive: 'product',
  tech_focused: 'tech',
  classic: 'law',
  minimal: 'design',
  creative_designer: 'design',
  student: 'student',
  finance_elite: 'finance',
  medical_academic: 'medical',
  engineering_tech: 'engineering',
  elegant: 'admin',
  marketing_sales: 'marketing',
  legal_consulting: 'law'
};

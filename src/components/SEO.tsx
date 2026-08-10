import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  ogTitle, 
  ogDescription,
  canonical 
}) => {
  const baseTitle = "壹页简历";
  const defaultDesc = "壹页简历是一款专业的简历生成工具，提供多种 ATS 友好型模板。";
  
  const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} - 专业简历生成器`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description || defaultDesc} />
      <meta property="og:type" content="website" />
      
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "壹页简历",
          "alternateName": "CV Craft",
          "url": "https://yuejianli.com/",
          "description": defaultDesc,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          // offers 如实标注最低起价（单次导出 5.9 元），避免结构化数据与实际定价不符
          "offers": {
            "@type": "Offer",
            "price": "5.9",
            "priceCurrency": "CNY",
            "description": "简历导出单次付费起点价，另有周/月/季/年会员套餐可选"
          }
        })}
      </script>
    </Helmet>
  );
};

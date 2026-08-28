import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/** A4 物理尺寸（mm） */
export const A4_W_MM = 210;
export const A4_H_MM = 297;

/**
 * 把一组简历页面 DOM 节点截图生成 PDF。
 * 每个 `.resume-print-page` 是一页 A4（794×1123 @96dpi）。
 * 用 html-to-image 放大 3 倍截图保证清晰（位图方案的质量补偿）。
 */
export const generateResumePDF = async (
  pageEls: HTMLElement[],
): Promise<{ blob: Blob; url: string }> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < pageEls.length; i++) {
    const el = pageEls[i];
    // 截图时去除内联 transform scale，以原始 794×1123 渲染；pixelRatio 3 放大保证清晰
    const dataUrl = await toPng(el, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      style: {
        transform: 'none',
        transformOrigin: 'top left',
        // 舞台宽高用原始像素值，避免被宿主缩放影响
        width: '794px',
        height: '1123px',
      },
      // 跳过打印隐藏元素（页码等）
      filter: (node) => {
        const htmlNode = node as HTMLElement;
        return !(htmlNode.classList && htmlNode.classList.contains('print:hidden'));
      },
      // 容器查询依赖 A4 舞台的 @container，克隆时保留；跳过外部样式即可
      cacheBust: true,
    });

    if (i > 0) pdf.addPage();
    // 图片按 A4 全页铺满（含边距 0，与原打印一致）
    pdf.addImage(dataUrl, 'PNG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST');
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  return { blob, url };
};

/**
 * 下载 Blob 为文件。优先 <a download>（标准/多数浏览器含安卓微信 X5 部分支持）；
 * 降级为 base64 dataURL + window.open（iOS 微信 / 部分 X5 调起系统打开 PDF）。
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);

  // 方案 1：<a download> 触发下载
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 部分浏览器同步下载，无需 revoke；微信/移动端常需稍后
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  } catch {
    // 继续降级
  }

  // 方案 2：转 dataURL + window.open（微信内调起系统打开 PDF）
  try {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const win = window.open(dataUrl, '_blank');
      if (!win) {
        // 弹窗被拦截：提示用户长按链接
        alert('若未弹出 PDF，请长按页面空白处选择「保存/打开」');
      }
    };
    reader.readAsDataURL(blob);
  } catch {
    alert('导出失败，请稍后重试');
  }
};

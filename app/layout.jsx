import '../src/index.css';

export const metadata = {
  title: '朱墨案头 · 待办工作台',
  description: '体制内个人待办工作台 · 今日事今日毕',
};

/* 与原版 index.html 保持一致：中文字体栈按 zh-CN 渲染，视口设置交给 viewport 导出 */
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

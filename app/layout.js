export const metadata = {
  title: 'SEO 文章优化助手',
  description: 'AI 驱动的 SEO 文章标题和内容优化工具',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

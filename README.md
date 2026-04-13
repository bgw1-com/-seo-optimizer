# SEO 文章优化助手

AI 驱动的 SEO 文章标题和内容优化工具。

## 部署到 Vercel（3步搞定）

### 第1步：推到 GitHub

1. 在 GitHub 上创建一个新仓库（比如叫 `seo-optimizer`）
2. 在终端运行：

```bash
cd seo-optimizer-web
git init
git add .
git commit -m "init: SEO optimizer"
git remote add origin https://github.com/你的用户名/seo-optimizer.git
git push -u origin main
```

### 第2步：连接 Vercel

1. 打开 https://vercel.com 用 GitHub 账号登录
2. 点 "Add New Project"
3. 选择你刚推上去的 `seo-optimizer` 仓库
4. 框架选 "Next.js"（通常会自动识别）
5. 点 "Deploy"

### 第3步：配置 API Key

1. 在 Vercel 项目页面，点 Settings → Environment Variables
2. 添加以下环境变量：

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | 你的 OpenAI API Key |
| `ANTHROPIC_API_KEY` | （可选）Claude API Key |
| `DEEPSEEK_API_KEY` | （可选）DeepSeek API Key |
| `GROK_API_KEY` | （可选）Grok API Key |

3. 重新部署一次（Settings → Deployments → 最新的那个 → Redeploy）

部署完成后 Vercel 会给你一个 `xxx.vercel.app` 的域名，分享给别人就能用了！

## 本地开发

```bash
npm install
# 编辑 .env.local 填入你的 API Key
npm run dev
# 打开 http://localhost:3000
```

## 安全说明

- API Key 存在服务器端环境变量中，用户无法看到
- 内置速率限制：每个 IP 每分钟最多 10 次请求
- 不记录用户的文章内容

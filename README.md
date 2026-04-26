# 塔罗每日运势（每天固定一张）

## 开发

1) 安装 Node.js（建议 \(>= 20\)）。

2) 安装依赖并启动：

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## 牌面图片

- 牌面放在 `public/cards/` 下，命名为 `<id>.jpg`（例如 `public/cards/the_fool.jpg`）。
- 如果你暂时没有图片资源，页面会自动显示一个内置的“占位牌面”。

## 下载一套真实牌面（Wikimedia 公有领域）

项目内置了一个下载脚本，会从 Wikimedia Commons 下载一套 Rider–Waite–Smith（TaionWC）扫描图，并自动重命名到本项目的 `id`：

```bash
cd /Users/boyusu/project
node scripts/download-rws-taionwc.mjs
```

## 部署（Vercel）

- 建议在 Vercel 项目里配置环境变量 `NEXT_PUBLIC_SITE_URL`（例如 `https://你的域名.com`），用于生成正确的 `sitemap.xml` / `robots.txt` / OG 绝对链接。

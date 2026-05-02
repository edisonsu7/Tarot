# 牌语 Tarot — 项目进度文档

## 项目定位

简约塔罗网页工具。包含每日一抽（固定本地模板）和灵感问牌（可选调用 OpenAI API）。  
视觉风格：米白、金色、柔和、留白、轻神秘感。

---

## 技术栈

- Next.js 15.3（App Router）
- React 19 + TypeScript 5.6 strict
- Tailwind CSS 3.4 + 自定义 CSS（`app/globals.css`）
- localStorage 做所有持久化（无后端数据库）
- OpenAI SDK v6（`openai` npm 包），仅 server-side 调用

---

## 核心路由结构

| 路由 | 说明 |
|------|------|
| `/` | 首页，两张入口卡片（每日一抽 / 灵感问牌） |
| `/daily` | 每日一抽入口，检查当天是否已抽 |
| `/daily/result` | 每日一抽结果页 |
| `/ask` | 灵感问牌，输入问题 |
| `/ask/draw` | 7 张牌扇形展开，点击翻牌 |
| `/ask/result` | 灵感问牌结果页 |
| `/cards/[cardId]/meaning` | 单张牌详细牌义页 |
| `/about` | 关于页 |
| `/privacy` | 隐私政策 |
| `/api/reading` | POST，server-side，调用 OpenAI Responses API |

---

## 核心文件一览

| 文件 | 作用 |
|------|------|
| `data/cards.json` | 78 张塔罗牌数据（id, nameCn, nameEn, keywords, meaningUpright, meaningReversed） |
| `lib/dailyDrawHelpers.ts` | 扇形布局、随机工具、每日一抽文案函数（suitableText, notSuitableText, oneLineConclusion） |
| `lib/askReadingHelpers.ts` | 灵感问牌本地模板文案（remindText, tryItems, avoidItems, oneLineSummary），支持 question 参数 |
| `lib/fortune.ts` | getMeaning（正/逆位牌义） |
| `lib/drawStorage.ts` | localStorage 读写（每日抽取记录、userId） |
| `lib/cardMeaningDetail.ts` | 牌义详情页路径生成，back 链接解析 |
| `components/AskDrawPick.tsx` | 7 张牌扇形抽牌，翻牌动画（5 阶段状态机），覆盖层 3D 翻牌 |
| `components/AskQuestionForm.tsx` | 问题输入表单，支持跳过 |
| `components/AskResultView.tsx` | 灵感问牌结果页，有问题时调 API，无问题走本地模板，API 失败自动 fallback |
| `components/DailyResultView.tsx` | 每日一抽结果页，纯本地模板 |
| `components/HomeLanding.tsx` | 首页两张入口卡片 |
| `components/TopNav.tsx` | 顶部导航栏 |
| `app/api/reading/route.ts` | OpenAI Responses API 路由，POST /api/reading |
| `app/globals.css` | 全站样式（Tailwind + 大量自定义 CSS） |

---

## OpenAI API 状态

- **路由**：`app/api/reading/route.ts`（POST `/api/reading`）
- **模型**：`gpt-4.1-mini`，Responses API，Structured Outputs（json_schema）
- **触发条件**：用户在 `/ask` 输入了实质性问题（非空、非"无具体问题"）
- **Key 读取**：只从 `process.env.OPENAI_API_KEY` 读取，不硬编码
- **本地配置**：`.env.local`（git-ignored）；模板文件 `.env.local.example`
- **Fallback**：API 失败时前端自动切换本地模板，不崩溃，显示一行提示

---

## 已完成 Phase 汇总

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 灵感问牌 Ask/Draw/Result 主流程 | ✅ 完成 |
| Phase 2 | 体验修复：7 张牌扇形、跳过问题、统一视觉结构、结果页内容增强、TopNav focus 修复 | ✅ 完成 |
| Phase 2.5 | 抽牌页卡牌尺寸 + 翻牌动画（5 阶段状态机 + 3D flip + 覆盖层） | ✅ 完成 |
| Phase 2.6 | 抽牌界面牌尺寸放大；灵感问牌问题输入影响结果（标题/说明文字区分） | ✅ 完成 |
| Phase 2.8 | 接入 OpenAI API，灵感问牌有问题时生成针对性解读 | ✅ 完成 |
| Phase 2.9 | 每日一抽文案去重复；导航栏圆角修复；移动端回归 | ✅ 完成 |
| Phase 2.9.6 | 分享卡片功能：替换复制按钮，新增 html-to-image 生成图片，v2 按钮层级 | ✅ 完成 |
| Phase 2.9.7 | 统一结果页底部操作：仅保留分享为主按钮，其余改为文字链接 | ✅ 完成 |
| Phase 2.9.8 | 抽取 `ResultActions` 共用组件，每日抽牌与灵感问牌结果页底部操作完全共享 | ✅ 完成 |
| Phase 2.9.9 | 修复结果页底部间距：去除多层 margin 叠加，分享按钮宽度收窄 | ✅ 完成 |
| Phase 2.9.10 | 创建 `SiteFooter` 组件，统一全站底部 | ✅ 完成 |
| Phase 2.9.11 | 创建 Client `AppShell`，用 `usePathname` 控制 footer 显示，修复 footer 出现在页面中间 | ✅ 完成 |
| Phase 2.9.12 | 每日一抽页替换为 7 张牌扇形抽牌（`DailyDrawPick`），与灵感问牌一致 | ✅ 完成 |
| Phase 2.9.13 | 修复分享按钮宽度不一致：`align-self: center` + `display: flex` + `width: 200px` 固定 | ✅ 完成 |

---

## 关键组件说明

| 组件 | 作用 |
|------|------|
| `components/AppShell.tsx` | 全站 shell，Client 组件，usePathname 控制 SiteFooter 显示（抽牌页不显示） |
| `components/SiteFooter.tsx` | 统一底部：隐私与数据 · © 2026 牌语 Tarot |
| `components/ResultActions.tsx` | 结果页底部操作区（分享按钮 + 了解这张牌/再试/返回首页 文字链接），两个结果页共用 |
| `components/ShareCard.tsx` | 600×800 离屏卡片 DOM，用于 html-to-image 截图 |
| `components/ShareCardButton.tsx` | 生成 PNG → navigator.share → 下载 → 剪贴板文字 fallback |
| `components/DailyDrawPick.tsx` | 每日一抽 7 张牌扇形抽牌，与 AskDrawPick 使用相同 CSS |

---

## 已知问题 / 待观察

1. **分享卡片**：`html-to-image` 在 iOS Safari 可能有跨域图片限制，需真机验证
2. **每日一抽无 API**：继续使用本地固定模板，未来可考虑接入（非当前优先级）

---

## 下一步方向（Phase 3 待定）

可选方向：SEO 优化 / 牌库页面 / 历史记录 / 更多牌阵

*最后更新：Phase 2.9.13 完成*

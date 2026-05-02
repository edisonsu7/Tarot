# CLAUDE.md — 牌语 Tarot 开发规范

## 项目说明

本项目是一个简约塔罗网页工具（牌语 Tarot），包含每日一抽和灵感问牌两个核心功能。  
每次开始工作前，请先阅读 `docs/PROJECT_PROGRESS.md` 了解当前进度和已知问题。

---

## 视觉风格规范

- 米白、金色、柔和、留白、轻神秘感
- 不要过度复杂化 UI
- 不要引入新的颜色体系或大改现有 CSS 变量
- 不要引入外部 UI 库（shadcn、MUI 等）
- 图标使用内联 SVG 或已有组件，不引入 icon 库

---

## OpenAI API 规范

- API key **只能**从 `process.env.OPENAI_API_KEY` 读取，不允许硬编码
- API 调用**只能**在 server-side（`app/api/` 目录下的 route.ts）进行，不能在前端直接调用
- `.env.local` 已加入 `.gitignore`，**不能提交**，只保留 `.env.local.example`（含占位符）
- 不要修改 `app/api/reading/route.ts` 的 key 读取方式
- 不要破坏灵感问牌 API 逻辑（有问题调 API，无问题走本地模板，失败 fallback）

---

## 开发规范

- 每次修改前先阅读相关文件，不要凭假设修改
- 不要新增未被要求的功能或抽象
- 不要在非必要情况下重构现有组件
- 每完成一个 Phase 后，更新 `docs/PROJECT_PROGRESS.md`
- TypeScript strict 模式，每次修改后运行 `npx tsc --noEmit` 确认零错误

---

## 数据与存储

- 所有持久化通过 localStorage（无后端数据库）
- key 命名：`tarot_ask_question`、`tarot_ask_result`、`tarot:draw:YYYY-MM-DD`、`tarot:userId`
- 不要引入新的持久化方式（indexedDB、cookie、server state）

---

## 禁止事项

- 不要把 API key 写入任何代码文件
- 不要提交 `.env.local`
- 不要在前端直接调用 OpenAI
- 不要破坏已有动画（翻牌 3D flip、扇形抽牌状态机）
- 不要在 Phase 2.9 之前重做 Phase 2.8 已完成的 API 接入逻辑

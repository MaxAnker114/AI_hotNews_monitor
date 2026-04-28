# AI 热点监控

AI 热点监控看板，支持多源抓取与 OpenRouter AI 分析。

## 功能概览
- 监控看板（热点雷达 / 监控词 / 搜索）
- 多源抓取：HackerNews、Reddit、GitHub、Google News RSS、Bing News RSS、TwitterAPI.io
- AI 相关性判定（OpenRouter，json_schema）
- 本地 JSON 持久化：`.data/hot-monitor.json`

## 环境要求
- Node.js 18+（建议 LTS）

## 启动步骤
1. 进入 Web 应用目录：
   ```bash
   cd web
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 配置环境变量（在 `web/.env.local`）：
   ```ini
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=deepseek/deepseek-v3.2
   TWITTERAPI_KEY=your_twitterapi_key_here
   ```
4. 启动开发环境：
   ```bash
   npm run dev
   ```
5. 打开 http://localhost:3000

## 常用脚本
在 `web/` 目录中执行：
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run build`

## 目录结构
- `web/` Next.js 应用（App Router）
- `docs/` 需求/方案/验收文档
- `agent-skills/` Agent Skills 资产

## API 接口（App Router）
- `POST /api/check-hotspots`
- `GET /api/hotspots`
- `GET /api/hotspots/stats`
- `POST /api/hotspots/search`
- `GET/POST /api/keywords`
- `PUT/DELETE /api/keywords/[id]`
- `PATCH /api/keywords/[id]/toggle`
- `GET/DELETE /api/notifications`
- `PATCH /api/notifications/read-all`

## 验收说明
详见 `docs/验收说明.md`。

## 说明
- Google/Bing 使用 RSS 获取，不需要额外 API Key。
- Twitter 使用 twitterapi.io，通过 `X-API-Key` 认证。

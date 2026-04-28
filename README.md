# AI Hotnews Detect

AI hotspot monitoring dashboard with multi-source fetch and OpenRouter AI analysis.

## Features
- Monitoring dashboard (hotspots, keywords, search)
- Multi-source fetch: HackerNews, Reddit, GitHub, Google News RSS, Bing News RSS, TwitterAPI.io
- AI relevance judgement via OpenRouter (json_schema)
- Local JSON persistence at `.data/hot-monitor.json`

## Requirements
- Node.js 18+ (LTS recommended)

## Setup
1. Enter the web app folder:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure env vars in `web/.env.local`:
   ```ini
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=deepseek/deepseek-v3.2
   TWITTERAPI_KEY=your_twitterapi_key_here
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

## Scripts
Run in `web/`:
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run build`

## Project Structure
- `web/` Next.js app (App Router)
- `docs/` requirements and acceptance documents
- `agent-skills/` agent skills assets

## API Endpoints (App Router)
- `POST /api/check-hotspots`
- `GET /api/hotspots`
- `GET /api/hotspots/stats`
- `POST /api/hotspots/search`
- `GET/POST /api/keywords`
- `PUT/DELETE /api/keywords/[id]`
- `PATCH /api/keywords/[id]/toggle`
- `GET/DELETE /api/notifications`
- `PATCH /api/notifications/read-all`

## Acceptance
See `docs/验收说明.md` for acceptance steps and status.

## Notes
- Google/Bing sources use RSS feeds; no additional API keys required.
- Twitter source uses twitterapi.io with `X-API-Key` header.

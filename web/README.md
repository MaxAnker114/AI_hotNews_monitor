# Signal Forge - AI 热点识别 Web

基于 Next.js App Router 与 OpenRouter 的热点识别系统。

## 功能

- 新闻文本输入（每行一条）
- AI 热点识别（主题、热度、原因、关联标题）
- 后续观察建议
- 独特化视觉风格与基础动效

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
OPENROUTER_API_KEY=你的key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

3. 启动开发服务

```bash
npm run dev
```

访问 `http://localhost:3000`。

## 测试与构建

```bash
npm run lint
npm run test
npm run build
```

## 关键技术说明

- 前端：`src/app/page.tsx`
- API：`src/app/api/analyze/route.ts`
- 业务逻辑：`src/lib/analyze.ts`
- 单元测试：`src/lib/__tests__/analyze.test.ts`

## OpenRouter 对接说明

- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Header:
	- `Authorization: Bearer <OPENROUTER_API_KEY>`
	- `HTTP-Referer`
	- `X-OpenRouter-Title`
- 使用 `response_format` 的 `json_schema` 约束模型输出结构

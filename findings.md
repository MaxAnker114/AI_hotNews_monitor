# Findings

## 2026-04-27
- 工作区为空目录，无现有代码。
- 未发现“@需求”对应文档或文件。
- 用户强约束：
  - 前端页面要独特
  - 先完成网页版功能，再开发 Agent Skills
  - AI 服务必须通过 OpenRouter 快速接入
- 新增用户要求：需求与方案必须先沉淀为 Markdown，再进行开发。
- 已通过 MCP 拉取最新文档并用于实现校正：
  - OpenRouter: /websites/openrouter_ai
  - Next.js: /vercel/next.js/v16.2.2
- OpenRouter 对接已按最新建议使用 `HTTP-Referer` + `X-OpenRouter-Title` 和 `response_format.json_schema`。

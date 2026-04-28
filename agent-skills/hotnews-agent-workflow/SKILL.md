---
name: hotnews-agent-workflow
description: 用于新闻热点识别与周报生成。只要用户提到热点识别、新闻聚类、舆情分析、趋势追踪、AI 摘要报告，或希望把多条新闻整理成结构化结论时，都应优先使用该技能。技能会完成输入清洗、OpenRouter 分析调用、结果结构化、风险提示和报告输出。
---

# Hotnews Agent Workflow

## 目标
将离散新闻内容转化为可执行的热点报告，输出统一结构，便于投研、内容运营和情报跟踪。

## 输入要求
- 支持纯文本多行输入（每行一条新闻）
- 推荐格式：标题 | 来源 | 摘要
- 最少 3 条

## 执行步骤
1. 清洗输入：去除空行、编号前缀和重复条目。
2. 结构化：解析为 `title/source/summary`。
3. 质量检查：不足 3 条则停止并提示补充。
4. 调用 AI：使用 OpenRouter Chat Completions，要求返回结构化 JSON。
5. 结果归一：将热点按分数降序，限制最大 6 项。
6. 风险提示：标记信息样本不足、来源单一、结论置信度等风险。
7. 输出报告：使用模板生成 Markdown 报告。

## 输出格式
始终输出以下结构：

```markdown
# 热点分析报告

## 总结
...

## 热点榜单
1. 主题（分数）
   - 原因
   - 关联新闻

## 下一步观察
- ...

## 风险与置信度
- ...
```

## OpenRouter 实现建议
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Headers:
  - `Authorization: Bearer <OPENROUTER_API_KEY>`
  - `HTTP-Referer`
  - `X-OpenRouter-Title`
- 使用 `response_format` 的 `json_schema` 约束返回结果

## 质量标准
- 热点主题之间不应语义重复
- 原因描述必须可追溯到输入新闻
- 不输出无依据结论
- 输出语言优先使用中文

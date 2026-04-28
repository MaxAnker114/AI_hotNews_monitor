import type { AnalysisResult, HotTopic, InputNewsItem } from "@/lib/types";

export function parseRawNewsInput(rawText: string): InputNewsItem[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\.)、\s]+/, ""))
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      const [title, source, summary] = parts;

      return {
        title: title || line,
        source,
        summary,
      } satisfies InputNewsItem;
    });
}

export function ensureEnoughNews(items: InputNewsItem[], min = 3): void {
  if (items.length < min) {
    throw new Error(`请至少输入 ${min} 条新闻后再进行识别。`);
  }
}

export function buildPrompt(items: InputNewsItem[]): string {
  return [
    "你是一名金融与科技热点分析师。",
    "请根据输入新闻识别热点，并仅输出 JSON。",
    "JSON 结构要求:",
    "{",
    '  "overallSummary": "string",',
    '  "hotTopics": [',
    "    {",
    '      "topic": "string",',
    '      "score": 0-100 的整数,',
    '      "reason": "string",',
    '      "relatedTitles": ["string"]',
    "    }",
    "  ],",
    '  "nextWatch": ["string"]',
    "}",
    "要求:",
    "1) hotTopics 最多 6 项，按 score 降序",
    "2) relatedTitles 仅从输入标题中提取",
    "3) 结论要具体，避免空话",
    "输入新闻如下:",
    JSON.stringify(items, null, 2),
  ].join("\n");
}

export function extractJsonObject(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI 返回内容不是有效 JSON。");
  }

  return text.slice(first, last + 1);
}

export function normalizeResult(raw: unknown, model: string): AnalysisResult {
  const payload = raw as Partial<AnalysisResult>;

  const hotTopics: HotTopic[] = Array.isArray(payload.hotTopics)
    ? payload.hotTopics
        .map((item) => ({
          topic: String(item.topic || "未命名热点"),
          score: clampScore(item.score),
          reason: String(item.reason || "暂无说明"),
          relatedTitles: Array.isArray(item.relatedTitles)
            ? item.relatedTitles.map((v) => String(v)).slice(0, 5)
            : [],
        }))
        .slice(0, 6)
        .sort((a, b) => b.score - a.score)
    : [];

  return {
    overallSummary: String(payload.overallSummary || "暂无总结"),
    hotTopics,
    nextWatch: Array.isArray(payload.nextWatch)
      ? payload.nextWatch.map((item) => String(item)).slice(0, 5)
      : [],
    model,
    generatedAt: new Date().toISOString(),
  };
}

function clampScore(score: unknown): number {
  const num = Number(score);

  if (Number.isNaN(num)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(num)));
}

import { extractJsonObject } from "@/lib/analyze";
import type { CandidateItem, Hotspot, Importance, Keyword, SourceType } from "@/lib/monitor-types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type AiResult = {
  isReal: boolean;
  relevance: number;
  importance: Importance;
  summary: string;
  relevanceReason: string;
};

const AI_SCHEMA = {
  type: "object",
  properties: {
    isReal: { type: "boolean" },
    relevance: { type: "number" },
    importance: { type: "string", enum: ["low", "medium", "high", "urgent"] },
    summary: { type: "string" },
    relevanceReason: { type: "string" },
  },
  required: ["isReal", "relevance", "importance", "summary", "relevanceReason"],
  additionalProperties: false,
};

export async function toHotspots(
  keyword: Keyword,
  candidates: CandidateItem[],
  model: string,
): Promise<Hotspot[]> {
  const topCandidates = candidates.slice(0, 16);

  const tasks = topCandidates.map(async (item) => {
    const ai = await analyzeCandidate(item, keyword.text, model);
    const relevance = clamp(ai.relevance);

    return {
      id: crypto.randomUUID(),
      keywordId: keyword.id,
      title: item.title,
      content: item.content,
      url: item.url,
      source: item.source,
      sourceId: item.sourceId,
      isReal: ai.isReal,
      relevance,
      importance: ai.importance,
      summary: ai.summary,
      relevanceReason: ai.relevanceReason,
      publishedAt: item.publishedAt,
      createdAt: new Date().toISOString(),
      scoreHint: item.scoreHint,
    } satisfies Hotspot;
  });

  const hotspots = await Promise.all(tasks);

  return hotspots
    .filter((item) => item.isReal && item.relevance >= 55)
    .sort((a, b) => b.relevance - a.relevance);
}

export async function analyzeCandidate(
  candidate: CandidateItem,
  keyword: string,
  model: string,
): Promise<AiResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return heuristic(candidate, keyword);
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-OpenRouter-Title": "AI Hotnews Detect",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 220,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hotspot_judgement",
            strict: true,
            schema: AI_SCHEMA,
          },
        },
        messages: [
          {
            role: "system",
            content:
              "你是热点监控系统的审核员。请判断是否真实、与监控词相关度、重要程度，并输出 JSON。",
          },
          {
            role: "user",
            content: [
              `监控词: ${keyword}`,
              `来源: ${candidate.source}`,
              `标题: ${candidate.title}`,
              `内容: ${candidate.content || "无"}`,
              `链接: ${candidate.url}`,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return heuristic(candidate, keyword);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((item) => item.text || "").join("\n")
          : "";

    if (!text) {
      return heuristic(candidate, keyword);
    }

    const payload = JSON.parse(extractJsonObject(text)) as AiResult;
    return {
      isReal: Boolean(payload.isReal),
      relevance: clamp(payload.relevance),
      importance: toImportance(payload.importance),
      summary: String(payload.summary || "暂无摘要"),
      relevanceReason: String(payload.relevanceReason || "模型未给出详细理由"),
    };
  } catch {
    return heuristic(candidate, keyword);
  }
}

function heuristic(candidate: CandidateItem, keyword: string): AiResult {
  const lowText = `${candidate.title} ${candidate.content}`.toLowerCase();
  const lowKeyword = keyword.toLowerCase();
  const matched = lowText.includes(lowKeyword);
  const base = candidate.scoreHint || 50;
  const relevance = clamp(matched ? base + 20 : base - 10);

  return {
    isReal: true,
    relevance,
    importance: relevance > 85 ? "urgent" : relevance > 72 ? "high" : relevance > 58 ? "medium" : "low",
    summary: candidate.content ? candidate.content.slice(0, 90) : candidate.title,
    relevanceReason: matched
      ? `标题或正文直接命中监控词“${keyword}”，并结合来源热度评分。`
      : `未直接命中监控词“${keyword}”，按来源热度与语义相关度做保守估计。`,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function toImportance(value: string): Importance {
  if (value === "urgent" || value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

export function sourceLabel(source: SourceType): string {
  if (source === "hackernews") return "HackerNews";
  if (source === "reddit") return "Reddit";
  if (source === "github") return "GitHub";
  if (source === "google") return "Google News";
  if (source === "bing") return "Bing News";
  return "Twitter";
}

import { NextResponse } from "next/server";

import {
  buildPrompt,
  ensureEnoughNews,
  extractJsonObject,
  normalizeResult,
  parseRawNewsInput,
} from "@/lib/analyze";
import type { InputNewsItem } from "@/lib/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    overallSummary: { type: "string" },
    hotTopics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          score: { type: "number" },
          reason: { type: "string" },
          relatedTitles: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["topic", "score", "reason", "relatedTitles"],
        additionalProperties: false,
      },
    },
    nextWatch: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["overallSummary", "hotTopics", "nextWatch"],
  additionalProperties: false,
};

type AnalyzeRequest = {
  rawText?: string;
  items?: InputNewsItem[];
  model?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequest;
    const items = Array.isArray(body.items)
      ? body.items
      : parseRawNewsInput(body.rawText || "");

    ensureEnoughNews(items, 3);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "缺少 OPENROUTER_API_KEY。请先在 web/.env.local 配置后重试。",
        },
        { status: 500 },
      );
    }

    const model = body.model?.trim() || DEFAULT_MODEL;

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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hotnews_analysis",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
        messages: [
          {
            role: "system",
            content:
              "你是专业热点识别助手。只输出 JSON，不输出任何额外解释。",
          },
          {
            role: "user",
            content: buildPrompt(items),
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter 请求失败: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?:
            | string
            | Array<{
                type?: string;
                text?: string;
              }>;
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
      throw new Error("OpenRouter 返回为空。请更换模型或稍后重试。");
    }

    const result = normalizeResult(JSON.parse(extractJsonObject(text)), model);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

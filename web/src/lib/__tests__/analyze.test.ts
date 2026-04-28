import { describe, expect, it } from "vitest";

import {
  ensureEnoughNews,
  extractJsonObject,
  normalizeResult,
  parseRawNewsInput,
} from "../analyze";

describe("parseRawNewsInput", () => {
  it("parses line-based news input", () => {
    const input = [
      "1. 标题A | 来源A | 摘要A",
      "标题B | 来源B",
      "标题C",
    ].join("\n");

    const result = parseRawNewsInput(input);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("标题A");
    expect(result[0].source).toBe("来源A");
    expect(result[0].summary).toBe("摘要A");
    expect(result[2].title).toBe("标题C");
  });

  it("throws when not enough items", () => {
    expect(() => ensureEnoughNews([{ title: "only one" }], 3)).toThrow("请至少输入 3 条新闻");
  });
});

describe("extractJsonObject", () => {
  it("extracts json payload from wrapped text", () => {
    const raw = "Here you go: {\"a\":1,\"b\":2}";
    expect(extractJsonObject(raw)).toBe('{"a":1,"b":2}');
  });

  it("throws on invalid text", () => {
    expect(() => extractJsonObject("no-json")).toThrow("AI 返回内容不是有效 JSON");
  });
});

describe("normalizeResult", () => {
  it("normalizes and sorts topics", () => {
    const result = normalizeResult(
      {
        overallSummary: "summary",
        hotTopics: [
          { topic: "B", score: 20.4, reason: "r2", relatedTitles: ["b"] },
          { topic: "A", score: 99.8, reason: "r1", relatedTitles: ["a"] },
        ],
        nextWatch: ["w1", "w2"],
      },
      "model-x",
    );

    expect(result.model).toBe("model-x");
    expect(result.hotTopics[0].topic).toBe("A");
    expect(result.hotTopics[0].score).toBe(100);
    expect(result.nextWatch).toEqual(["w1", "w2"]);
  });
});

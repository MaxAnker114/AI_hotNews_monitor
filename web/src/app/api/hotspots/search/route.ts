import { NextResponse } from "next/server";

import { toHotspots } from "@/lib/monitor-ai";
import { fetchBySources, DEFAULT_SOURCES } from "@/lib/monitor-sources";
import type { Keyword, SourceType } from "@/lib/monitor-types";

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { query?: string; sources?: SourceType[] };
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: "搜索词不能为空" }, { status: 400 });
    }

    const sources = (body.sources?.length ? body.sources : DEFAULT_SOURCES).slice(0, 3);
    const candidates = await fetchBySources(query, sources);

    const fakeKeyword: Keyword = {
      id: "manual-search",
      text: query,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analyzed = await toHotspots(fakeKeyword, candidates, DEFAULT_MODEL);

    return NextResponse.json({ results: analyzed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "搜索失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

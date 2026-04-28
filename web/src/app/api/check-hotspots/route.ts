import { NextResponse } from "next/server";

import { toHotspots } from "@/lib/monitor-ai";
import { addHotspots, listKeywords } from "@/lib/monitor-store";
import { DEFAULT_SOURCES, fetchBySources } from "@/lib/monitor-sources";

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

export async function POST() {
  try {
    const keywords = (await listKeywords()).filter((item) => item.isActive);

    if (keywords.length === 0) {
      return NextResponse.json({ message: "没有启用中的监控词", created: 0 });
    }

    let totalCreated = 0;

    for (const keyword of keywords) {
      const candidates = await fetchBySources(keyword.text, DEFAULT_SOURCES);
      const hotspots = await toHotspots(keyword, candidates, DEFAULT_MODEL);
      await addHotspots(hotspots);
      totalCreated += hotspots.length;
    }

    return NextResponse.json({ message: "热点检查完成", created: totalCreated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "热点检查失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

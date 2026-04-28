import { NextResponse } from "next/server";

import { listHotspots } from "@/lib/monitor-store";

export async function GET() {
  const hotspots = await listHotspots();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const stats = {
    total: hotspots.length,
    today: hotspots.filter((item) => now - Date.parse(item.createdAt) <= oneDay).length,
    urgent: hotspots.filter((item) => item.importance === "urgent").length,
    bySource: hotspots.reduce<Record<string, number>>((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {}),
  };

  return NextResponse.json(stats);
}

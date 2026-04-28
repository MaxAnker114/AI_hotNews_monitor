import { NextResponse } from "next/server";

import { listHotspots } from "@/lib/monitor-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || 20)));

  const source = searchParams.get("source") || "";
  const importance = searchParams.get("importance") || "";
  const keywordId = searchParams.get("keywordId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  let data = await listHotspots();

  if (source) {
    data = data.filter((item) => item.source === source);
  }
  if (importance) {
    data = data.filter((item) => item.importance === importance);
  }
  if (keywordId) {
    data = data.filter((item) => item.keywordId === keywordId);
  }

  data = [...data].sort((a, b) => {
    const left = sortBy === "relevance" ? a.relevance : Date.parse(a.createdAt);
    const right = sortBy === "relevance" ? b.relevance : Date.parse(b.createdAt);
    return sortOrder === "asc" ? left - right : right - left;
  });

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return NextResponse.json({
    data: data.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

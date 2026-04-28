import { NextResponse } from "next/server";

import { createKeyword, listKeywords } from "@/lib/monitor-store";

export async function GET() {
  const keywords = await listKeywords();
  return NextResponse.json(keywords);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; category?: string };
    const keyword = await createKeyword(body.text || "", body.category?.trim() || undefined);
    return NextResponse.json(keyword, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建监控词失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

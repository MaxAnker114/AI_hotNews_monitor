import { NextResponse } from "next/server";

import { toggleKeyword } from "@/lib/monitor-store";

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const keyword = await toggleKeyword(id);
    return NextResponse.json(keyword);
  } catch (error) {
    const message = error instanceof Error ? error.message : "切换失败";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

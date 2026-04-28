import { NextResponse } from "next/server";

import { deleteKeyword, readStore, writeStore } from "@/lib/monitor-store";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await deleteKeyword(id);
  return new Response(null, { status: 204 });
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { text?: string; category?: string };

    const store = await readStore();
    const target = store.keywords.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ error: "监控词不存在" }, { status: 404 });
    }

    if (body.text?.trim()) {
      target.text = body.text.trim();
    }
    target.category = body.category?.trim() || undefined;
    target.updatedAt = new Date().toISOString();

    await writeStore(store);
    return NextResponse.json(target);
  } catch {
    return NextResponse.json({ error: "更新监控词失败" }, { status: 400 });
  }
}

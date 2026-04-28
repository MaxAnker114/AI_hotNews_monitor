import { NextResponse } from "next/server";

import { clearNotifications, listNotifications } from "@/lib/monitor-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 20)));
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  let data = await listNotifications();
  if (unreadOnly) {
    data = data.filter((item) => !item.isRead);
  }

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return NextResponse.json({
    data: data.slice(start, start + limit),
    unreadCount: data.filter((item) => !item.isRead).length,
    pagination: { page, limit, total, totalPages },
  });
}

export async function DELETE() {
  await clearNotifications();
  return new Response(null, { status: 204 });
}

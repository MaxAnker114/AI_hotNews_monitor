import { markAllNotificationsRead } from "@/lib/monitor-store";

export async function PATCH() {
  await markAllNotificationsRead();
  return new Response(null, { status: 204 });
}

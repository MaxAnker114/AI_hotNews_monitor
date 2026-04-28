import type { Hotspot, Keyword, Notification, SourceType } from "@/lib/monitor-types";

export type Stats = {
  total: number;
  today: number;
  urgent: number;
  bySource: Record<string, number>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "请求失败");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const keywordsApi = {
  getAll: () => request<Keyword[]>("/api/keywords"),
  create: (data: { text: string; category?: string }) =>
    request<Keyword>("/api/keywords", { method: "POST", body: JSON.stringify(data) }),
  toggle: (id: string) => request<Keyword>(`/api/keywords/${id}/toggle`, { method: "PATCH" }),
  delete: (id: string) => request<void>(`/api/keywords/${id}`, { method: "DELETE" }),
};

export const hotspotsApi = {
  getAll: (params: URLSearchParams) =>
    request<{ data: Hotspot[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/hotspots?${params.toString()}`,
    ),
  getStats: () => request<Stats>("/api/hotspots/stats"),
  search: (query: string, sources: SourceType[]) =>
    request<{ results: Hotspot[] }>("/api/hotspots/search", {
      method: "POST",
      body: JSON.stringify({ query, sources }),
    }),
};

export const notificationsApi = {
  getAll: () => request<{ data: Notification[]; unreadCount: number }>("/api/notifications?limit=20"),
  markAllRead: () => request<void>("/api/notifications/read-all", { method: "PATCH" }),
};

export const triggerHotspotCheck = () =>
  request<{ message: string; created: number }>("/api/check-hotspots", { method: "POST" });

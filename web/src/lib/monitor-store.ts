import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Hotspot, Keyword, MonitorStore, Notification } from "@/lib/monitor-types";

const STORE_PATH = join(process.cwd(), ".data", "hot-monitor.json");

const EMPTY_STORE: MonitorStore = {
  keywords: [],
  hotspots: [],
  notifications: [],
};

export async function readStore(): Promise<MonitorStore> {
  try {
    const content = await readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(content) as MonitorStore;
    return {
      keywords: parsed.keywords || [],
      hotspots: parsed.hotspots || [],
      notifications: parsed.notifications || [],
    };
  } catch {
    return EMPTY_STORE;
  }
}

export async function writeStore(store: MonitorStore): Promise<void> {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function listKeywords(): Promise<Keyword[]> {
  const store = await readStore();
  return store.keywords.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createKeyword(text: string, category?: string): Promise<Keyword> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("监控词不能为空");
  }

  const store = await readStore();
  const exists = store.keywords.some((item) => item.text.toLowerCase() === cleanText.toLowerCase());
  if (exists) {
    throw new Error("监控词已存在");
  }

  const now = new Date().toISOString();
  const keyword: Keyword = {
    id: crypto.randomUUID(),
    text: cleanText,
    category,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  store.keywords.unshift(keyword);
  await writeStore(store);
  return keyword;
}

export async function toggleKeyword(id: string): Promise<Keyword> {
  const store = await readStore();
  const target = store.keywords.find((item) => item.id === id);

  if (!target) {
    throw new Error("监控词不存在");
  }

  target.isActive = !target.isActive;
  target.updatedAt = new Date().toISOString();
  await writeStore(store);
  return target;
}

export async function deleteKeyword(id: string): Promise<void> {
  const store = await readStore();
  store.keywords = store.keywords.filter((item) => item.id !== id);
  const deletedHotspotIds = new Set(store.hotspots.filter((item) => item.keywordId === id).map((item) => item.id));
  store.hotspots = store.hotspots.filter((item) => item.keywordId !== id);
  store.notifications = store.notifications.filter((item) => !item.hotspotId || !deletedHotspotIds.has(item.hotspotId));
  await writeStore(store);
}

export async function addHotspots(newHotspots: Hotspot[]): Promise<void> {
  if (newHotspots.length === 0) {
    return;
  }

  const store = await readStore();
  const dedupKey = new Set(
    store.hotspots.map((item) => `${item.keywordId}::${item.source}::${item.url}`),
  );

  const incoming = newHotspots.filter((item) => {
    const key = `${item.keywordId}::${item.source}::${item.url}`;
    if (dedupKey.has(key)) {
      return false;
    }
    dedupKey.add(key);
    return true;
  });

  if (incoming.length === 0) {
    return;
  }

  store.hotspots = [...incoming, ...store.hotspots].slice(0, 1200);

  const notifications: Notification[] = incoming.slice(0, 20).map((item) => ({
    id: crypto.randomUUID(),
    type: "hotspot",
    title: `发现新热点：${item.title}`,
    content: `${item.source} · 相关度 ${item.relevance}`,
    isRead: false,
    hotspotId: item.id,
    createdAt: new Date().toISOString(),
  }));

  store.notifications = [...notifications, ...store.notifications].slice(0, 500);
  await writeStore(store);
}

export async function listHotspots(): Promise<Hotspot[]> {
  const store = await readStore();
  return store.hotspots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listNotifications(): Promise<Notification[]> {
  const store = await readStore();
  return store.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markAllNotificationsRead(): Promise<void> {
  const store = await readStore();
  store.notifications = store.notifications.map((item) => ({ ...item, isRead: true }));
  await writeStore(store);
}

export async function clearNotifications(): Promise<void> {
  const store = await readStore();
  store.notifications = [];
  await writeStore(store);
}

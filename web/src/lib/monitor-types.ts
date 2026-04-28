export type SourceType = "hackernews" | "reddit" | "github" | "google" | "bing" | "twitter";

export type Importance = "low" | "medium" | "high" | "urgent";

export type Keyword = {
  id: string;
  text: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Hotspot = {
  id: string;
  keywordId: string;
  title: string;
  content: string;
  url: string;
  source: SourceType;
  sourceId?: string;
  isReal: boolean;
  relevance: number;
  importance: Importance;
  summary: string;
  relevanceReason: string;
  publishedAt?: string;
  createdAt: string;
  scoreHint?: number;
};

export type Notification = {
  id: string;
  type: "hotspot" | "system";
  title: string;
  content: string;
  isRead: boolean;
  hotspotId: string | null;
  createdAt: string;
};

export type MonitorStore = {
  keywords: Keyword[];
  hotspots: Hotspot[];
  notifications: Notification[];
};

export type CandidateItem = {
  title: string;
  content: string;
  url: string;
  source: SourceType;
  sourceId?: string;
  publishedAt?: string;
  scoreHint?: number;
};

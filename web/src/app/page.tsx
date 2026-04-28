"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { hotspotsApi, keywordsApi, notificationsApi, triggerHotspotCheck, type Stats } from "@/lib/monitor-api";
import { sourceLabel } from "@/lib/monitor-ai";
import type { Hotspot, Keyword, SourceType } from "@/lib/monitor-types";

type TabKey = "dashboard" | "keywords" | "search";

const SOURCE_OPTIONS: Array<{ label: string; value: SourceType }> = [
  { label: "HackerNews", value: "hackernews" },
  { label: "Reddit", value: "reddit" },
  { label: "GitHub", value: "github" },
  { label: "Google News", value: "google" },
  { label: "Bing News", value: "bing" },
  { label: "Twitter", value: "twitter" },
];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} 分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} 小时前`;
  return `${Math.floor(diffMs / day)} 天前`;
}

export default function Home() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [keywordText, setKeywordText] = useState("AI 编程");
  const [searchQuery, setSearchQuery] = useState("deepseek");
  const [searchSources, setSearchSources] = useState<SourceType[]>([
    "hackernews",
    "reddit",
    "github",
    "google",
    "bing",
    "twitter",
  ]);
  const [searchResults, setSearchResults] = useState<Hotspot[]>([]);
  const [searching, setSearching] = useState(false);

  const [sourceFilter, setSourceFilter] = useState("");

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError("");
    }
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "30");
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "desc");
      if (sourceFilter) {
        params.set("source", sourceFilter);
      }

      const [kw, hs, st, notif] = await Promise.all([
        keywordsApi.getAll(),
        hotspotsApi.getAll(params),
        hotspotsApi.getStats(),
        notificationsApi.getAll(),
      ]);

      setKeywords(kw);
      setHotspots(hs.data);
      setStats(st);
      setUnreadCount(notif.unreadCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载失败";
      setError(message);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [sourceFilter]);

  // Initial data bootstrap for dashboard
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData({ silent: true });
  }, [loadData]);

  const handleCreateKeyword = async () => {
    try {
      await keywordsApi.create({ text: keywordText });
      setKeywordText("");
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建失败";
      setError(message);
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    setError("");
    try {
      await triggerHotspotCheck();
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "触发失败";
      setError(message);
    } finally {
      setChecking(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setError("");
    try {
      const response = await hotspotsApi.search(searchQuery, searchSources);
      setSearchResults(response.results);
    } catch (err) {
      const message = err instanceof Error ? err.message : "搜索失败";
      setError(message);
    } finally {
      setSearching(false);
    }
  };

  const sourceStats = useMemo(() => stats?.bySource || {}, [stats]);

  return (
    <main className="mesh min-h-screen px-4 py-8 md:px-8 md:py-12">
      <section className="mx-auto max-w-7xl reveal">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs tracking-[0.2em] text-[#a7b5cf]">
              SIGNAL FORGE · OPENROUTER
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
              AI 热点监控控制台
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c6d2e8] md:text-base">
              监控词管理、多源抓取、AI 相关性判断、热点雷达看板，一站式掌握实时动态。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#0ea5e9] px-4 py-2 text-sm font-semibold text-[#05131f] transition hover:brightness-110 disabled:opacity-70"
            >
              {checking ? "检查中..." : "手动检查热点"}
            </button>
            <div className="glass rounded-2xl px-4 py-2 text-sm text-[#d7e4fb]">
              未读通知 <span className="font-semibold text-[#f59e0b]">{unreadCount}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { key: "dashboard", label: "热点雷达" },
            { key: "keywords", label: "监控词" },
            { key: "search", label: "搜索" },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-xl border px-4 py-2 text-sm transition ${tab === item.key ? "border-[#22d3ee] bg-[#22d3ee]/15 text-[#dff8ff]" : "border-[#2a3c5f] text-[#adc2e2] hover:border-[#4a6ea3]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-[#7f1d1d] bg-[#450a0a]/40 px-3 py-2 text-sm text-[#fecaca]">
            {error}
          </p>
        )}

        {tab === "dashboard" && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-[#89a3ca]">总热点</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats?.total ?? 0}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-[#89a3ca]">24h 新增</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats?.today ?? 0}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-[#89a3ca]">紧急级别</p>
                <p className="mt-1 text-2xl font-semibold text-[#fb7185]">{stats?.urgent ?? 0}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-[#89a3ca]">来源数</p>
                <p className="mt-1 text-2xl font-semibold text-[#22d3ee]">{Object.keys(sourceStats).length}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSourceFilter("")}
                className={`rounded-lg border px-3 py-1.5 text-xs ${sourceFilter === "" ? "border-[#f59e0b] text-[#ffd08a]" : "border-[#2a3c5f] text-[#a8bbd9]"}`}
              >
                全部来源
              </button>
              {SOURCE_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSourceFilter(item.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${sourceFilter === item.value ? "border-[#f59e0b] text-[#ffd08a]" : "border-[#2a3c5f] text-[#a8bbd9]"}`}
                >
                  {item.label} ({sourceStats[item.value] || 0})
                </button>
              ))}
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-lg border border-[#2a3c5f] px-3 py-1.5 text-xs text-[#a8bbd9] hover:border-[#4a6ea3]"
              >
                刷新
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="glass rounded-2xl p-6 text-sm text-[#a8bbd9]">加载中...</div>
              ) : hotspots.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-sm text-[#a8bbd9]">暂无热点，先添加监控词并手动检查。</div>
              ) : (
                hotspots.map((item) => (
                  <article key={item.id} className="glass rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-xs text-[#8ea0bf]">
                          {sourceLabel(item.source)} · 抓取 {relativeTime(item.createdAt)} · 相关度 {item.relevance}
                        </p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#2a3c5f] px-3 py-1 text-xs text-[#d9e5fb] hover:border-[#22d3ee]"
                      >
                        查看原文
                      </a>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#cfddf6]">{item.summary}</p>
                    <p className="mt-2 text-xs text-[#9db1d2]">AI 理由：{item.relevanceReason}</p>
                  </article>
                ))
              )}
            </div>
          </>
        )}

        {tab === "keywords" && (
          <div className="glass rounded-3xl p-5 md:p-6">
            <h2 className="text-xl font-semibold text-white">监控词管理</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                value={keywordText}
                onChange={(event) => setKeywordText(event.target.value)}
                placeholder="新增监控词，例如：AI Agent"
                className="w-full max-w-md rounded-xl border border-[#2a3c5f] bg-[#0c1425] px-4 py-2 text-sm text-[#eff5ff] outline-none focus:border-[#22d3ee]"
              />
              <button
                type="button"
                onClick={() => void handleCreateKeyword()}
                className="rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fb7185] px-5 py-2 text-sm font-semibold text-[#111827]"
              >
                添加监控词
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {keywords.length === 0 ? (
                <p className="text-sm text-[#9fb0cf]">还没有监控词。</p>
              ) : (
                keywords.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#2a3c5f] bg-[#0c1425] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#e2ecff]">{item.text}</p>
                        <p className="text-xs text-[#8ea0bf]">更新于 {relativeTime(item.updatedAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => keywordsApi.toggle(item.id).then(() => loadData()).catch((e: Error) => setError(e.message))}
                          className={`rounded-lg border px-3 py-1 text-xs ${item.isActive ? "border-emerald-500/40 text-emerald-300" : "border-slate-500/40 text-slate-300"}`}
                        >
                          {item.isActive ? "已启用" : "已暂停"}
                        </button>
                        <button
                          type="button"
                          onClick={() => keywordsApi.delete(item.id).then(() => loadData()).catch((e: Error) => setError(e.message))}
                          className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-300"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "search" && (
          <div className="glass rounded-3xl p-5 md:p-6">
            <h2 className="text-xl font-semibold text-white">手动搜索热点</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full max-w-md rounded-xl border border-[#2a3c5f] bg-[#0c1425] px-4 py-2 text-sm text-[#eff5ff] outline-none focus:border-[#22d3ee]"
                placeholder="输入搜索关键词"
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={searching}
                className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#38bdf8] px-5 py-2 text-sm font-semibold text-[#05131f] disabled:opacity-70"
              >
                {searching ? "搜索中..." : "开始搜索"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((item) => {
                const checked = searchSources.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setSearchSources((prev) =>
                        prev.includes(item.value)
                          ? prev.filter((v) => v !== item.value)
                          : [...prev, item.value],
                      );
                    }}
                    className={`rounded-lg border px-3 py-1 text-xs ${checked ? "border-[#f59e0b] text-[#ffd08a]" : "border-[#2a3c5f] text-[#a8bbd9]"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              {searchResults.length === 0 ? (
                <p className="text-sm text-[#9fb0cf]">暂无结果，先输入关键词并搜索。</p>
              ) : (
                searchResults.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[#2a3c5f] bg-[#0c1425] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 text-xs text-[#8ea0bf]">
                          {sourceLabel(item.source)} · 相关度 {item.relevance} · {item.importance}
                        </p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#2a3c5f] px-3 py-1 text-xs text-[#d9e5fb]"
                      >
                        打开
                      </a>
                    </div>
                    <p className="mt-2 text-sm text-[#cfddf6]">{item.summary}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        <section className="mt-8">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs tracking-[0.2em] text-[#8ea0bf]">STATUS</p>
            <p className="mt-2 text-sm text-[#d9e5fb]">
              当前版本已实现：多源抓取（HN/Reddit/GitHub）、监控词 CRUD、手动检查、热点统计、通知计数、AI 相关性判断。
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

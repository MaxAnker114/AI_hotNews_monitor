import type { CandidateItem, SourceType } from "@/lib/monitor-types";

export const DEFAULT_SOURCES: SourceType[] = [
  "hackernews",
  "reddit",
  "github",
  "google",
  "bing",
  "twitter",
];

const MAX_WEB_RESULTS = 30;
const USER_AGENT = "ai-hotnews-detect/1.0";

export async function fetchBySources(query: string, sources: SourceType[]): Promise<CandidateItem[]> {
  const tasks = sources.map(async (source) => {
    if (source === "hackernews") return searchHackerNews(query);
    if (source === "reddit") return searchReddit(query);
    if (source === "github") return searchGithub(query);
    if (source === "google") return searchGoogleNews(query);
    if (source === "bing") return searchBingNews(query);
    return searchTwitter(query);
  });

  const settled = await Promise.allSettled(tasks);
  return settled
    .filter((item): item is PromiseFulfilledResult<CandidateItem[]> => item.status === "fulfilled")
    .flatMap((item) => item.value);
}

async function searchHackerNews(query: string): Promise<CandidateItem[]> {
  try {
    const endpoint = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=12`;
    const response = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as {
      hits?: Array<{
        objectID?: string;
        title?: string;
        story_text?: string;
        url?: string;
        points?: number;
        num_comments?: number;
        created_at?: string;
      }>;
    };

    return (json.hits || [])
      .filter((item) => item.title && item.url)
      .map((item) => ({
        title: item.title || "",
        content: item.story_text || "",
        url: item.url || "",
        source: "hackernews" as const,
        sourceId: item.objectID,
        publishedAt: item.created_at,
        scoreHint: Math.min(100, Math.round((item.points || 0) * 0.8 + (item.num_comments || 0) * 1.5)),
      }));
  } catch {
    return [];
  }
}

async function searchReddit(query: string): Promise<CandidateItem[]> {
  try {
    const endpoint = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=hot&limit=12&t=day&raw_json=1`;
    const response = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as {
      data?: {
        children?: Array<{
          data?: {
            id?: string;
            title?: string;
            selftext?: string;
            permalink?: string;
            score?: number;
            num_comments?: number;
            created_utc?: number;
          };
        }>;
      };
    };

    return (json.data?.children || [])
      .map((item) => item.data)
      .filter((item) => item?.title)
      .map((item) => ({
        title: item?.title || "",
        content: item?.selftext || "",
        url: `https://www.reddit.com${item?.permalink || ""}`,
        source: "reddit" as const,
        sourceId: item?.id,
        publishedAt: item?.created_utc ? new Date(item.created_utc * 1000).toISOString() : undefined,
        scoreHint: Math.min(100, Math.round((item?.score || 0) * 0.5 + (item?.num_comments || 0) * 1.2)),
      }));
  } catch {
    return [];
  }
}

async function searchGithub(query: string): Promise<CandidateItem[]> {
  try {
    const endpoint = `https://api.github.com/search/repositories?q=${encodeURIComponent(`${query} in:name,description`)}&sort=stars&order=desc&per_page=12&page=1`;

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as {
      items?: Array<{
        id?: number;
        name?: string;
        description?: string;
        html_url?: string;
        stargazers_count?: number;
        forks_count?: number;
        updated_at?: string;
      }>;
    };

    return (json.items || [])
      .filter((item) => item.name && item.html_url)
      .map((item) => ({
        title: item.name || "",
        content: item.description || "",
        url: item.html_url || "",
        source: "github" as const,
        sourceId: String(item.id || ""),
        publishedAt: item.updated_at,
        scoreHint: Math.min(100, Math.round((item.stargazers_count || 0) / 20 + (item.forks_count || 0) / 8)),
      }));
  } catch {
    return [];
  }
}

async function searchGoogleNews(query: string): Promise<CandidateItem[]> {
  try {
    const endpoint = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRssItems(xml, "google", Math.ceil(MAX_WEB_RESULTS / 2));
  } catch {
    return [];
  }
}

async function searchBingNews(query: string): Promise<CandidateItem[]> {
  try {
    const endpoint = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
    const response = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRssItems(xml, "bing", Math.floor(MAX_WEB_RESULTS / 2));
  } catch {
    return [];
  }
}

async function searchTwitter(query: string): Promise<CandidateItem[]> {
  const apiKey = process.env.TWITTERAPI_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const endpoint = `https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Latest&query=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint, {
      headers: {
        "X-API-Key": apiKey,
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as {
      tweets?: Array<{
        id?: string;
        url?: string;
        text?: string;
        createdAt?: string;
        likeCount?: number;
        retweetCount?: number;
        replyCount?: number;
        quoteCount?: number;
      }>;
    };

    return (json.tweets || []).slice(0, 20).map((item) => ({
      title: (item.text || "").slice(0, 80) || "Twitter",
      content: item.text || "",
      url: item.url || "",
      source: "twitter" as const,
      sourceId: item.id,
      publishedAt: normalizeDate(item.createdAt),
      scoreHint: Math.min(
        100,
        Math.round(
          (item.likeCount || 0) * 0.4 +
            (item.retweetCount || 0) * 0.8 +
            (item.replyCount || 0) * 0.6 +
            (item.quoteCount || 0) * 0.7,
        ),
      ),
    }));
  } catch {
    return [];
  }
}

function parseRssItems(xml: string, source: "google" | "bing", limit: number): CandidateItem[] {
  const items = extractXmlBlocks(xml, "item");
  const entries = items.length > 0 ? items : extractXmlBlocks(xml, "entry");
  const results: CandidateItem[] = [];

  for (const block of entries.slice(0, limit)) {
    const title = decodeHtml(extractXmlText(block, "title"));
    const link = decodeHtml(extractXmlLink(block));
    const description = decodeHtml(
      extractXmlText(block, "description") || extractXmlText(block, "summary") || extractXmlText(block, "content"),
    );
    const publishedAt = normalizeDate(
      extractXmlText(block, "pubDate") || extractXmlText(block, "updated") || extractXmlText(block, "published"),
    );

    if (!title || !link) {
      continue;
    }

    results.push({
      title: cleanText(title),
      content: cleanText(description),
      url: cleanText(link),
      source,
      publishedAt,
      scoreHint: 55,
    });
  }

  return results;
}

function extractXmlBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml))) {
    blocks.push(match[1]);
  }

  return blocks;
}

function extractXmlText(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = regex.exec(block);
  return match ? stripCdata(match[1]).trim() : "";
}

function extractXmlLink(block: string): string {
  const hrefMatch = /<link[^>]*href=["']([^"']+)["'][^>]*>/i.exec(block);
  if (hrefMatch) {
    return hrefMatch[1];
  }
  return extractXmlText(block, "link");
}

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function cleanText(value: string): string {
  return stripTags(value).slice(0, 500).trim();
}

function normalizeDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

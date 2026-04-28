export type InputNewsItem = {
  title: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
};

export type HotTopic = {
  topic: string;
  score: number;
  reason: string;
  relatedTitles: string[];
};

export type AnalysisResult = {
  overallSummary: string;
  hotTopics: HotTopic[];
  nextWatch: string[];
  model: string;
  generatedAt: string;
};

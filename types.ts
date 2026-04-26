
export const NewsCategory = {
  ALL: '全部',
  POLITICS: '时政',
  FINANCE: '财经',
  AI: '人工智能',
  ENTERTAINMENT: '娱乐',
  HOTLIST: '今日热榜',
  CUSTOM: '定制'
} as const;

export type NewsCategory = typeof NewsCategory[keyof typeof NewsCategory];

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source: string;
  url: string;
  timestamp: string;
  imageUrl: string;
  tags: string[];
  syncDate: string; // 用于识别哪天抓取的，格式 YYYY-MM-DD
}

export interface SearchSource {
  id: string;
  name: string;
  keyword: string;
  enabled: boolean;
}

export interface UpdateSchedule {
  enabled: boolean;
  times: string[]; // 格式: "HH:mm"
  lastExecutedDate: string; // 格式: "YYYY-MM-DD HH:mm"
}

export interface AppState {
  articles: NewsArticle[];
  loading: boolean;
  selectedCategory: NewsCategory;
  lastUpdated: string | null;
  sources: SearchSource[];
  schedule: UpdateSchedule;
}

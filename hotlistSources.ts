export type HotlistSourceId =
  | 'weibo'
  | 'baidu'
  | 'wallstreetcn-hot'
  | 'thepaper'
  | 'cls-hot'
  | 'bilibili-hot-search';

export type CategoryLabel = '时政' | '财经' | '人工智能' | '娱乐';

export type HotlistSourceConfig = {
  id: HotlistSourceId;
  name: string;
  category: CategoryLabel;
};

const HOTLIST_SOURCES: HotlistSourceConfig[] = [
  { id: 'weibo', name: '微博热搜', category: '娱乐' },
  { id: 'baidu', name: '百度热搜', category: '时政' },
  { id: 'wallstreetcn-hot', name: '华尔街见闻', category: '财经' },
  { id: 'thepaper', name: '澎湃新闻', category: '时政' },
  { id: 'cls-hot', name: '财联社热门', category: '财经' },
  { id: 'bilibili-hot-search', name: 'Bilibili 热搜', category: '娱乐' }
];

export const getHotlistSourcesForCategoryLabel = (category: CategoryLabel): HotlistSourceConfig[] => (
  HOTLIST_SOURCES.filter((source) => source.category === category)
);

export const getAllHotlistSources = (): HotlistSourceConfig[] => HOTLIST_SOURCES;

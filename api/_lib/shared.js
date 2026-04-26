export const BLOB_PATH = 'feeds/latest.json';

export const NewsCategory = {
  POLITICS: '时政',
  FINANCE: '财经',
  AI: '人工智能',
  ENTERTAINMENT: '娱乐'
};

export const RSS_SOURCES = {
  [NewsCategory.POLITICS]: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.skynews.com/feeds/rss/world.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
  ],
  [NewsCategory.FINANCE]: [
    'https://finance.yahoo.com/news/rssindex',
    'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    'https://www.marketwatch.com/rss/topstories',
    'https://www.investing.com/rss/news.rss',
    'https://www.ft.com/rss/home'
  ],
  [NewsCategory.AI]: [
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'http://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    'http://a.jiemian.com/index.php?m=article&a=rss',
    'https://www.huxiu.com/rss/0.xml',
    'https://www.bestblogs.dev/zh/feeds/rss',
    'https://www.36kr.com/feed',
    'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en'
  ],
  [NewsCategory.ENTERTAINMENT]: [
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://www.huxiu.com/rss/0.xml',
    'https://www.etonline.com/news/rss',
    'https://news.google.com/rss/search?q=entertainment&hl=en-US&gl=US&ceid=US:en'
  ]
};

export const HOTLIST_SOURCES = [
  { id: 'weibo', name: '微博热搜', category: NewsCategory.ENTERTAINMENT },
  { id: 'baidu', name: '百度热搜', category: NewsCategory.POLITICS },
  { id: 'wallstreetcn-hot', name: '华尔街见闻', category: NewsCategory.FINANCE },
  { id: 'thepaper', name: '澎湃新闻', category: NewsCategory.POLITICS },
  { id: 'cls-hot', name: '财联社热门', category: NewsCategory.FINANCE },
  { id: 'bilibili-hot-search', name: 'Bilibili 热搜', category: NewsCategory.ENTERTAINMENT }
];

export const SYNC_CATEGORIES = [
  NewsCategory.POLITICS,
  NewsCategory.FINANCE,
  NewsCategory.AI,
  NewsCategory.ENTERTAINMENT
];

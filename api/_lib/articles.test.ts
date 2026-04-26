import test from 'node:test';
import assert from 'node:assert/strict';
import { filterRecentArticles, filterRemovedSources } from './articles.js';

test('filterRecentArticles removes stale articles on the server path', () => {
  const now = new Date('2026-04-26T12:00:00.000Z');
  const articles = [
    {
      id: 'fresh',
      title: 'fresh',
      summary: '',
      category: '时政',
      source: 'BBC',
      url: 'https://example.com/fresh',
      timestamp: '2026-04-25T12:00:00.000Z',
      imageUrl: '',
      tags: [],
      syncDate: '2026-04-26'
    },
    {
      id: 'stale',
      title: 'stale',
      summary: '',
      category: '时政',
      source: 'BBC',
      url: 'https://example.com/stale',
      timestamp: '2026-04-20T12:00:00.000Z',
      imageUrl: '',
      tags: [],
      syncDate: '2026-04-20'
    }
  ];

  const result = filterRecentArticles(articles, now);

  assert.deepEqual(result.map((item) => item.id), ['fresh']);
});

test('filterRemovedSources removes legacy chinanews items on the server path', () => {
  const articles = [
    {
      id: 'keep',
      title: 'keep',
      summary: '',
      category: '娱乐',
      source: 'Variety',
      url: 'https://example.com/keep',
      timestamp: '2026-04-26T12:00:00.000Z',
      imageUrl: '',
      tags: [],
      syncDate: '2026-04-26'
    },
    {
      id: 'drop',
      title: 'drop',
      summary: '',
      category: '娱乐',
      source: 'Chinanews',
      url: 'https://www.chinanews.com.cn/legacy',
      timestamp: '2026-04-26T12:00:00.000Z',
      imageUrl: '',
      tags: [],
      syncDate: '2026-04-26'
    }
  ];

  const result = filterRemovedSources(articles);

  assert.deepEqual(result.map((item) => item.id), ['keep']);
});

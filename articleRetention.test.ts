import test from 'node:test';
import assert from 'node:assert/strict';

import { filterRecentArticles } from './articleRetention.ts';

type TestArticle = {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  url: string;
  timestamp: string;
  imageUrl: string;
  tags: string[];
  syncDate: string;
};

const makeArticle = (id: string, timestamp: string): TestArticle => ({
  id,
  title: id,
  summary: id,
  category: '人工智能',
  source: 'test',
  url: `https://example.com/${id}`,
  timestamp,
  imageUrl: '',
  tags: [],
  syncDate: '2026-04-26'
});

test('removes articles older than the retention window', () => {
  const now = new Date('2026-04-26T12:00:00Z');
  const result = filterRecentArticles([
    makeArticle('fresh', '2026-04-25T12:00:00Z'),
    makeArticle('stale', '2026-01-10T12:00:00Z')
  ], now, 3);

  assert.deepEqual(result.map((item) => item.id), ['fresh']);
});

test('removes invalid timestamps', () => {
  const now = new Date('2026-04-26T12:00:00Z');
  const result = filterRecentArticles([
    makeArticle('valid', '2026-04-26T09:00:00Z'),
    makeArticle('invalid', 'not-a-date')
  ], now, 3);

  assert.deepEqual(result.map((item) => item.id), ['valid']);
});

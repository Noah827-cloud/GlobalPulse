import test from 'node:test';
import assert from 'node:assert/strict';

import { filterRemovedSources } from './sourceCleanup.ts';

test('removes legacy chinanews articles from cache candidates', () => {
  const articles = [
    { source: 'CHINANEWS.COM.CN', url: 'https://www.chinanews.com.cn/a', id: '1' },
    { source: 'BBC', url: 'https://www.bbc.com/b', id: '2' }
  ] as never[];

  const result = filterRemovedSources(articles);
  assert.deepEqual(result.map((item: any) => item.id), ['2']);
});

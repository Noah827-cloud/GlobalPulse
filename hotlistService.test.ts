import test from 'node:test';
import assert from 'node:assert/strict';

import { getHotlistSourcesForCategoryLabel } from './hotlistSources.ts';

test('maps politics category to domestic politics hotlists', () => {
  const ids = getHotlistSourcesForCategoryLabel('时政').map((item) => item.id);
  assert.deepEqual(ids, ['baidu', 'thepaper']);
});

test('maps finance category to domestic finance hotlists', () => {
  const ids = getHotlistSourcesForCategoryLabel('财经').map((item) => item.id);
  assert.deepEqual(ids, ['wallstreetcn-hot', 'cls-hot']);
});

test('maps entertainment category to domestic entertainment hotlists', () => {
  const ids = getHotlistSourcesForCategoryLabel('娱乐').map((item) => item.id);
  assert.deepEqual(ids, ['weibo', 'bilibili-hot-search']);
});

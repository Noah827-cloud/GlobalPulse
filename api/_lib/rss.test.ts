import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRSSXML } from './rss.js';

test('parseRSSXML keeps recent items, strips markup, and extracts image and link', () => {
  const recentDate = new Date().toUTCString();
  const staleDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <item>
        <title><![CDATA[Recent headline]]></title>
        <description><![CDATA[<p>Recent <strong>summary</strong></p><img src="https://cdn.example.com/image.jpg" />]]></description>
        <link>https://example.com/recent</link>
        <pubDate>${recentDate}</pubDate>
      </item>
      <item>
        <title>Old headline</title>
        <description>Old summary</description>
        <link>https://example.com/old</link>
        <pubDate>${staleDate}</pubDate>
      </item>
    </channel>
  </rss>`;

  const articles = parseRSSXML(xml, '财经', 'EXAMPLE');

  assert.equal(articles.length, 1);
  assert.equal(articles[0]?.title, 'Recent headline');
  assert.equal(articles[0]?.summary, 'Recent summary');
  assert.equal(articles[0]?.url, 'https://example.com/recent');
  assert.equal(articles[0]?.imageUrl, 'https://cdn.example.com/image.jpg');
  assert.equal(articles[0]?.source, 'EXAMPLE');
});

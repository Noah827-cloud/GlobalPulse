import test from 'node:test';
import assert from 'node:assert/strict';

import { extractImageUrlFromItemXml } from './rssImageExtraction.ts';

test('extracts image from media content tag', () => {
  const itemXml = `
    <item>
      <media:content url="https://example.com/media.jpg" medium="image" />
    </item>
  `;
  assert.equal(extractImageUrlFromItemXml(itemXml), 'https://example.com/media.jpg');
});

test('extracts image from enclosure tag', () => {
  const itemXml = `
    <item>
      <enclosure url="https://example.com/enclosure.jpg" type="image/jpeg" />
    </item>
  `;
  assert.equal(extractImageUrlFromItemXml(itemXml), 'https://example.com/enclosure.jpg');
});

test('extracts image from content encoded html', () => {
  const itemXml = `
    <item>
      <content:encoded><![CDATA[
        <p>hello</p><img src="https://example.com/content.jpg" />
      ]]></content:encoded>
    </item>
  `;
  assert.equal(extractImageUrlFromItemXml(itemXml), 'https://example.com/content.jpg');
});

test('extracts image from description html', () => {
  const itemXml = `
    <item>
      <description><![CDATA[
        <img src="https://example.com/description.jpg" />
      ]]></description>
    </item>
  `;
  assert.equal(extractImageUrlFromItemXml(itemXml), 'https://example.com/description.jpg');
});

test('returns empty string when no image can be found', () => {
  const itemXml = `<item><title>No image</title></item>`;
  assert.equal(extractImageUrlFromItemXml(itemXml), '');
});

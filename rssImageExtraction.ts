const matchFirst = (input: string, pattern: RegExp): string => {
  const match = input.match(pattern);
  return match?.[1]?.trim() ?? '';
};

export const extractImageUrlFromItemXml = (itemXml: string): string => {
  const patterns = [
    /<enclosure\b[^>]*type=["'][^"']*image[^"']*["'][^>]*url=["']([^"']+)["'][^>]*>/i,
    /<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["'][^"']*image[^"']*["'][^>]*>/i,
    /<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i,
    /<media:content\b[^>]*url=["']([^"']+)["'][^>]*>/i,
    /<itunes:image\b[^>]*href=["']([^"']+)["'][^>]*>/i,
    /<content:encoded\b[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<description\b[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const url = matchFirst(itemXml, pattern);
    if (url) {
      return url;
    }
  }

  return '';
};

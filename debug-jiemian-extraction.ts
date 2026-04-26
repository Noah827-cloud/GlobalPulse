

// import { fetch } from 'undici'; // Native fetch in Node 18+


async function testJiemian() {
    const url = 'http://a.jiemian.com/index.php?m=article&a=rss';
    console.log(`Fetching ${url} via AllOrigins...`);

    // Simulate App behavior
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    try {
        let xmlText = "";
        const res = await fetch(proxyUrl);
        if (!res.ok) {
            console.error(`AllOrigins Proxy Failed: ${res.status}. Trying fallback...`);
            const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const res2 = await fetch(proxyUrl2);
            if (!res2.ok) {
                console.error("CorsProxy Failed too:", res2.status);
                return;
            }
            xmlText = await res2.text();
            console.log("Fallback Proxy Succeeded!");
        } else {
            xmlText = await res.text();
        }
        console.log(`Fetched XML: ${xmlText.slice(0, 200)}...`); // Show start

        // Manual Simple Parser (since no DOMParser in Node, we regex the Description tag content)
        // Find first item's description
        const itemRegex = /<item>([\s\S]*?)<\/item>/;
        const match = xmlText.match(itemRegex);

        if (!match) {
            console.error("No <item> found in XML!");
            return;
        }

        const itemContent = match[1];
        console.log("First Item Content Sample:", itemContent.slice(0, 200));

        // Find description
        const descMatch = itemContent.match(/<description>(.*?)<\/description>/s);

        let description = "";
        if (descMatch) {
            description = descMatch[1];
        } else {
            // Try CDATA direct match if regex failed (Node regex is simple)
            const cdataMatch = itemContent.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
            if (cdataMatch) description = cdataMatch[1];
        }

        console.log("Extracted Description:", description.slice(0, 150));

        // Apply GEMINI SERVICE REGEX
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);

        if (imgMatch) {
            const imageUrl = imgMatch[1];
            console.log("SUCCESS: Extracted Image URL:", imageUrl);

            // Now test WSRV.NL Proxy
            const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=800&output=webp`;
            console.log("Testing WSRV Proxy URL:", wsrvUrl);

            const imgRes = await fetch(wsrvUrl);
            console.log(`WSRV Status: ${imgRes.status}`);
            if (imgRes.ok) {
                console.log("WSRV Proxy Working!");
            } else {
                console.error("WSRV Proxy Failed!");
            }

        } else {
            console.error("FAILURE: No Image extracted from Description!");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testJiemian();

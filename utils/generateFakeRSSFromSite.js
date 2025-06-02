const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function getFetch() {
  const fetchModule = await import("node-fetch");
  return fetchModule.default;
}

async function generateFakeRSSFromSite(site, cacheFilePath) {
  const fetch = await getFetch();

  try {
    // Check cache file for last fetched links if caching enabled
    let cachedLinks = new Set();
    if (cacheFilePath && fs.existsSync(cacheFilePath)) {
      const cachedData = fs.readFileSync(cacheFilePath, "utf-8");
      cachedLinks = new Set(JSON.parse(cachedData));
    }

    const res = await fetch(site.url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = [];

    // Use site.linkSelector or default to all <a>
    const selector = site.linkSelector || "a";

    $(selector).each((_, el) => {
      let link = $(el).attr("href");
      let title = $(el).text().trim();

      // Fix relative URLs if needed
      if (link && !link.startsWith("http")) {
        try {
          link = new URL(link, site.url).href;
        } catch {
          // invalid URL, skip
          return;
        }
      }

      if (
        link &&
        title.length > 10 &&
        /^https?:\/\//.test(link) &&
        !items.find((item) => item.link === link) &&
        !cachedLinks.has(link) // skip cached links
      ) {
        items.push({
          title,
          link,
          pubDate: new Date().toUTCString(),
        });
      }

      if (items.length >= 5) return false; // stop after 5
    });

    // Save new links to cache file to avoid refetching next time
    if (cacheFilePath) {
      const updatedLinks = new Set([...cachedLinks, ...items.map((i) => i.link)]);
      fs.writeFileSync(cacheFilePath, JSON.stringify([...updatedLinks], null, 2));
    }

    return { items };
  } catch (err) {
    console.error(`Failed to fetch fake RSS for ${site.name}:`, err.message);
    return { items: [] };
  }
}

module.exports = generateFakeRSSFromSite;

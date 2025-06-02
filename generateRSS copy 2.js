const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const parser = new Parser();
const sites = require("./sites");
const fetch = require("node-fetch");
const generateFakeRSSFromSite = require("./utils/generateFakeRSSFromSite");

const fetchFullArticle = require("./utils/fullTextExtractor");
const classifyArticle = require("./utils/ClassifyArticle"); // if you have one

const seenKeywordsPath = path.resolve(__dirname, "seenKeywords.json");
let seenKeywords = {};

if (fs.existsSync(seenKeywordsPath)) {
  seenKeywords = JSON.parse(fs.readFileSync(seenKeywordsPath, "utf8"));
}

(async () => {
  const mergedItems = [];

  for (const site of sites) {
    try {
      const cacheDir = path.resolve(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const cacheFilePath = path.resolve(cacheDir, `${site.name.replace(/\s+/g, "_")}-links.json`);

      // 🔁 Get RSS or simulate it
      const feed = site.rss
        ? await parser.parseURL(site.rss)
        : await generateFakeRSSFromSite(site, cacheFilePath);

      const items = feed.items.slice(0, 5);

      for (const item of items) {
        let keyword = null;
        if (site.keywordRegex) {
          const match = item.title.match(site.keywordRegex);
          if (match && match[1]) keyword = match[1].toLowerCase();
        }

        const now = Date.now();
        const isDuplicate =
          keyword && seenKeywords[keyword] && now - seenKeywords[keyword] < 7 * 24 * 60 * 60 * 1000;

        const articleText = await fetchFullArticle(item.link, site);

        const classifications = classifyArticle
          ? classifyArticle(articleText || item.title || "")
          : [];

        mergedItems.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: site.name,
          keyword,
          duplicate: !!isDuplicate,
          classifications,
          content: articleText,
          image: site.defaultImage || null,
        });

        if (keyword && !isDuplicate) {
          seenKeywords[keyword] = now;
        }
      }
    } catch (e) {
      console.error(`Failed to process site ${site.name}:`, e.message);
    }
  }

  fs.writeFileSync(seenKeywordsPath, JSON.stringify(seenKeywords, null, 2), "utf8");

  mergedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const outputPath = path.resolve(__dirname, "mergedFeed.json");
  fs.writeFileSync(outputPath, JSON.stringify(mergedItems, null, 2), "utf8");

  console.log(`Merged feed written with ${mergedItems.length} items.`);
})();

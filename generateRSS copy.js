const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");
const parser = new Parser();
const fetch = require("node-fetch");
const classifyArticle = require("./utils/ClassifyArticle");

const sites = require("./sites.js");
const seenKeywordsPath = path.resolve(__dirname, "seenKeywords.json");

// Load seen keywords with timestamps (for duplicate checking within 7 days)
let seenKeywords = {};
if (fs.existsSync(seenKeywordsPath)) {
  seenKeywords = JSON.parse(fs.readFileSync(seenKeywordsPath, "utf8"));
}

// Utility: clean seenKeywords to keep only last 7 days
function cleanOldKeywords() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const [keyword, timestamp] of Object.entries(seenKeywords)) {
    if (timestamp < cutoff) {
      delete seenKeywords[keyword];
    }
  }
}

// Helper to fetch full article text (simplified)
async function fetchFullArticle(url, site) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    let articleContent = "";
    let match = null;

    if (site.contentSelector) {
      if (site.contentSelector.startsWith("REGEX:")) {
        const regexString = site.contentSelector.replace("REGEX:", "");
        const customRegex = new RegExp(regexString, "i");
        match = html.match(customRegex);
        if (match && match[1]) {
          articleContent = match[1].replace(/<[^>]+>/g, " ").trim();
        }
      } else {
        // Use a basic tag selector (e.g., "article", "div.post-content")
        const tag = site.contentSelector;
        const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag.split(" ")[0]}>`, "i");
        match = html.match(tagRegex);
        if (match && match[1]) {
          articleContent = match[1].replace(/<[^>]+>/g, " ").trim();
        }
      }
    }

    if (articleContent) return articleContent;

    // fallback: strip tags from body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) return bodyMatch[1].replace(/<[^>]+>/g, " ").trim();
  } catch (e) {
    console.warn("Failed to fetch full article:", e.message);
  }

  return "";
}

// Main async function
(async () => {
  cleanOldKeywords();

  let mergedItems = [];

  for (const site of sites) {
    try {
      const feed = await parser.parseURL(site.rss);

      // Limit to 5 items per feed
      const items = feed.items.slice(0, 5);

      for (const item of items) {
        // Extract keyword from title using site-specific regex
        let keyword = null;
        if (site.keywordRegex) {
          const regex = new RegExp(site.keywordRegex, "i");
          const match = item.title.match(regex);
          if (match && match[1]) keyword = match[1].toLowerCase();
        }

        // Check duplicates only within last 7 days
        const now = Date.now();
        const isDuplicate =
          keyword && seenKeywords[keyword] && now - seenKeywords[keyword] < 7 * 24 * 60 * 60 * 1000;

        // Fetch full article text
        const articleText = await fetchFullArticle(item.link, site);

        // Get classifications from article text or title
        const classifications = classifyArticle(articleText || item.title || "");

        // Prepare merged item
        const mergedItem = {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: site.name,
          keyword,
          duplicate: !!isDuplicate,
          classifications,
          content: articleText,
          image: site.image || null,
        };

        mergedItems.push(mergedItem);

        // Update seenKeywords if new keyword and not duplicate
        if (keyword && !isDuplicate) {
          seenKeywords[keyword] = now;
        }
      }
    } catch (e) {
      console.error(`Failed to process site ${site.name}:`, e.message);
    }
  }

  // Save updated seenKeywords
  fs.writeFileSync(seenKeywordsPath, JSON.stringify(seenKeywords, null, 2), "utf8");

  // Sort merged items by pubDate descending
  mergedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Write merged feed to JSON file for app consumption
  const outputPath = path.resolve(__dirname, "mergedFeed.json");
  fs.writeFileSync(outputPath, JSON.stringify(mergedItems, null, 2), "utf8");

  console.log(`Merged feed written with ${mergedItems.length} items.`);
})();

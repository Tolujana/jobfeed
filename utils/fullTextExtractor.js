// fullTextExtractor.js
const fetch = require("./fetchWrapper.mjs").default;

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
        // Basic HTML tag selector fallback
        const tag = site.contentSelector;
        const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag.split(" ")[0]}>`, "i");
        match = html.match(tagRegex);
        if (match && match[1]) {
          articleContent = match[1].replace(/<[^>]+>/g, " ").trim();
        }
      }
    }

    if (articleContent) return articleContent;

    // Fallback: remove tags from <body>
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1].replace(/<[^>]+>/g, " ").trim();
    }
  } catch (e) {
    console.warn("Failed to fetch full article:", e.message);
  }

  return "";
}

module.exports = fetchFullArticle;

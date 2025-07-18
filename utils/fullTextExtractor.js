const fetch = require("./fetchWrapper.mjs").default;
const cheerio = require("cheerio");

async function fetchFullArticle(url, site) {
  try {
    const res = await fetch(url);
    const html = await res.text();

    let articleContent = "";

    if (site.contentSelector) {
      if (site.contentSelector.startsWith("REGEX:")) {
        // Use RegEx manually
        const regexString = site.contentSelector.replace("REGEX:", "");
        const customRegex = new RegExp(regexString, "i");
        const match = html.match(customRegex);
        if (match && match[1]) {
          articleContent = match[1].replace(/<[^>]+>/g, " ").trim();
          return articleContent;
        }
      } else {
        // Use cheerio for class or tag selector
        const $ = cheerio.load(html);
        const selected = $(site.contentSelector);

        if (selected.length > 0) {
          articleContent = selected
            .map((_, el) => $(el).text())
            .get()
            .join(" ")
            .trim();
          return articleContent;
        }
      }
    }

    // Fallback to <body> content stripped of HTML tags
    const $ = cheerio.load(html);
    const bodyText = $("body").text().trim();
    return bodyText;
  } catch (e) {
    console.warn("Failed to fetch full article:", e.message);
    return "";
  }
}

module.exports = fetchFullArticle;

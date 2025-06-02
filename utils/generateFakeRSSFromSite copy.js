const fetch = require("./fetchWrapper.mjs").default;

const cheerio = require("cheerio");
async function generateFakeRSSFromSite(site) {
  try {
    const res = await fetch(site.url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = [];

    $(site.linkSelector || "a").each((_, el) => {
      const link = $(el).attr("href");
      const title = $(el).text().trim();

      if (
        link &&
        title.length > 10 &&
        /^https?:\/\//.test(link) &&
        !items.find((item) => item.link === link)
      ) {
        items.push({
          title,
          link,
          pubDate: new Date().toUTCString(), // or extract from page later
        });
      }

      if (items.length >= 5) return false; // break loop
    });

    return { items };
  } catch (err) {
    console.error(`Failed to fetch fake RSS for ${site.name}:`, err.message);
    return { items: [] };
  }
}

module.exports = generateFakeRSSFromSite;

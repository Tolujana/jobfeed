const specializations = {
  "Software Engineering": [
    "javascript",
    "python",
    "react",
    "api",
    "node.js",
    "coding",
    "developer",
  ],
  Finance: ["investment", "equity", "capital", "stock", "trading", "finance", "banking"],
  Marketing: ["seo", "branding", "campaign", "social media", "ads", "marketing", "promotion"],
  // add more specializations and keywords as needed
};

module.exports = function classifyArticle(text) {
  const textLower = text.toLowerCase();
  const scores = {};

  for (const [specialization, keywords] of Object.entries(specializations)) {
    let count = 0;
    for (const keyword of keywords) {
      // Count occurrences of each keyword in text
      const matches = textLower.match(new RegExp(`\\b${keyword}\\b`, "g"));
      if (matches) count += matches.length;
    }
    if (count > 0) scores[specialization] = count;
  }

  // Return specializations sorted by count descending
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([spec]) => spec);
};

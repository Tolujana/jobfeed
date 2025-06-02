module.exports = [
  {
    name: "JobGurus",
    url: "https://www.jobgurus.com.ng/jobs",
    defaultImage: "https://www.jobgurus.com.ng/assets/img/logo.png",
    imageSelector: ".article-image img",
    keywordRegex: /(?<=\bat\s)(.*)/,
    linkSelector: "div.panel-body h2 a",
    contentSelector: "#content_area .main-content-section > div:nth-child(2)", // OR: "REGEX:<div class=\"job-desc\">([\\s\\S]*?)</div>"
  },
  {
    name: "Example Site333",
    url: "https://example.com",
    defaultImage: "https://example.com/default.jpg",
    imageSelector: ".article-image img",
    keywordRegex: /([A-Z][a-z]+ Inc)/,
    linkSelector: ".job-listing a",
    contentSelector: "article", // OR: "REGEX:<div class=\"job-desc\">([\\s\\S]*?)</div>"

    fakeFeed: [
      { title: "BigTech Inc launches new product", link: "https://example.com/1" },
      { title: "OldNews Inc does something", link: "https://example.com/2" },
    ],
  },
];

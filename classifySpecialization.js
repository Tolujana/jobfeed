const { Configuration, OpenAIApi } = require("openai");
const specializations = require("./specializations");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function classifyArticle(articleText, title = "") {
  const prompt = `
Given this article:

Title: "\${title}"
Content: "\${articleText}"

From the following job specializations:
\${specializations.map((s, i) => \`\${i + 1}. \${s}\`).join("\n")}

Return a JSON array of all specializations (by name) that best apply to this article.
Use only names from the list. Be as specific and accurate as possible.
`;

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a job article classifier AI." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
  });

  try {
    const raw = response.data.choices[0].message.content;
    const result = JSON.parse(raw);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error("Failed to parse classification result:", e);
    return [];
  }
}

module.exports = classifyArticle;
import Groq from "groq-sdk";
import { getApiKey } from "./config.js";

export async function generateCommitMessage(stat, diff) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No API key found. Run tako to set up.");
  }

  const client = new Groq({ apiKey });

  const maxLength = 8000;
  const truncatedDiff =
    diff.length > maxLength
      ? diff.substring(0, maxLength) + "\n... (diff truncated)"
      : diff;

  const prompt = `You are a Git commit message writer.
Based on the following git diff, write a single concise commit message.

Rules:
- One line only, max 72 characters
- Start with a verb (Add, Fix, Update, Remove, Refactor, etc.)
- Be specific about what changed
- No period at the end
- No quotes around the message
- No markdown, no explanation, just the message

Git stat:
${stat}

Git diff:
${truncatedDiff}

Reply with ONLY the commit message, nothing else.`;

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 100,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  return text.replace(/^["'`]|["'`]$/g, "");
}

export async function generatePRDescription(branchName, commits) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No API key found. Run tako to set up.");

  const client = new Groq({ apiKey });

  const commitList = commits.length
    ? commits.map((c) => `- ${c}`).join("\n")
    : "- (no commits found)";

  const prompt = `You are a developer writing a pull request description.
Branch: ${branchName}
Commits:
${commitList}

Write a concise PR description:
- First line: one-sentence summary of what this branch does
- Then 2-4 bullet points of what changed
- Max 120 words total
- No markdown headers, no "This PR", no fluff
- Plain text only

Reply with ONLY the description.`;

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

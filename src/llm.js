import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKey } from './config.js';

export async function generateCommitMessage(stat, diff) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key found. Run tako to set up.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Truncate diff if too large
  const maxLength = 8000;
  const truncatedDiff = diff.length > maxLength
    ? diff.substring(0, maxLength) + '\n... (diff truncated)'
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

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental quotes or backticks
  return text.replace(/^["'`]|["'`]$/g, '');
}
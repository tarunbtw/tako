import inquirer from "inquirer";
import chalk from "chalk";
import { hasApiKey, setApiKey, getConfigPath } from "./config.js";

export async function ensureApiKey() {
  if (hasApiKey()) return;

  console.log("");
  console.log(chalk.yellow.bold("  First time setup"));
  console.log("");
  console.log("  tako uses the Groq API to generate commit messages.");
  console.log(chalk.gray("  Get a free key at: https://console.groq.com"));
  console.log("");
  console.log(chalk.gray("  Your key is stored at:"));
  console.log(chalk.gray(`  ${getConfigPath()}`));
  console.log("");

  const { apiKey } = await inquirer.prompt([
    {
      type: "password",
      name: "apiKey",
      message: "Paste your Groq API key:",
      mask: "*",
      validate: (input) => {
        if (!input || input.trim().length < 10)
          return "Please enter a valid key";
        return true;
      },
    },
  ]);

  setApiKey(apiKey.trim());

  console.log("");
  console.log(chalk.green("  ✓ Key saved."));
  console.log("");
}

#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import { generateCommitMessage } from "./llm.js";
import { ensureApiKey } from "./setup.js";
import { getConfigPath, hasApiKey, getApiKey, setApiKey } from "./config.js";
import {
  isGitRepo,
  getRemoteUrl,
  hasGitignore,
  gitInit,
  gitAdd,
  gitCommit,
  gitBranch,
  gitRemoteAdd,
  gitPush,
  getStagedDiff,
  hasUncommittedChanges,
  hasRemote,
  getCurrentBranch,
  gitPullRebase,
} from "./git.js";
import { createDefaultGitignore } from "./gitignore.js";

const VERSION = "1.0.0";

const program = new Command();

program
  .name("tako")
  .description("Smart Git workflow CLI with LLM-powered commit messages")
  .version(VERSION);

program.action(() => {
  console.log("");
  console.log(chalk.cyan.bold("  🐙 tako") + chalk.gray(` v${VERSION}`));
  console.log(
    chalk.gray("  Smart Git workflow with LLM-powered commit messages"),
  );
  console.log("");
  console.log(chalk.white.bold("  Commands:"));
  console.log("");
  console.log(`  ${chalk.cyan("tako i")}   Initialize a new Git repo and push`);
  console.log(`  ${chalk.cyan("tako p")}   Push with auto commit messge`);
  console.log("");
});

program
  .command("i")
  .description("Initialize a new Git repo and push")
  .action(async () => {
    await ensureApiKey();
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako init"));
    console.log("");

    const alreadyRepo = await isGitRepo();
    const existingRemoteUrl = await getRemoteUrl();

    if (alreadyRepo && existingRemoteUrl) {
      console.log(chalk.yellow("  ⚠ Already a git repo with remote set:"));
      console.log(chalk.gray(`    ${existingRemoteUrl}`));
      console.log("");
      console.log(chalk.gray("  Use tako p to push your changes."));
      console.log("");
      return;
    }

    const gitignoreExists = await hasGitignore();
    if (!gitignoreExists) {
      console.log(chalk.yellow("  ⚠ No .gitignore found!"));
      console.log("");
      const { create } = await inquirer.prompt([
        {
          type: "confirm",
          name: "create",
          message: "Create a default .gitignore?",
          default: true,
        },
      ]);

      if (create) {
        createDefaultGitignore();
        console.log(chalk.green("  ✓ .gitignore created."));
      } else {
        console.log(
          chalk.yellow("  ⚠ Skipping — be careful not to commit secrets!"),
        );
      }
      console.log("");
    } else {
      console.log(chalk.green("  ✓ .gitignore found."));
      console.log("");
    }

    if (alreadyRepo) {
      console.log(chalk.green("  ✓ Git repo already exists, skipping init."));
      console.log("");
    } else {
      const spinner = ora("Running git init...").start();
      try {
        await gitInit();
        spinner.succeed("Git repo initialised.");
      } catch (err) {
        spinner.fail("git init failed.");
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    {
      const spinner = ora("Staging all files...").start();
      try {
        await gitAdd(".");
        spinner.succeed("All files staged.");
      } catch (err) {
        spinner.fail("git add failed.");
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    {
      const spinner = ora("Creating initial commit...").start();
      try {
        await gitCommit("init: project initialised using tako");
        spinner.succeed("Initial commit created.");
      } catch (err) {
        spinner.fail("git commit failed.");
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    {
      const spinner = ora("Setting branch to main...").start();
      try {
        await gitBranch("main");
        spinner.succeed("Branch set to main.");
      } catch (err) {
        spinner.fail("Could not rename branch.");
        console.log(chalk.red(`  ${err.message}`));
      }
      console.log("");
    }

    const { remoteInput } = await inquirer.prompt([
      {
        type: "input",
        name: "remoteInput",
        message: "Enter your GitHub remote URL (blank to skip):",
        validate: (input) => {
          if (!input.trim()) return true;
          const valid =
            input.trim().startsWith("https://github.com") ||
            input.trim().startsWith("git@github.com");
          return valid || "Please enter a valid GitHub URL";
        },
      },
    ]);

    if (!remoteInput.trim()) {
      console.log("");
      console.log(chalk.yellow("  ⚠ No remote set. Skipping push."));
      console.log(
        chalk.gray("  You can add one later: git remote add origin <url>"),
      );
      console.log("");
      console.log(chalk.green.bold("  ✓ Repo initialised locally!"));
      console.log("");
      return;
    }

    {
      const spinner = ora("Adding remote origin...").start();
      try {
        await gitRemoteAdd(remoteInput.trim());
        spinner.succeed(`Remote added: ${chalk.gray(remoteInput.trim())}`);
      } catch (err) {
        spinner.fail("Failed to add remote.");
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    {
      const spinner = ora("Pushing to GitHub...").start();
      try {
        await gitPush("main");
        spinner.succeed("Pushed to GitHub! 🚀");
      } catch (err) {
        spinner.fail("Push failed.");
        console.log(chalk.red(`  ${err.stderr || err.message}`));
        console.log("");
        console.log(
          chalk.gray("  Tip: make sure the remote repo exists on GitHub."),
        );
        process.exit(1);
      }
      console.log("");
    }

    console.log("");
    console.log(chalk.green.bold("  ✓ All done!"));
    console.log("");
  });

program
  .command("config")
  .description("View or update your stored API key")
  .action(async () => {
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako config"));
    console.log("");
    console.log(chalk.gray("  Your key is stored at:"));
    console.log(chalk.gray(`  ${getConfigPath()}`));
    console.log("");

    if (hasApiKey()) {
      const key = getApiKey();
      const masked = key.substring(0, 6) + "••••••••••••" + key.slice(-4);
      console.log(chalk.green(`  ✓ API key is set: ${chalk.gray(masked)}`));
    } else {
      console.log(chalk.yellow("  ⚠ No API key set."));
    }

    console.log("");

    const { update } = await inquirer.prompt([
      {
        type: "confirm",
        name: "update",
        message: "Want to update the key?",
        default: false,
      },
    ]);

    if (!update) {
      console.log("");
      return;
    }

    const { newKey } = await inquirer.prompt([
      {
        type: "password",
        name: "newKey",
        message: "Paste your new Groq API key:",
        mask: "*",
        validate: (input) => {
          if (!input || input.trim().length < 10)
            return "Please enter a valid key";
          return true;
        },
      },
    ]);

    setApiKey(newKey.trim());
    console.log("");
    console.log(chalk.green("  ✓ API key updated!"));
    console.log("");
  });

program
  .command("p")
  .description("Add, commit with LLM message, and push")
  .action(async () => {
    await ensureApiKey();
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako push"));
    console.log("");

    //checks
    if (!(await isGitRepo())) {
      console.log(chalk.red("  ✗ Not a git repo. Run tako i first."));
      console.log("");
      process.exit(1);
    }

    if (!(await hasRemote())) {
      console.log(chalk.red("  ✗ No remote set. Run tako i first."));
      console.log("");
      process.exit(1);
    }

    if (!(await hasGitignore())) {
      console.log(chalk.yellow("  ⚠ No .gitignore found!"));
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Continue anyway?",
          default: false,
        },
      ]);
      if (!proceed) {
        console.log("");
        console.log(chalk.gray("  Aborted."));
        console.log("");
        process.exit(0);
      }
      console.log("");
    }

    if (!(await hasUncommittedChanges())) {
      console.log(
        chalk.yellow("  ⚠ Nothing to commit — working tree is clean."),
      );
      console.log("");
      process.exit(0);
    }

    //git add .
    {
      const spinner = ora("Staging all changes...").start();
      try {
        await gitAdd(".");
        spinner.succeed("All changes staged.");
      } catch (err) {
        spinner.fail("git add failed.");
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    //generate commit message
    let commitMsg;
    {
      const spinner = ora("Generating commit message...").start();
      try {
        const { stat, diff } = await getStagedDiff();
        commitMsg = await generateCommitMessage(stat, diff);
        spinner.succeed(`Message: ${chalk.cyan('"' + commitMsg + '"')}`);
      } catch (err) {
        spinner.fail("LLM generation failed.");
        console.log(chalk.red(`  ${err.message}`));
        console.log("");
        const { fallback } = await inquirer.prompt([
          {
            type: "input",
            name: "fallback",
            message: "Enter commit message manually:",
            validate: (input) => input.trim().length > 0 || "Cannot be empty",
          },
        ]);
        commitMsg = fallback.trim();
      }
      console.log("");
    }

    //confirm message
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Use this commit message?",
        choices: [
          { name: `Yes, use it`, value: "yes" },
          { name: `Edit it`, value: "edit" },
          { name: `Abort`, value: "abort" },
        ],
      },
    ]);

    if (action === "abort") {
      console.log("");
      console.log(
        chalk.gray(
          "  Aborted. Files are staged — commit manually if you like.",
        ),
      );
      console.log("");
      process.exit(0);
    }

    if (action === "edit") {
      const { edited } = await inquirer.prompt([
        {
          type: "input",
          name: "edited",
          message: "Edit message:",
          default: commitMsg,
          validate: (input) => input.trim().length > 0 || "Cannot be empty",
        },
      ]);
      commitMsg = edited.trim();
    }

    console.log("");

    // git commit
    {
      const spinner = ora("Committing...").start();
      try {
        await gitCommit(commitMsg);
        spinner.succeed("Committed.");
      } catch (err) {
        spinner.fail("git commit failed.");
        console.log(chalk.red(`  ${err.stderr || err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    //git push
    {
      const branch = await getCurrentBranch();
      const spinner = ora(`Pushing to origin/${branch}...`).start();
      try {
        await gitPush(branch);
        spinner.succeed(`Pushed to origin/${branch}! 🚀`);
      } catch {
        // push failed — try rebase
        spinner.text = "Out of sync, pulling with rebase...";
        try {
          await gitPullRebase();
          spinner.text = `Retrying push to origin/${branch}...`;
          await gitPush(branch);
          spinner.succeed(`Pushed to origin/${branch}! 🚀`);
        } catch (err) {
          spinner.fail("Push failed even after rebase.");
          console.log(chalk.red(`  ${err.stderr || err.message}`));
          console.log("");
          console.log(
            chalk.yellow(
              "  There may be a merge conflict that needs manual fixing.",
            ),
          );
          console.log("");
          process.exit(1);
        }
      }
      console.log("");
    }

    console.log(chalk.green.bold("  ✓ Done! Changes are live 🎉"));
    console.log("");
  });

program.parse();

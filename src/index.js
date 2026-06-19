#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import inquirer from "inquirer";
import { generateCommitMessage, generatePRDescription } from "./llm.js";
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
  getLastCommit,
  gitResetSoft,
  gitResetMixed,
  gitFetch,
  getAheadBehind,
  getLocalBranches,
  createAndSwitchBranch,
  switchBranch,
  deleteBranch,
  forceDeleteBranch,
  getBranchCommits,
} from "./git.js";
import { createDefaultGitignore } from "./gitignore.js";
import { loadTakorc } from "./takorc.js";

import { createRequire } from "module";
const { version: VERSION } = createRequire(import.meta.url)("../package.json");

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
  console.log(`  ${chalk.cyan("tako i")}       Initialize a new Git repo and push`);
  console.log(`  ${chalk.cyan("tako p")}       Push with auto commit message`);
  console.log(`  ${chalk.cyan("tako config")}  Manage your Groq API key`);
  console.log(`  ${chalk.cyan("tako undo")}    Undo the last commit safely`);
  console.log(`  ${chalk.cyan("tako sync")}    Fetch and rebase from origin`);
  console.log(`  ${chalk.cyan("tako b")}       Manage branches`);
  console.log(`  ${chalk.cyan("tako pr")}      Open a pull request`);
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
        spinner.succeed("Git repo initialized.");
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
        await gitCommit("init: project initialized using tako");
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
        message: "Enter your Git remote URL (blank to skip):",
        validate: (input) => {
          if (!input.trim()) return true;
          const valid =
            input.trim().startsWith("https://") ||
            input.trim().startsWith("git@");
          return valid || "Please enter a valid remote URL (https:// or git@...)";
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
      console.log(chalk.green.bold("  ✓ Repo initialized locally!"));
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
      const spinner = ora("Pushing to remote...").start();
      try {
        await gitPush("main");
        spinner.succeed("Pushed! 🚀");
      } catch (err) {
        spinner.fail("Push failed.");
        console.log(chalk.red(`  ${err.stderr || err.message}`));
        console.log("");
        console.log(
          chalk.gray("  Tip: make sure the remote repo exists and you have access."),
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
  .command("undo")
  .description("Undo the last commit, keeping your changes")
  .action(async () => {
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako undo"));
    console.log("");

    if (!(await isGitRepo())) {
      console.log(chalk.red("  ✗ Not a git repo."));
      console.log("");
      process.exit(1);
    }

    const last = await getLastCommit();
    if (!last) {
      console.log(chalk.yellow("  ⚠ No commits found — nothing to undo."));
      console.log("");
      process.exit(0);
    }

    console.log(chalk.white(`  Last commit: ${chalk.cyan('"' + last.message + '"')}`));
    console.log(chalk.gray(`  ${last.time}`));
    console.log("");

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What do you want to do?",
        choices: [
          {
            name: "Keep changes staged     (git reset --soft HEAD~1)",
            value: "soft",
          },
          {
            name: "Unstage changes          (git reset HEAD~1)",
            value: "mixed",
          },
          { name: "Abort", value: "abort" },
        ],
      },
    ]);

    if (action === "abort") {
      console.log("");
      console.log(chalk.gray("  Aborted. Nothing changed."));
      console.log("");
      process.exit(0);
    }

    console.log("");
    const spinner = ora("Undoing last commit...").start();
    try {
      if (action === "soft") {
        await gitResetSoft();
        spinner.succeed("Commit undone. Changes are still staged.");
      } else {
        await gitResetMixed();
        spinner.succeed("Commit undone. Changes are unstaged.");
      }
    } catch (err) {
      spinner.fail("Could not undo commit.");
      console.log(chalk.red(`  ${err.stderr || err.message}`));
      process.exit(1);
    }

    console.log("");
    console.log(chalk.green.bold("  ✓ Done!"));
    console.log("");
  });

program
  .command("sync")
  .description("Fetch from origin and rebase onto the default branch")
  .action(async () => {
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako sync"));
    console.log("");

    if (!(await isGitRepo())) {
      console.log(chalk.red("  ✗ Not a git repo."));
      console.log("");
      process.exit(1);
    }

    if (!(await hasRemote())) {
      console.log(chalk.red("  ✗ No remote set."));
      console.log("");
      process.exit(1);
    }

    const { defaultBranch } = loadTakorc();
    const currentBranch = await getCurrentBranch();

    // Fetch
    {
      const spinner = ora("Fetching latest from origin...").start();
      try {
        await gitFetch();
        spinner.succeed("Fetched latest from origin.");
      } catch (err) {
        spinner.fail("Fetch failed.");
        console.log(chalk.red(`  ${err.stderr || err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    // Rebase
    {
      const spinner = ora(`Rebasing ${currentBranch} onto origin/${defaultBranch}...`).start();
      try {
        await gitPullRebase();
        spinner.succeed(`Rebased ${chalk.cyan(currentBranch)} onto origin/${chalk.cyan(defaultBranch)}.`);
      } catch (err) {
        spinner.fail("Rebase failed — conflict detected.");
        console.log("");
        console.log(chalk.yellow("  Fix the conflict manually, then run:"));
        console.log(chalk.gray("    git rebase --continue"));
        console.log("");
        console.log(chalk.yellow("  Or to give up:"));
        console.log(chalk.gray("    git rebase --abort"));
        console.log("");
        process.exit(1);
      }
    }

    // Show ahead/behind
    const { ahead, behind } = await getAheadBehind(currentBranch);
    console.log(
      chalk.gray(
        `  ${chalk.white(ahead)} commit${ahead !== 1 ? "s" : ""} ahead · ${chalk.white(behind)} behind`,
      ),
    );
    console.log("");
    console.log(chalk.green.bold("  ✓ In sync! Ready to push with tako p."));
    console.log("");
  });

program
  .command("b")
  .description("Create, switch, delete, or list branches")
  .action(async () => {
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako branch"));
    console.log("");

    if (!(await isGitRepo())) {
      console.log(chalk.red("  ✗ Not a git repo."));
      console.log("");
      process.exit(1);
    }

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What do you want to do?",
        choices: [
          { name: "Create new branch", value: "create" },
          { name: "Switch branch", value: "switch" },
          { name: "Delete branch", value: "delete" },
          { name: "List branches", value: "list" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);

    console.log("");

    if (action === "cancel") {
      console.log(chalk.gray("  Cancelled."));
      console.log("");
      process.exit(0);
    }

    // ─── CREATE ─────────────────────────────────────────────────
    if (action === "create") {
      const { name } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Branch name:",
          validate: (input) => {
            if (!input.trim()) return "Branch name cannot be empty";
            if (/[\s~^:?*\[\\]/.test(input))
              return "Branch name contains invalid characters";
            return true;
          },
        },
      ]);

      console.log("");
      const spinner = ora(`Creating branch ${name}...`).start();
      try {
        await createAndSwitchBranch(name.trim());
        spinner.succeed(
          `Created and switched to ${chalk.cyan(name.trim())}.`,
        );
      } catch (err) {
        spinner.fail("Could not create branch.");
        console.log(chalk.red(`  ${err.stderr || err.message}`));
        process.exit(1);
      }
      console.log("");
      console.log(chalk.green.bold("  ✓ Done!"));
      console.log("");
    }

    // ─── SWITCH ─────────────────────────────────────────────────
    if (action === "switch") {
      if (await hasUncommittedChanges()) {
        console.log(
          chalk.yellow(
            "  ⚠ You have uncommitted changes. Commit or stash them before switching.",
          ),
        );
        console.log("");
        process.exit(0);
      }

      const branches = await getLocalBranches();
      const current = await getCurrentBranch();

      if (branches.length <= 1) {
        console.log(chalk.yellow("  ⚠ No other branches to switch to."));
        console.log("");
        process.exit(0);
      }

      const choices = branches
        .filter((b) => b !== current)
        .map((b) => ({ name: b, value: b }));

      const { target } = await inquirer.prompt([
        {
          type: "list",
          name: "target",
          message: "Switch to:",
          choices,
        },
      ]);

      console.log("");
      const spinner = ora(`Switching to ${target}...`).start();
      try {
        await switchBranch(target);
        spinner.succeed(`Switched to ${chalk.cyan(target)}.`);
      } catch (err) {
        spinner.fail("Could not switch branch.");
        console.log(chalk.red(`  ${err.stderr || err.message}`));
        process.exit(1);
      }
      console.log("");
    }

    // ─── DELETE ─────────────────────────────────────────────────
    if (action === "delete") {
      const branches = await getLocalBranches();
      const current = await getCurrentBranch();
      const { protectedBranches } = loadTakorc();

      const deletable = branches.filter(
        (b) => b !== current && !protectedBranches.includes(b),
      );

      if (deletable.length === 0) {
        console.log(
          chalk.yellow(
            "  ⚠ No branches available to delete (current or protected branches are excluded).",
          ),
        );
        console.log("");
        process.exit(0);
      }

      const { target } = await inquirer.prompt([
        {
          type: "list",
          name: "target",
          message: "Branch to delete:",
          choices: deletable.map((b) => ({ name: b, value: b })),
        },
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Delete ${chalk.red(target)}? This cannot be undone.`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log("");
        console.log(chalk.gray("  Cancelled."));
        console.log("");
        process.exit(0);
      }

      console.log("");
      const spinner = ora(`Deleting ${target}...`).start();
      try {
        await deleteBranch(target);
        spinner.succeed(`Branch ${chalk.cyan(target)} deleted.`);
      } catch {
        // Branch not fully merged — offer force delete
        spinner.stop();
        console.log(
          chalk.yellow(
            `  ⚠ Branch ${target} is not fully merged.`,
          ),
        );
        console.log("");

        const { force } = await inquirer.prompt([
          {
            type: "confirm",
            name: "force",
            message: "Force delete anyway?",
            default: false,
          },
        ]);

        if (!force) {
          console.log(chalk.gray("  Cancelled."));
          console.log("");
          process.exit(0);
        }

        const spinner2 = ora(`Force deleting ${target}...`).start();
        try {
          await forceDeleteBranch(target);
          spinner2.succeed(`Branch ${chalk.cyan(target)} force deleted.`);
        } catch (err2) {
          spinner2.fail("Could not delete branch.");
          console.log(chalk.red(`  ${err2.stderr || err2.message}`));
          process.exit(1);
        }
      }
      console.log("");
    }

    // ─── LIST ────────────────────────────────────────────────────
    if (action === "list") {
      const branches = await getLocalBranches();
      const current = await getCurrentBranch();

      if (branches.length === 0) {
        console.log(chalk.yellow("  ⚠ No branches found."));
        console.log("");
        process.exit(0);
      }

      console.log(chalk.white.bold("  Branches:"));
      console.log("");
      for (const b of branches) {
        if (b === current) {
          console.log(`  ${chalk.green("*")} ${chalk.cyan(b)}   ${chalk.gray("(current)")}`);
        } else {
          console.log(`    ${chalk.white(b)}`);
        }
      }
      console.log("");
    }
  });

program
  .command("pr")
  .description("Open a pull request from the current branch")
  .action(async () => {
    await ensureApiKey();
    console.log("");
    console.log(chalk.cyan.bold("  🐙 tako pr"));
    console.log("");

    if (!(await isGitRepo())) {
      console.log(chalk.red("  ✗ Not a git repo."));
      console.log("");
      process.exit(1);
    }

    if (!(await hasRemote())) {
      console.log(chalk.red("  ✗ No remote set."));
      console.log("");
      process.exit(1);
    }

    const currentBranch = await getCurrentBranch();
    const { prBase } = loadTakorc();

    if (currentBranch === prBase) {
      console.log(
        chalk.yellow(
          `  ⚠ You are already on ${chalk.white(prBase)}. Switch to a feature branch first.`,
        ),
      );
      console.log("");
      process.exit(0);
    }

    const remoteUrl = await getRemoteUrl();

    console.log(
      chalk.gray(`  Branch:  ${chalk.cyan(currentBranch)} → ${chalk.white(prBase)}`),
    );
    console.log("");

    // Generate PR description
    let title = "";
    let description = "";
    {
      const spinner = ora("Generating PR description...").start();
      try {
        const commits = await getBranchCommits(prBase);
        if (commits.length === 0) {
          spinner.warn("No commits found on this branch ahead of " + prBase + ".");
        } else {
          const raw = await generatePRDescription(currentBranch, commits);
          const lines = raw.split("\n").filter(Boolean);
          title = lines[0] || currentBranch;
          description = lines.slice(1).join("\n").trim();
          spinner.succeed("Description ready.");
        }
      } catch (err) {
        spinner.fail("Could not generate description.");
        console.log(chalk.red(`  ${err.message}`));
        title = currentBranch;
        description = "";
      }
      console.log("");
    }

    // Display
    if (title) {
      console.log(`  ${chalk.white.bold("Title:")}       ${title}`);
    }
    if (description) {
      const indent = "               ";
      const wrapped = description
        .split("\n")
        .map((line, i) => (i === 0 ? `  ${chalk.white.bold("Description:")} ${line}` : `${indent}${line}`))
        .join("\n");
      console.log(wrapped);
    }
    console.log("");

    const prUrl = buildPRUrl(remoteUrl, prBase, currentBranch);

    // Build gh CLI command
    const ghCommand = `gh pr create --base ${prBase} --head ${currentBranch} --title "${title}" --body "${description.replace(/"/g, '\\"')}"`;

    if (!prUrl) {
      console.log(
        chalk.yellow(
          "  ⚠ Remote is not GitHub or GitLab. Cannot build PR URL automatically.",
        ),
      );
      console.log("");
      console.log(chalk.gray("  Open a PR manually with these details:"));
      console.log(chalk.gray(`  Branch: ${currentBranch}`));
      console.log(chalk.gray(`  Base:   ${prBase}`));
      console.log("");
      process.exit(0);
    }

    const choices = [
      { name: "Open in browser", value: "browser" },
    ];

    // Only show gh command option if gh might be available
    choices.push({ name: "Copy GitHub CLI command", value: "gh" });
    choices.push({ name: "Abort", value: "abort" });

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What do you want to do?",
        choices,
      },
    ]);

    console.log("");

    if (action === "abort") {
      console.log(chalk.gray("  Aborted."));
      console.log("");
      process.exit(0);
    }

    if (action === "browser") {
      const spinner = ora("Opening in browser...").start();
      try {
        await openUrl(prUrl);
        spinner.succeed("Opened in browser.");
      } catch (err) {
        spinner.fail("Could not open browser.");
        console.log(chalk.gray(`  Open manually: ${prUrl}`));
      }
    }

    if (action === "gh") {
      console.log(chalk.white("  Copy and run this:"));
      console.log("");
      console.log(chalk.cyan(`  ${ghCommand}`));
    }

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

    // Protected branch check
    {
      const currentBranch = await getCurrentBranch();
      const { protectedBranches } = loadTakorc();
      if (protectedBranches.includes(currentBranch)) {
        console.log(
          chalk.yellow(`  ⚠ You are pushing directly to ${chalk.white(currentBranch)}.`)
        );
        console.log("");
        const { proceed } = await inquirer.prompt([
          {
            type: "confirm",
            name: "proceed",
            message: "Push to protected branch anyway?",
            default: false,
          },
        ]);
        if (!proceed) {
          console.log("");
          console.log(chalk.gray("  Tip: create a feature branch with tako b"));
          console.log("");
          process.exit(0);
        }
        console.log("");
      }
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

function buildPRUrl(remoteUrl, base, branch) {
  // GitHub HTTPS: https://github.com/user/repo.git
  // GitHub SSH:   git@github.com:user/repo.git
  if (remoteUrl.includes("github.com")) {
    const repoPath = remoteUrl
      .replace(/^git@github\.com:/, "")
      .replace(/^https:\/\/github\.com\//, "")
      .replace(/\.git$/, "");
    return `https://github.com/${repoPath}/compare/${base}...${branch}?expand=1`;
  }

  // GitLab HTTPS: https://gitlab.com/user/repo.git
  // GitLab SSH:   git@gitlab.com:user/repo.git
  if (remoteUrl.includes("gitlab.com")) {
    const repoPath = remoteUrl
      .replace(/^git@gitlab\.com:/, "")
      .replace(/^https:\/\/gitlab\.com\//, "")
      .replace(/\.git$/, "");
    return `https://gitlab.com/${repoPath}/-/merge_requests/new?merge_request[source_branch]=${branch}&merge_request[target_branch]=${base}`;
  }

  return null;
}

async function openUrl(url) {
  const { execa: _execa } = await import("execa");
  const platform = process.platform;
  if (platform === "darwin") {
    await _execa("open", [url]);
  } else if (platform === "win32") {
    await _execa("cmd", ["/c", "start", "", url]);
  } else {
    await _execa("xdg-open", [url]);
  }
}

program.parse();

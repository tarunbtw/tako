#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { ensureApiKey } from "./setup.js";
import { getConfigPath } from "./config.js";
import { isGitRepo, getRemoteUrl, hasGitignore } from './git.js';

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
  console.log(`  ${chalk.cyan("tako p")}   Add → LLM commit → Push`);
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
    const remoteUrl = await getRemoteUrl();

    if (alreadyRepo && remoteUrl) {
      console.log(chalk.yellow("  ⚠ Already a git repo with remote set:"));
      console.log(chalk.gray(`    ${remoteUrl}`));
      console.log("");
      console.log(chalk.gray("  Use tako p to push your changes."));
      console.log("");
      return;
    }

    const gitignoreExists = await hasGitignore();
    if (!gitignoreExists) {
      console.log(chalk.yellow("  ⚠ No .gitignore found!"));
      console.log(
        chalk.gray("  Make sure you add one before committing secrets."),
      );
      console.log("");
    } else {
      console.log(chalk.green("  ✓ .gitignore found."));
      console.log("");
    }

    console.log(chalk.gray("  (rest of init not implemented yet)"));
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
    console.log(chalk.gray("  (not implemented yet)"));
    console.log("");
  });

program.parse();

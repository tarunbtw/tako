#!/usr/bin/env node

import { Command } from "commander";
import ora from 'ora';
import chalk from "chalk";
import inquirer from "inquirer";
import { ensureApiKey } from "./setup.js";
import { getConfigPath } from "./config.js";
import { isGitRepo, getRemoteUrl, hasGitignore, gitInit, gitAdd, gitCommit, gitBranch } from './git.js';
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
      const spinner = ora('Staging all files...').start();
      try {
        await gitAdd('.');
        spinner.succeed('All files staged.');
      } catch (err) {
        spinner.fail('git add failed.');
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log('');
    }

    {
      const spinner = ora('Creating initial commit...').start();
      try {
        await gitCommit('init: project initialised using tako');
        spinner.succeed('Initial commit created.');
      } catch (err) {
        spinner.fail('git commit failed.');
        console.log(chalk.red(`  ${err.message}`));
        process.exit(1);
      }
      console.log('');
    }

    {
      const spinner = ora('Setting branch to main...').start();
      try {
        await gitBranch('main');
        spinner.succeed('Branch set to main.');
      } catch (err) {
        spinner.fail('Could not rename branch.');
        console.log(chalk.red(`  ${err.message}`));
      }
      console.log('');
    }

    console.log(chalk.gray('  (rest of init not implemented yet)'));
    console.log('');
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

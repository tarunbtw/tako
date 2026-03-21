#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('tako')
  .description('Smart Git workflow CLI with AI-powered commit messages')
  .version(VERSION);

program.action(() => {
  console.log('');
  console.log(chalk.cyan.bold('  🐙 tako') + chalk.gray(` v${VERSION}`));
  console.log(chalk.gray('  Smart Git workflow with AI commit messages'));
  console.log('');
  console.log(chalk.white.bold('  Commands:'));
  console.log('');
  console.log(`  ${chalk.cyan('tako i')}   Initialize a new Git repo and push`);
  console.log(`  ${chalk.cyan('tako p')}   Add → AI commit → Push`);
  console.log('');
});

program.parse();
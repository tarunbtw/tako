#!/usr/bin/env node

import { program } from 'commander';
import { checkFirstRun } from './config.js';
import { pushCommand } from './commands/push.js';
import { syncCommand } from './commands/sync.js';
import { undoCommand } from './commands/undo.js';
import { branchCommand } from './commands/branch.js';

await checkFirstRun();

program
  .name('tako')
  .description('AI-powered Git companion')
  .version('1.0.0');

program
  .command('push')
  .description('AI commit message + push')
  .action(pushCommand);

program
  .command('sync')
  .description('Pull, rebase, push')
  .action(syncCommand);

program
  .command('undo')
  .description('Undo last git action')
  .action(undoCommand);

program
  .command('branch')
  .description('AI-named branch from description')
  .action(branchCommand);

program.parse();

if (!process.argv.slice(2).length) {
  const { openTUI } = await import('./ui/tui.js');
  await openTUI();
}
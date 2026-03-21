import inquirer from 'inquirer';
import chalk from 'chalk';
import { hasApiKey, setApiKey, getConfigPath } from './config.js';

export async function ensureApiKey() {
  if (hasApiKey()) return;

  console.log('');
  console.log(chalk.yellow.bold('  First time setup'));
  console.log('');
  console.log('  tako uses the Gemini API to generate commit messages.');
  console.log(chalk.gray('  Get a free key at: https://aistudio.google.com/apikey'));
  console.log('');
  console.log(chalk.gray('  Your key is stored at:'));
  console.log(chalk.gray(`  ${getConfigPath()}`));
  console.log(chalk.gray('  It will never be written into any of your projects.'));
  console.log('');

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Paste your Gemini API key:',
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length < 10) return 'Please enter a valid key';
        return true;
      },
    },
  ]);

  setApiKey(apiKey.trim());

  console.log('');
  console.log(chalk.green('  ✓ Key saved. You won\'t be asked again.'));
  console.log('');
}
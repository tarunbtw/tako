import { execa } from 'execa';
import fs from 'fs';
import path from 'path';

export async function isGitRepo() {
  try {
    await execa('git', ['rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

export async function hasRemote() {
  try {
    const { stdout } = await execa('git', ['remote']);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getRemoteUrl() {
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin']);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getCurrentBranch() {
  try {
    const { stdout } = await execa('git', ['branch', '--show-current']);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function hasGitignore() {
  return fs.existsSync(path.join(process.cwd(), '.gitignore'));
}

export async function hasUncommittedChanges() {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain']);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function gitInit() {
  await execa('git', ['init']);
}

export async function gitAdd(target = '.') {
  await execa('git', ['add', target]);
}

export async function gitCommit(message) {
  await execa('git', ['commit', '-m', message]);
}

export async function gitBranch(name) {
  await execa('git', ['branch', '-M', name]);
}

export async function gitRemoteAdd(url) {
  await execa('git', ['remote', 'add', 'origin', url]);
}

export async function gitPush(branch = 'main') {
  await execa('git', ['push', '-u', 'origin', branch]);
}

export async function getStagedDiff() {
  try {
    const { stdout: stat } = await execa('git', ['diff', '--cached', '--stat']);
    const { stdout: diff } = await execa('git', ['diff', '--cached', '--unified=3']);
    return { stat: stat.trim(), diff: diff.trim() };
  } catch {
    return { stat: '', diff: '' };
  }
}

export async function hasUncommittedChanges() {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain']);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}
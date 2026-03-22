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
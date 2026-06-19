import { execa } from "execa";
import fs from "fs";
import path from "path";

export async function isGitRepo() {
  try {
    await execa("git", ["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

export async function hasRemote() {
  try {
    const { stdout } = await execa("git", ["remote"]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getRemoteUrl() {
  try {
    const { stdout } = await execa("git", ["remote", "get-url", "origin"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getCurrentBranch() {
  try {
    const { stdout } = await execa("git", ["branch", "--show-current"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function hasGitignore() {
  return fs.existsSync(path.join(process.cwd(), ".gitignore"));
}

export async function hasUncommittedChanges() {
  try {
    const { stdout } = await execa("git", ["status", "--porcelain"]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function gitInit() {
  await execa("git", ["init"]);
}

export async function gitAdd(target = ".") {
  await execa("git", ["add", target]);
}

export async function gitCommit(message) {
  await execa("git", ["commit", "-m", message]);
}

export async function gitBranch(name) {
  await execa("git", ["branch", "-M", name]);
}

export async function gitRemoteAdd(url) {
  await execa("git", ["remote", "add", "origin", url]);
}

export async function gitPush(branch = "main") {
  await execa("git", ["push", "-u", "origin", branch]);
}

export async function getStagedDiff() {
  try {
    const { stdout: stat } = await execa("git", ["diff", "--cached", "--stat"]);
    const { stdout: diff } = await execa("git", [
      "diff",
      "--cached",
      "--unified=3",
    ]);
    return { stat: stat.trim(), diff: diff.trim() };
  } catch {
    return { stat: "", diff: "" };
  }
}

export async function gitPullRebase() {
  const { stdout } = await execa("git", ["branch", "--show-current"]);
  const branch = stdout.trim();
  await execa("git", ["pull", "--rebase", "origin", branch]);
}

export async function getLastCommit() {
  try {
    const { stdout } = await execa("git", ["log", "-1", "--format=%s|%cr"]);
    const parts = stdout.trim().split("|");
    return { message: parts[0], time: parts[1] };
  } catch {
    return null;
  }
}

export async function gitResetSoft() {
  await execa("git", ["reset", "--soft", "HEAD~1"]);
}

export async function gitResetMixed() {
  await execa("git", ["reset", "HEAD~1"]);
}

export async function gitFetch() {
  await execa("git", ["fetch", "origin"]);
}

export async function getAheadBehind(branch) {
  try {
    const { stdout } = await execa("git", [
      "rev-list",
      "--left-right",
      "--count",
      `origin/${branch}...${branch}`,
    ]);
    const [behind, ahead] = stdout.trim().split("\t").map(Number);
    return { ahead: ahead || 0, behind: behind || 0 };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

export async function getLocalBranches() {
  try {
    const { stdout } = await execa("git", [
      "branch",
      "--format=%(refname:short)",
    ]);
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function createAndSwitchBranch(name) {
  await execa("git", ["checkout", "-b", name]);
}

export async function switchBranch(name) {
  await execa("git", ["checkout", name]);
}

export async function deleteBranch(name) {
  await execa("git", ["branch", "-d", name]);
}

export async function forceDeleteBranch(name) {
  await execa("git", ["branch", "-D", name]);
}

export async function getBranchCommits(base = "main") {
  try {
    const { stdout } = await execa("git", [
      "log",
      `${base}..HEAD`,
      "--format=%s",
    ]);
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

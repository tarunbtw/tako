import fs from "fs";
import path from "path";

const DEFAULTS = {
  defaultBranch: "main",
  protectedBranches: ["main", "master", "production", "prod"],
  commitStyle: "default",
  prBase: "main",
};

/**
 * Reads .takorc from process.cwd().
 * Returns merged defaults + user config.
 * Never throws — if file is missing or invalid, returns defaults.
 */
export function loadTakorc() {
  const rcPath = path.join(process.cwd(), ".takorc");
  if (!fs.existsSync(rcPath)) return { ...DEFAULTS };
  try {
    const raw = fs.readFileSync(rcPath, "utf8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Writes config object to .takorc in process.cwd().
 */
export function saveTakorc(config) {
  const rcPath = path.join(process.cwd(), ".takorc");
  fs.writeFileSync(rcPath, JSON.stringify(config, null, 2));
}

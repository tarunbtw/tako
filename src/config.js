import Conf from "conf";

const config = new Conf({
  projectName: "tako",
  schema: {
    groqApiKey: {
      type: "string",
      default: "",
    },
  },
});

// One-time migration: if old geminiApiKey exists, move it over
const legacy = config.store["geminiApiKey"];
if (legacy && !config.get("groqApiKey")) {
  config.set("groqApiKey", legacy);
  delete config.store["geminiApiKey"];
}

export function getApiKey() {
  return config.get("groqApiKey");
}

export function setApiKey(key) {
  config.set("groqApiKey", key);
}

export function hasApiKey() {
  const key = config.get("groqApiKey");
  return typeof key === "string" && key.trim().length > 0;
}

export function getConfigPath() {
  return config.path;
}

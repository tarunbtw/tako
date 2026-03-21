import Conf from 'conf';

const config = new Conf({
  projectName: 'tako',
  schema: {
    geminiApiKey: {
      type: 'string',
      default: '',
    },
  },
});

export function getApiKey() {
  return config.get('geminiApiKey');
}

export function setApiKey(key) {
  config.set('geminiApiKey', key);
}

export function hasApiKey() {
  const key = config.get('geminiApiKey');
  return typeof key === 'string' && key.trim().length > 0;
}

export function getConfigPath() {
  return config.path;
}
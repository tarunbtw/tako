import fs from 'fs';
import path from 'path';

const DEFAULT_GITIGNORE = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
out/

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
`;

export function createDefaultGitignore() {
  fs.writeFileSync(path.join(process.cwd(), '.gitignore'), DEFAULT_GITIGNORE);
}
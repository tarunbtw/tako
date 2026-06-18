# 🐙 tako

[![npm](https://img.shields.io/npm/v/@tarunbtw/tako)](https://www.npmjs.com/package/@tarunbtw/tako)
[![license](https://img.shields.io/npm/l/@tarunbtw/tako)](LICENSE)

Stop writing commit messages. tako stages, commits, and pushes — the message is written by AI in under a second.

## Install

```bash
npm install -g @tarunbtw/tako
```

## Setup

Grab a free Groq API key at [console.groq.com](https://console.groq.com).  
tako will ask for it on first run and store it locally.

## Commands

| Command | What it does |
|---|---|
| `tako i` | Initialize a new git repo and push to remote |
| `tako p` | Stage, commit with AI message, and push |
| `tako config` | View or update your stored Groq API key |

## What it looks like

```
$ tako p

  🐙 tako push

  ✔ All changes staged.
  ✔ Message: "Add JWT refresh token rotation with sliding expiry"

  ? Use this commit message? › Yes, use it
  ✔ Committed.
  ✔ Pushed to origin/main! 🚀

  ✓ Done! Changes are live 🎉
```

## How it works

tako sends your `git diff` to **Llama 3.1 8B** via [Groq](https://console.groq.com) — one of the fastest inference APIs available. Commit messages generate in under a second.

## License

MIT

# Fragments API Server

This repository contains the backend microservice for the **Fragments** project. Built using Node.js and Express, it includes setup for linting, formatting, structured logging, and development tooling to support ongoing development throughout the semester.

---

## 📦 Requirements

Before running the project, ensure the following tools are installed and configured:

- [Node.js (LTS)](https://nodejs.org/)
- [Git CLI](https://git-scm.com/)
- [VSCode](https://code.visualstudio.com/) with:
  - ESLint
  - Prettier - Code Formatter
  - Code Spell Checker
- [curl](https://curl.se/) (use `curl.exe` on PowerShell)
- [jq](https://jqlang.github.io/jq/) (optional, for JSON output formatting)

If using Windows, install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) and use a Unix shell (e.g., Ubuntu) for compatibility.

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone git@github.com:<your-username>/fragments.git
cd fragments
```

### 2. Install Dependencies

```bash
npm install
```

---

## 📂 Scripts

| Script          | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `npm start`     | Starts the server normally on port 8080                                  |
| `npm run dev`   | Starts the server with `nodemon`, restarts on changes                    |
| `npm run debug` | Starts the server with debugger enabled (on port 9229) and debug logging |
| `npm run lint`  | Runs ESLint on all `src/**/*.js` files                                   |

> ⚠️ On Windows, use [cross-env](https://www.npmjs.com/package/cross-env) if setting environment variables fails.

---

## 📂 Project Structure

```
fragments/
├── src/
│   ├── app.js         # Express app setup
│   ├── server.js      # Server bootstrap with stoppable
│   └── logger.js      # Pino logger configuration
├── .vscode/
│   ├── settings.json  # Prettier + formatting settings
│   └── launch.json    # VSCode debugger config
├── .prettierrc        # Prettier rules
├── .prettierignore    # Files to ignore for formatting
├── eslint.config.mjs  # ESLint configuration
├── package.json
├── package-lock.json
└── README.md          # Project documentation (this file)
```

---

## 🧪 Testing the API

After starting the server (`npm start`, `npm run dev`, or `npm run debug`), test with:

### Browser

Go to: [http://localhost:8080](http://localhost:8080)

You should see:

```json
{
  "status": "ok",
  "author": "Your Name",
  "githubUrl": "https://github.com/<your-username>/fragments",
  "version": "0.0.1"
}
```

### Terminal with `curl`

```bash
curl -s http://localhost:8080 | jq
```

### Inspect Headers

```bash
curl -i http://localhost:8080
```

---

## 🧹 Linting and Formatting

Run the linter:

```bash
npm run lint
```

Prettier will auto-format files on save (via VSCode). Configured settings are in `.prettierrc` and `.vscode/settings.json`.

---

## 🐞 Debugging with VSCode

To debug with breakpoints:

1. Start with `npm run debug` or select `Debug via npm run debug` from the VSCode Run panel.
2. Set breakpoints in `src/app.js` or other source files.
3. Access the server via browser or `curl` to trigger breakpoints.

---

## 🔐 Environment Debug Logging

When `LOG_LEVEL=debug`, all environment variables will be printed (modify your code to add `console.log(process.env)` only if `LOG_LEVEL === 'debug'`). Do **not** print environment variables in production or non-debug mode.

---

## ✅ Completion Checklist

- [x] GitHub repo created and initialized
- [x] Server works and shows JSON response
- [x] `npm` scripts work (`start`, `dev`, `debug`, `lint`)
- [x] Logging works using Pino
- [x] Prettier and ESLint configured and working
- [x] Debugging in VSCode works
- [x] README.md fully documents how to use the repo

---

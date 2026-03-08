#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CLI_DIST = getEntry();

function getEntry() {
  const some = [
    // normal entry
    path.join(__dirname, "dist", "cli.js"),
    // fallthrough (E.g. dev env)
    path.join(__dirname, "src", "index.ts"),
  ];

  for (const file of some) {
    if (fs.existsSync(file)) {
      return file;
    }
  }

  throw new Error("Cannot find any entry file");
}

const args = [
  "--no-warnings",
  "--import",
  "tsx",
  CLI_DIST,
  ...process.argv.slice(2),
];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 0));

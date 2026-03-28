#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const CWD = process.cwd();

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.slice(1));

const HELP = `
figma-links — Figma frame deep-link exporter for Claude Code & Cursor

Usage:
  npx figma-links init            Copy both .claude/ and .cursor/ tool files
  npx figma-links init --claude   Copy only .claude/ tool files
  npx figma-links init --cursor   Copy only .cursor/ tool files

Options:
  --force   Overwrite existing files
  --help    Show this help message
`;

if (!command || command === '--help' || command === '-h') {
  console.log(HELP);
  process.exit(0);
}

if (command !== 'init') {
  console.error(`Unknown command: ${command}`);
  console.log(HELP);
  process.exit(1);
}

const doClaude = !flags.has('--cursor') || flags.has('--claude');
const doCursor = !flags.has('--claude') || flags.has('--cursor');
const force = flags.has('--force');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      if (!force && fs.existsSync(destPath)) {
        console.log(`  skip  ${path.relative(CWD, destPath)}  (already exists, use --force to overwrite)`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  copy  ${path.relative(CWD, destPath)}`);
      }
    }
  }
}

console.log('\nfigma-links init\n');

if (doClaude) {
  console.log('Claude Code:');
  copyDir(path.join(TEMPLATES_DIR, 'claude'), path.join(CWD, '.claude'));
}

if (doCursor) {
  console.log('Cursor:');
  copyDir(path.join(TEMPLATES_DIR, 'cursor'), path.join(CWD, '.cursor'));
}

console.log(`
Done! Next steps:

1. Set your Figma PAT:
   Claude Code → add to ~/.claude/settings.json:
     { "env": { "FIGMA_TOKEN": "figd_..." } }

   Cursor → add to .env in your project root:
     FIGMA_TOKEN=figd_...

2. Run in Claude Code:
     /figma-links https://www.figma.com/design/{fileKey}/...

   Run in Cursor:
     /figma-links https://www.figma.com/design/{fileKey}/...

Output will be saved to figma_exports/figma-links-{fileKey}.md
`);

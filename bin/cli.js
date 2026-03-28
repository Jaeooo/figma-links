#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { select, password } = require('@inquirer/prompts');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const CWD = process.cwd();
const CLAUDE_SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');

const args = process.argv.slice(2);
const command = args[0];
const flags = new Set(args.slice(1));

const HELP = `
figma-links — Figma frame deep-link exporter for Claude Code & Cursor

Usage:
  npx figma-links init            Interactive setup
  npx figma-links init --claude   Claude Code only (skip prompt)
  npx figma-links init --cursor   Cursor only (skip prompt)

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
        console.log(`  skip   ${path.relative(CWD, destPath)}  (already exists — use --force to overwrite)`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  copy   ${path.relative(CWD, destPath)}`);
      }
    }
  }
}

function getClaudeToken() {
  try {
    const settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf8'));
    return settings?.env?.FIGMA_TOKEN || null;
  } catch {
    return null;
  }
}

function saveClaudeToken(token) {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf8'));
  } catch {
    // file doesn't exist or invalid JSON — start fresh
  }
  if (!settings.env) settings.env = {};
  settings.env.FIGMA_TOKEN = token;
  fs.mkdirSync(path.dirname(CLAUDE_SETTINGS), { recursive: true });
  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  console.log(`  saved  FIGMA_TOKEN → ${CLAUDE_SETTINGS}`);
}

async function setupClaudeToken() {
  const existing = getClaudeToken();
  if (existing) {
    console.log(`  ✓  FIGMA_TOKEN already set in ${CLAUDE_SETTINGS}`);
    return;
  }

  console.log(`\n  FIGMA_TOKEN not found in ${CLAUDE_SETTINGS}`);
  console.log('  Get your token at: https://www.figma.com/settings (Personal access tokens → file_content:read)\n');

  const token = await password({
    message: 'Enter your Figma Personal Access Token (input hidden):',
    validate: (v) => v.trim().startsWith('figd_') ? true : 'Token should start with "figd_"',
  });

  saveClaudeToken(token.trim());
}

function printDone(doClaude, doCursor) {
  const steps = [];
  if (doCursor) steps.push('  Cursor → add to .env in your project root:\n    FIGMA_TOKEN=figd_...');

  let msg = '\nDone!';
  if (steps.length) {
    msg += `\n\nRemaining setup:\n\n${steps.join('\n\n')}`;
  }
  msg += '\n\nRun in your IDE:\n  /figma-links https://www.figma.com/design/{fileKey}/...\n\nOutput → figma_exports/figma-links-{fileKey}.md\n';
  console.log(msg);
}

async function install(doClaude, doCursor) {
  if (doClaude) {
    console.log('\nClaude Code:');
    copyDir(path.join(TEMPLATES_DIR, 'claude'), path.join(CWD, '.claude'));
    await setupClaudeToken();
  }
  if (doCursor) {
    console.log('\nCursor:');
    copyDir(path.join(TEMPLATES_DIR, 'cursor'), path.join(CWD, '.cursor'));
  }
  printDone(doClaude, doCursor);
}

// Flag shortcuts — skip prompt
if (flags.has('--claude') && !flags.has('--cursor')) {
  install(true, false).catch(() => process.exit(1));
  return;
}
if (flags.has('--cursor') && !flags.has('--claude')) {
  install(false, true).catch(() => process.exit(1));
  return;
}

// Interactive prompt
console.log('\nfigma-links — init\n');

select({
  message: 'Which environment would you like to set up?',
  choices: [
    { name: 'Both (Claude Code + Cursor)', value: 'both'   },
    { name: 'Claude Code only',            value: 'claude' },
    { name: 'Cursor only',                 value: 'cursor' },
  ],
}).then((answer) => {
  console.log('');
  return install(answer !== 'cursor', answer !== 'claude');
}).catch(() => {
  process.exit(1);
});

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const CWD = process.cwd();

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
        console.log(`  skip  ${path.relative(CWD, destPath)}  (already exists, use --force to overwrite)`);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  copy  ${path.relative(CWD, destPath)}`);
      }
    }
  }
}

function printDone(doClaude, doCursor) {
  const tokenSteps = [];
  if (doClaude) tokenSteps.push('   Claude Code → add to ~/.claude/settings.json:\n     { "env": { "FIGMA_TOKEN": "figd_..." } }');
  if (doCursor)  tokenSteps.push('   Cursor → add to .env in your project root:\n     FIGMA_TOKEN=figd_...');

  console.log(`
Done! Next steps:

1. Set your Figma PAT:
${tokenSteps.join('\n\n')}

2. Run in your IDE:
     /figma-links https://www.figma.com/design/{fileKey}/...

Output will be saved to figma_exports/figma-links-{fileKey}.md
`);
}

function install(doClaude, doCursor) {
  if (doClaude) {
    console.log('\nClaude Code:');
    copyDir(path.join(TEMPLATES_DIR, 'claude'), path.join(CWD, '.claude'));
  }
  if (doCursor) {
    console.log('\nCursor:');
    copyDir(path.join(TEMPLATES_DIR, 'cursor'), path.join(CWD, '.cursor'));
  }
  printDone(doClaude, doCursor);
}

// 플래그로 바로 지정된 경우 프롬프트 없이 실행
if (flags.has('--claude') && !flags.has('--cursor')) {
  install(true, false);
  process.exit(0);
}
if (flags.has('--cursor') && !flags.has('--claude')) {
  install(false, true);
  process.exit(0);
}

// 대화형 프롬프트
const choices = [
  { label: 'Both (Claude Code + Cursor)', claude: true,  cursor: true  },
  { label: 'Claude Code only',            claude: true,  cursor: false },
  { label: 'Cursor only',                 claude: false, cursor: true  },
];

console.log('\nfigma-links init\n');
console.log('? 어떤 환경에 설치할까요?\n');
choices.forEach((c, i) => console.log(`  ${i + 1}) ${c.label}`));
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('선택 (1-3, 기본값 1): ', (answer) => {
  rl.close();
  const idx = parseInt(answer.trim(), 10);
  const choice = choices[(isNaN(idx) || idx < 1 || idx > 3) ? 0 : idx - 1];
  console.log(`\n> ${choice.label}\n`);
  install(choice.claude, choice.cursor);
});

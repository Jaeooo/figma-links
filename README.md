# figma-links

Generate Figma frame deep-links as Markdown — `/figma-links` slash command for **Claude Code** and **Cursor**.

```bash
npx figma-links init
```

---

## What it does

Spins up a local server, opens a browser UI where you pick pages and frames from your Figma file, then saves a Markdown file with deep-links to each selected frame.

```markdown
# Figma — Link to selection

File: **My Design File**

- Home — https://www.figma.com/design/ABC123?node-id=1-2
- Dashboard — https://www.figma.com/design/ABC123?node-id=3-4
```

Output is saved to `figma_exports/figma-links-{fileKey}.md` in your project root.

---

## Quick start

**1. Install into your project**

```bash
npx figma-links init
```

You'll be prompted to choose your IDE:

```
? Which environment would you like to set up?

  1) Both (Claude Code + Cursor)
  2) Claude Code only
  3) Cursor only
```

Or skip the prompt with a flag:

```bash
npx figma-links init --claude
npx figma-links init --cursor
npx figma-links init --force   # overwrite existing files
```

**2. Get a Figma Personal Access Token**

1. Go to [Figma → Settings → Personal access tokens](https://www.figma.com/settings)
2. Click **Add new token**
3. Enable the **`file_content:read`** scope
4. Copy the generated `figd_...` token (you won't be able to see it again)

**3. Set `FIGMA_TOKEN`**

Claude Code — add to `~/.claude/settings.json`:

```json
{
  "env": {
    "FIGMA_TOKEN": "figd_..."
  }
}
```

Cursor — add to `.env` in your project root:

```bash
FIGMA_TOKEN=figd_...
```

> Add `.env` to `.gitignore` to keep your token out of version control.

**4. Run**

In Claude Code or Cursor:

```
/figma-links https://www.figma.com/design/{fileKey}/...
```

Your AI agent will automatically start the local server, open the browser UI, and wait for you to save. Once saved, the server shuts down automatically.

---

## How it works

| Step | Who | What |
|------|-----|-------|
| Start server | Agent | Launches `serve_figma_explorer.py` on `localhost:8080` |
| Open UI | Agent | Opens browser with Figma URL + token pre-filled |
| Pick frames | You | Select page tab → check/uncheck frames → click Save |
| Save & exit | UI | POSTs Markdown to local server, server shuts down |

---

## Requirements

- **Python 3.8+** — used for the local server (stdlib only, no pip install needed)
- **Figma account** — with access to the target file

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No internet connection" | Port 8080 still occupied by a previous server | Agent handles this automatically; manually: `lsof -ti :8080 \| xargs kill -9` |
| API 403 error | Missing token scope or file not shared | Verify `file_content:read` scope on your PAT and file access |
| Empty frame list | No top-level FRAME nodes on this page | Switch to a different page tab |
| Port conflict | Port 8080 in use by another app | Run server manually: `python3 .claude/tools/serve_figma_explorer.py 9000` |

---

## File structure

After `npx figma-links init`, the following files are added to your project:

```
.claude/
  commands/figma-links.md          # /figma-links slash command (Claude Code)
  tools/figma-explorer.html        # browser UI
  tools/serve_figma_explorer.py    # local server

.cursor/
  skills/figma-links/SKILL.md      # /figma-links skill (Cursor)
  tools/figma-explorer.html
  tools/serve_figma_explorer.py
```

Output files are saved to:

```
figma_exports/
  figma-links-{fileKey}.md
```

---

## License

MIT

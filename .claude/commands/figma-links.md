---
name: figma-links
description: Runs the local Figma Links HTML app, opens it in the browser, and exports selected frame links to Markdown under figma_exports/; the dev server stops automatically after a successful save. Use when the user invokes /figma-links, mentions Figma Links, or wants Figma frame deep links in Markdown.
---

# Figma Links (Local UI → Markdown)

Serves **`.claude/tools/figma-explorer.html`** via **`.claude/tools/serve_figma_explorer.py`**, opens it in the browser, lets you pick top-level frames, and saves a Markdown file to **`figma_exports/`** in the project root.

**This document is self-contained — follow it top to bottom.**

## Usage

```
/figma-links {Figma file URL}
```

Example:
```
/figma-links https://www.figma.com/design/ABC123/MyFile?node-id=0-1
```

`$ARGUMENTS` is the Figma file URL. If empty, ask the user for it.

## Trigger

Activate this skill when the user runs **`/figma-links {URL}`** or asks for Figma frame deep-links in Markdown.

## Prerequisites

- Files present: **`.claude/tools/figma-explorer.html`**, **`.claude/tools/serve_figma_explorer.py`**
- `FIGMA_TOKEN` env var must be set (via `env.FIGMA_TOKEN` in `~/.claude/settings.json`).
- PAT must have the **`file_content:read`** scope.
- The Figma file must be accessible by the token (own file or shared).

## Workflow

### 1) Resolve PAT and file URL

- **URL**: from `$ARGUMENTS`. Ask the user if missing.
- **Token**: from `$FIGMA_TOKEN`. Ask the user if missing.

### 2) Start the local server

Always clear port 8080 before starting to avoid conflicts:

```bash
lsof -ti :8080 | xargs kill -9 2>/dev/null; sleep 0.5
python3 .claude/tools/serve_figma_explorer.py &
sleep 1
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/figma-explorer.html
```

A `200` response means the server is ready. If it fails, retry on a different port:
```bash
python3 .claude/tools/serve_figma_explorer.py 9000 &
```

Default address: `http://localhost:8080/figma-explorer.html`

> Opening the HTML via `file://` blocks the Figma API due to CORS — always use HTTP.

### 3) Open the app in the browser

URL-encode the Figma file URL and token, then open:

```
http://localhost:8080/figma-explorer.html?url={url-encoded-figma-url}&token={FIGMA_TOKEN}
```

Use the `open` command to launch in the default browser.

### 4) Load file → select page → select frames

1. The app auto-loads when `url` and `token` are present in the query string.
2. Click a **page tab** in the header.
3. Check/uncheck frames in the grid (all selected by default; thumbnail click also toggles).
4. Click **"선택 확인 · Markdown 저장"** → saves to **`figma_exports/figma-links-{fileKey}.md`** via `POST /api/save-markdown`.

### 5) After saving

- The UI calls `POST /api/shutdown` and the server exits automatically.
- A confirmation alert shows the saved file path.

### 6) Use the output

Move or rename the saved file (e.g. to `docs/`) as needed.

## Output Markdown format

```markdown
# Figma — Link to selection

File: **{file name}**

- {frame name} — https://www.figma.com/design/{fileKey}?node-id={id-with-colon-replaced-by-hyphen}
```

## Agent checklist

- [ ] Killed any existing process on port 8080 before starting the server.
- [ ] Confirmed the server returns HTTP 200 via `curl`.
- [ ] Browser opened `localhost` URL (not `file://`).
- [ ] `$FIGMA_TOKEN` is set — never print the token value in chat.
- [ ] Markdown saved to `figma_exports/`.
- [ ] Server shut down after save.

## Troubleshooting

- **403**: Check PAT scope (`file_content:read`) and file sharing permissions.
- **Empty frame list**: No top-level `FRAME` nodes on this page — try a different page tab.
- **Port conflict**: Run `python3 .claude/tools/serve_figma_explorer.py 9000` and update the URL accordingly.

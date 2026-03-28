---
name: figma-explorer
description: Runs the local Figma Explorer HTML app, opens it in the browser, and exports selected frame links to Markdown under figma_exports/; the dev server stops automatically after a successful save. Use when the user invokes /figma-explorer, mentions Figma Explorer, or wants Figma frame deep links in Markdown.
---

# Figma Explorer (로컬 UI → Markdown)

프로젝트의 **`.claude/tools/figma-explorer.html`** 을 **`.claude/tools/serve_figma_explorer.py` 로컬 서버**로 띄우고, IDE **Simple Browser** 또는 **Browser MCP**로 연 뒤 최상위 프레임을 고르고 **선택 확인 · Markdown 저장**을 누르면 프로젝트 루트의 **`figma_exports/`** 아래에 Markdown이 저장된다(브라우저만으로는 디스크에 직접 쓸 수 없어 저장 API가 필요하다).

**이 문서만으로 절차가 완결된다.**

## 사용법

```
/figma-explorer {Figma 파일 URL}
```

예:
```
/figma-explorer https://www.figma.com/design/ABC123/MyFile?node-id=0-1
```

`$ARGUMENTS`가 곧 Figma 파일 URL이다. 비어 있으면 사용자에게 URL을 요청한다.

## 트리거

- 사용자가 **`/figma-explorer {URL}`** 를 치거나, Figma 파일 URL과 함께 이 워크플로를 요청할 때 이 스킬을 따른다.

## 사전 조건

- 경로: **`.claude/tools/figma-explorer.html`**, **`.claude/tools/serve_figma_explorer.py`**
- `FIGMA_TOKEN` 환경변수가 설정되어 있어야 한다(`~/.claude/settings.json`의 `env.FIGMA_TOKEN`).
- PAT에는 **`file_content:read`** 등 파일 읽기 스코프가 있어야 한다.
- Figma 파일이 해당 계정에 공유되어 있어야 한다(API 403 방지).

## 워크플로

### 1) PAT와 파일 URL 확보

- **URL**: `$ARGUMENTS`에서 가져온다. 없으면 사용자에게 요청한다.
- **PAT(token)**: `$FIGMA_TOKEN` 환경변수에서 읽는다. 없으면 사용자에게 요청한다.

### 2) 로컬 서버 실행

프로젝트 루트 기준:

```bash
python3 .claude/tools/serve_figma_explorer.py &
```

기본 주소: `http://localhost:8080/figma-explorer.html`
(다른 포트: `python3 .claude/tools/serve_figma_explorer.py 9000`)

`file://` 로 HTML을 열면 CORS로 Figma API가 막히므로 **반드시 HTTP로 연다.**

### 3) 브라우저에서 앱 열기

`$ARGUMENTS`(Figma 파일 URL)와 `$FIGMA_TOKEN`을 URL 인코딩해 쿼리로 붙여 연다.

최종 URL 형식:
```
http://localhost:8080/figma-explorer.html?url={url-encoded-figma-url}&token={FIGMA_TOKEN}
```

- **Simple Browser**: Command Palette → "Simple Browser: Show" → 위 URL 입력.
- 또는 **Browser MCP**: `browser_navigate`로 같은 URL을 연다.
- 또는 `open` 명령으로 기본 브라우저에서 연다.

### 4) 파일 불러오기 → 페이지 선택 → 프레임 선택

1. URL 쿼리로 token·url이 전달되면 열자마자 자동 **불러오기**가 실행된다.
2. 왼쪽에서 **페이지** 클릭.
3. **최상위 프레임** 그리드에서 체크박스로 포함할 프레임만 남긴다(기본은 전체 선택).
4. **선택 확인 · Markdown 저장** 클릭 → **`figma_exports/figma-links-{fileKey}.md`** 로 저장(`POST /api/save-markdown`).

### 5) 저장이 끝난 뒤(서버·브라우저)

- **로컬 서버**: 저장에 성공하면 페이지가 `POST /api/shutdown`을 호출해 **`serve_figma_explorer.py` 프로세스가 자동 종료**된다. 다음에 다시 쓰려면 서버를 다시 실행한다.
- **브라우저 탭**: 앱은 `window.close()`를 시도하고, 안 되면 **Simple Browser 탭을 수동으로 닫는다**.

### 6) 프로젝트에 반영

저장된 파일을 `docs/` 등으로 옮기거나 이름을 바꿔도 된다.

## 출력 Markdown 형식

```markdown
# Figma — Link to selection

파일: **{파일 이름}**

- {프레임 이름} — https://www.figma.com/design/{fileKey}?node-id={id에서-콜론을-하이픈으로}
```

`node-id`는 Figma 웹의 **Copy link to selection** 과 동일한 딥링크 패턴을 쓴다.

## 에이전트 체크리스트

- [ ] `python3 .claude/tools/serve_figma_explorer.py`로 서버를 띄웠는가(또는 이미 떠 있는지 확인).
- [ ] 브라우저가 `localhost`의 `figma-explorer.html`을 여는가(`file://` 아님).
- [ ] `$FIGMA_TOKEN`이 설정되어 있는가. 사용자에게 토큰을 채팅에 출력하도록 요구하지 않았는가.
- [ ] Markdown이 **`figma_exports/`** 에 저장됐는지 확인했는가.
- [ ] 저장 성공 후 **서버가 내려갔는지** 확인했는가. 브라우저 탭은 필요 시 수동으로 닫았는가.

## 문제 해결

- **403**: 파일 접근 권한·PAT 스코프·토큰 유효성 확인.
- **빈 프레임 목록**: 해당 페이지 최상위에 `FRAME`이 없으면(SECTION만 있으면) 목록이 비어 있다. 구조에 맞는 페이지를 선택한다.
- **포트 충돌**: `python3 tools/serve_figma_explorer.py 9000` 후 URL도 같이 바꾼다.

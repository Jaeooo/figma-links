# Figma tools 패키지

| 구분 | 경로 | 역할 |
|------|------|------|
| **Claude Code 스킬** | [`.claude/commands/figma-explorer.md`](.claude/commands/figma-explorer.md) | `/figma-explorer {URL}` 커스텀 커맨드 |
| **Claude Code 도구** | [`.claude/tools/`](.claude/tools/) | 로컬 서버, `figma-explorer.html` |
| **Cursor 스킬** | [`.cursor/skills/figma-explorer/SKILL.md`](.cursor/skills/figma-explorer/SKILL.md) | 워크플로 전부 이 파일에 포함 |
| **Cursor 도구** | [`.cursor/tools/`](.cursor/tools/) | 로컬 서버, `figma-explorer.html` |
| **출력** | [`figma_exports/`](figma_exports/) | Markdown 저장 위치 |

---

## Setup

### 1. Figma PAT 발급

[Figma → Settings → Personal access tokens](https://www.figma.com/settings) 에서 `file_content:read` 스코프로 토큰을 발급한다.

### 2. FIGMA_TOKEN 등록

**Claude Code** — 전역 설정에 추가. 시스템 환경변수를 건드리지 않고 Claude Code 세션 내에서만 사용된다.

```json
// ~/.claude/settings.json
{
  "env": {
    "FIGMA_TOKEN": "figd_..."
  }
}
```

> 파일이 없으면 새로 만든다. 이미 있으면 `env` 키만 추가한다.

**Cursor** — 프로젝트 루트 `.env` 파일 또는 Cursor 설정의 환경변수에 추가한다.

### 3. 실행

**Claude Code:**
```
/figma-explorer https://www.figma.com/design/{fileKey}/...
```

**Cursor:**
```
/figma-explorer https://www.figma.com/design/{fileKey}/...
```

저장 결과는 `figma_exports/figma-links-{fileKey}.md`에 생성된다.

---

## 다른 프로젝트에 붙이기

**Claude Code만 쓰는 경우:** `.claude/` 폴더 전체를 복사한다.

**Cursor만 쓰는 경우:** `.cursor/` 폴더 전체를 복사한다.

**둘 다 쓰는 경우:** `.claude/`와 `.cursor/` 모두 복사한다.

- `FIGMA_TOKEN`은 한 번만 등록하면 모든 프로젝트에서 공유된다 (위 Setup 참고).
- Figma 파일 URL은 커맨드 파라미터로 전달하므로 별도 config 파일은 불필요하다.
- 출력 Markdown은 각 프로젝트 루트의 `figma_exports/`에 저장된다.

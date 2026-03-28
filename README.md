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

### 사전 요건

- **Python 3.8+** — 로컬 서버(`serve_figma_explorer.py`) 실행에 필요. 별도 패키지 설치 없이 표준 라이브러리만 사용한다.
  ```bash
  python3 --version   # 3.8 이상 확인
  ```
- **Figma 계정** — 대상 파일에 접근 권한이 있어야 한다(본인 파일이거나 공유받은 파일).

---

### 1. Figma PAT 발급

1. [Figma → Settings → Personal access tokens](https://www.figma.com/settings) 접속
2. **Add new token** 클릭
3. 이름 입력 후 스코프에서 **`file_content:read`** 체크
4. 생성된 `figd_...` 토큰을 복사해 둔다 (창을 닫으면 다시 볼 수 없음)

---

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

**Cursor** — 프로젝트 루트에 `.env` 파일을 만들고 추가한다.

```bash
# .env  (프로젝트 루트)
FIGMA_TOKEN=figd_...
```

> `.env`는 `.gitignore`에 추가해 토큰이 리포지터리에 올라가지 않도록 한다.

---

### 3. 실행

**Claude Code:**
```
/figma-explorer https://www.figma.com/design/{fileKey}/...
```

**Cursor:**
```
/figma-explorer https://www.figma.com/design/{fileKey}/...
```

실행하면 Claude가 자동으로:
1. 로컬 서버(`localhost:8080`)를 띄운다
2. 브라우저에서 Figma Explorer 앱을 연다
3. 파일을 불러와 페이지 탭과 프레임 썸네일 그리드를 표시한다

이후 사용자가 직접:
1. 헤더 탭에서 **페이지** 선택
2. 포함할 **프레임 체크박스** 조정 (썸네일 클릭으로도 토글 가능)
3. **선택 확인 · Markdown 저장** 클릭

저장 결과는 `figma_exports/figma-links-{fileKey}.md`에 생성되고, 로컬 서버는 자동 종료된다.

---

### 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| "No internet connection" | 이전 서버가 8080 포트를 점유 중 | Claude가 자동으로 처리하지만, 수동으로 하려면 `lsof -ti :8080 \| xargs kill -9` |
| API 403 오류 | 토큰 스코프 부족 또는 파일 접근 권한 없음 | PAT에 `file_content:read` 스코프 확인, 파일 공유 여부 확인 |
| 프레임 목록 비어있음 | 해당 페이지 최상위에 FRAME 타입 노드가 없음 | 다른 페이지를 선택하거나 Figma에서 최상위 구조 확인 |
| 포트 충돌(8080 외 용도로 사용 중) | — | `python3 .claude/tools/serve_figma_explorer.py 9000` 으로 포트 변경 |

---

## 다른 프로젝트에 붙이기

**Claude Code만 쓰는 경우:** `.claude/` 폴더 전체를 복사한다.

**Cursor만 쓰는 경우:** `.cursor/` 폴더 전체를 복사한다.

**둘 다 쓰는 경우:** `.claude/`와 `.cursor/` 모두 복사한다.

- `FIGMA_TOKEN`은 한 번만 등록하면 모든 프로젝트에서 공유된다 (위 Setup 참고).
- Figma 파일 URL은 커맨드 파라미터로 전달하므로 별도 config 파일은 불필요하다.
- 출력 Markdown은 각 프로젝트 루트의 `figma_exports/`에 저장된다.

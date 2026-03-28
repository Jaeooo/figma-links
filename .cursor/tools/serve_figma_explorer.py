#!/usr/bin/env python3
"""
정적 파일 서빙 + POST /api/save-markdown 로 tools/exports/ 에 Markdown 저장.
POST /api/shutdown 으로 프로세스 종료(저장 성공 후 UI에서 호출).
브라우저는 디스크에 직접 쓸 수 없으므로, 로컬 서버를 통해서만 프로젝트 폴더에 저장한다.
"""
from __future__ import annotations

import json
import os
import re
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent.parent
EXPORTS = PROJECT_ROOT / "figma_exports"


def safe_md_filename(name: str) -> str:
    base = os.path.basename(name or "").strip() or "figma-links.md"
    if not re.match(r"^[\w.\-]+$", base):
        base = re.sub(r"[^\w.\-]", "_", base) or "figma-links.md"
    if not base.lower().endswith(".md"):
        base += ".md"
    return base


class FigmaExplorerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), format % args))

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/shutdown":
            body = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

            def shutdown_server() -> None:
                time.sleep(0.2)
                self.server.shutdown()

            threading.Thread(target=shutdown_server, daemon=True).start()
            return
        if path != "/api/save-markdown":
            self.send_error(404, "Not Found")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            data = json.loads(raw.decode("utf-8"))
            content = data.get("content")
            if content is None or not isinstance(content, str):
                raise ValueError("content 필드(문자열)가 필요합니다.")
            filename = safe_md_filename(str(data.get("filename", "figma-links.md")))
            EXPORTS.mkdir(parents=True, exist_ok=True)
            out = (EXPORTS / filename).resolve()
            if not str(out).startswith(str(EXPORTS.resolve())):
                raise ValueError("잘못된 경로입니다.")
            out.write_text(content, encoding="utf-8")
            rel = out.relative_to(PROJECT_ROOT)
            body = json.dumps({"ok": True, "path": str(rel).replace(os.sep, "/")}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            err = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    httpd = ThreadingHTTPServer(("127.0.0.1", port), FigmaExplorerHandler)
    print(f"Figma Explorer 서버: http://localhost:{port}/figma-explorer.html", flush=True)
    print(f"Markdown 저장 위치: {EXPORTS}/", flush=True)
    print("종료: Ctrl+C", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n종료", flush=True)


if __name__ == "__main__":
    main()

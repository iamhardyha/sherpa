#!/bin/bash
# Sherpa PostToolUse — 파일 편집 후 graph 사실·뷰(.graph.json·대시보드·INDEX)를 재생성.
# 비차단(§4.3): graph는 사실 산출이지 게이트가 아니므로 실패해도 작업을 막지 않는다.
# docs/ 가 있을 때만 동작 — Sherpa 미적용 레포에서는 no-op.

set -e
[ -d docs ] || exit 0
node "${CLAUDE_PLUGIN_ROOT}/scripts/dist/graph/reindex.js" docs >/dev/null 2>&1 || true
exit 0

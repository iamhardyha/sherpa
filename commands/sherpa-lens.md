---
description: 조망 뷰 생성 — "어떤 걸 들여다볼까요?" 먼저 묻고, graph 사실 + docs로 요약+시각 HTML을 만든다.
argument-hint: "[overview|threads|decisions|concept|custom]"
allowed-tools: Read, Write, Bash, Glob
---

# /sherpa-lens

여러 산출물을 가로질러 한 시점을 조망하는 HTML 뷰(§2.4). "길 잃었을 때 들여다보는" 도구.

## 절차

1. **먼저 묻는다**: "어떤 걸 들여다볼까요?" → 메뉴 4종(overview·threads·decisions·concept) + custom 중 선택받음(인자로 줬으면 생략). 추측 금지.
2. **lens 스킬을 따른다** — 절차·철칙·수명 티어·뷰별 레시피는 `skills/lens/SKILL.md`.
   - 데이터는 `docs/.graph.json` 질의(§4.7)에서만, 그림은 AI가. **허구 금지**, 노드는 원본 링크백.
   - 구조 불변: `요약 문단 → 시각`(요약 없는 그림 금지).
3. **수명 티어대로**(§2.4): 라이브 뷰(overview·threads·decisions)는 재생성/transient, concept·custom만 커밋.
4. 출력 → 브라우저로 조망.

> graph 신선도가 의심되면 `/sherpa-reindex` 선행. 끊긴 스레드·미처리 결정은 graph 파서가 판정(§4.3) — lens가 새로 판정하지 않는다.

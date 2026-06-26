---
description: 루트 대시보드 출력 — graph.json overview 질의를 소비해 "내가 어디 있나"를 보여준다. 길 안 잃기.
allowed-tools: Read, Bash
---

# /sherpa-status

지금 상태를 한눈에. graph 사실(§4.7)을 읽어 출력만 한다(생성·이동 없음 — 읽기 전용).

## 절차

1. **신선도 보장**: `docs/.graph.json`이 없거나 오래됐으면 `/sherpa-reindex` 선행(§8 신선도).
2. **overview 질의**(§4.7 — 통째 로드 금지, 슬라이스만) → 다음을 출력:
   - **진행 중**: active plan + 진척도(구현 m/n·테스트 k/n).
   - **주의**: active-stale(잊힌 작업)·broken-link·drift(재검증 필요 spec)·미처리 ADR(proposed/supersede 비대칭).
   - **카운트**: plan active/done · spec · adr 현행/폐기.
3. 자세히 보려면 `/sherpa-lens`(시각)를 안내.

> 데이터는 graph 파서가 판정한 사실(§4.3) — 여기서 새로 판정하지 않는다.

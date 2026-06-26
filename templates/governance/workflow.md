# 워크플로우 (핵심)

<!-- 짧은 핵심만 (§4.1 — 상세 절차는 core-workflow 스킬). @import로 항상 로드되므로 ≤핵심.
     반드시 지킬 불변식은 이 텍스트가 아니라 hook/CI가 강제한다(§4.3) — 여긴 advisory 요약. -->

## 작업 순서 (실행 모드 무관 — 단일·서브에이전트·하네스·팀 동일)

1. **plan** — 트리비얼 아니면 생성, `## 작업` 체크박스로 세분. '설계 필요'면 브레인스토밍(→ plan 설계 섹션).
2. **작업 수행**
3. **테스트** (로직) — 단위·통합·인수
4. **산출물 트리거** — spec 갱신(refs 드리프트) · report 작성(plan 완료) · archive 정리
5. **검증** — 문서=셀프검증 6항목 / 로직=`/simplify` → `/code-review low` + 테스트 통과
6. **보고**
7. **가역성 게이트** — 가역=자동(HOTL) / 비가역만 사람 승인(HITL)

## 트리비얼 면제

코드/문서 사소 변경엔 판단층(`/simplify`·`/code-review`·테스트 작성)을 면제. 단 **결정론 바닥(링크·placeholder·드리프트)은 항상 실행** — 면제 판정은 기계가.

## 합격선

불변 게이트(테스트 green·code-review CRITICAL/HIGH 해소·드리프트 0)는 강제. 임계값(커버리지·MEDIUM 수위)은 conventions.md.

## 산출물 위치

`docs/{adr|plan|spec|report|lens|archive}/`. 식별자=`{date}-{slug}`(영구), NNNN은 표시용. 역참조는 slug로.

> 상세 절차·근거·예외는 **core-workflow 스킬**. INDEX·대시보드는 손대지 말 것(`/sherpa-reindex`가 재생성).

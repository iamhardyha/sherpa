---
name: lens
description: Sherpa lens 뷰 생성 — graph.json 사실 위에 요약+시각 HTML을 만든다. "어떤 걸 들여다볼까요?" 먼저 묻고, 뷰의 수명 티어(라이브/불변/보존)에 따라 재생성·커밋을 가른다. /sherpa-lens가 부른다.
---

# lens — 조망 뷰 생성

여러 산출물을 가로질러 **한 시점의 전체를 조망**하는 HTML 뷰(§2.4). 사람이 docs 수십 장을 머리에 안 담아도 현황이 잡히게 하는 "길 잃지 않기"의 시각 버전.

## 철칙 — 데이터는 기계가, 그림은 AI가 (환각 차단)

> **그래프 사실은 `docs/.graph.json`(§4.7)에서만 온다. lens는 그 사실 위에 요약·시각화만 얹는다.**

- *무엇이 끊겼나·미처리·폐기인가*를 **LLM이 판정하지 않는다** — graph 파서(§4.3)가 이미 판정한 사실을 질의로 받아 쓴다.
- **허구 데이터 금지.** 노드·엣지·카운트는 graph.json 질의 결과여야 한다. 지어내면 안 됨.
- 모든 노드는 원본 산출물(`docs/{artifact}/….md`)로 **링크백**.

## 절차

1. **먼저 묻는다**: "어떤 걸 들여다볼까요?" → 메뉴 4종 + custom 중 선택받음 (추측 금지).
2. **graph 질의**(§4.7 — 통째 로드 금지, 명명 슬라이스만):
   - overview → `overview` 질의 / threads → `plan?status=active-stale` + `thread/{plan}` / decisions → `decisions?state=unhandled` + supersede / concept → 질의 불필요(모델 설명)
   - custom → 작업자가 설명한 관점에 맞는 질의 조합
3. **요약 증류**: 질의 사실을 읽어 **상단 요약 문단** 작성(AI). 무엇이 주의 항목인지 한눈에.
4. **시각 렌더**: `template.html`의 불변 구조에 채움 — `요약 → 시각`. 노드에 링크백 박기.
5. **수명 티어대로 처리**(아래) — 라이브는 재생성/transient, 불변·보존만 커밋.

## 불변 구조 (모든 뷰 공통)

```
요약 문단 (AI 증류)  →  시각 (그래프·타임라인·카드)
```

**요약 없는 그림 금지**(§7 비목표). 텍스트 INDEX보다 빨리 이해 안 되는 뷰는 만들지 않는다 — lens는 이해 가속 도구지 장식이 아님.

## 수명 티어 — 커밋·아카이브를 가름 (§2.4)

*재생성 가능성*과 *휘발성*은 다른 축이다. 뷰마다 다르게 다룬다:

| 뷰 | 티어 | 처리 |
|---|---|---|
| `overview` `threads` `decisions` | **라이브** (휘발·재생성) | 상태 바뀌면 즉시 낡음 → **on-demand 재생성, 커밋 안 함**(transient). 공유·동결할 때만 opt-in 스냅샷 → sweep 공격적(작은 N) |
| `concept` | **불변** (durable) | 워크플로우 모델 온보딩 — 거의 안 바뀜. 커밋, 낮은 sweep 압력 |
| `custom` | **보존** (질문 durable) | 사람이 쓴 관점은 재생성 불가 → 날짜 박은 '그날의 사진'으로 커밋, sweep 최신 N |

**핵심**: 라이브 뷰를 묘지로 쌓지 마라 — 대부분의 lens는 *쌓지 말고 재생성*(§4.5 경량 컨텍스트 정합). 커밋 가치가 있는 건 불변·보존뿐.

## 출력 위치

`docs/lens/{view}/{NNNN}-{date}-{슬러그}.html`(§2.1). 라이브 뷰의 transient 경로·gitignore 메커니즘과 동결 opt-in UX는 구현 시 확정(§8).

## 뷰별 레시피

- **overview**: 카운트(plan active/done·미처리 ADR·재검증 spec) + 주의 항목(active-stale·broken-link·drift) 카드. `/sherpa-status`의 시각 버전.
- **threads**: plan→report 스레드 그래프. active-stale(잊힌 작업)을 빨갛게, paused/abandoned는 구분 표시(§2.2).
- **decisions**: ADR 타임라인 + supersede 체인. 현행 vs 폐기를 status로 색 구분(§2.3).
- **concept**: Sherpa 5종+lens 모델·작업 순서 다이어그램. 온보딩용(데이터 거의 없음, 거의 정적).
- **custom**: 작업자 질문 → 맞는 graph 질의 + docs 읽고 생성. 슬러그로 파일명.

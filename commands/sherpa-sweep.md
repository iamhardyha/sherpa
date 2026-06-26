---
description: archive 스윕 — §2.7 메타데이터로 은퇴 후보를 스캔·제안하고, 사람 승인분만 archive로 이동 + 뷰 갱신.
allowed-tools: Read, Write, Edit, Bash, Glob
disable-model-invocation: true
---

# /sherpa-sweep

은퇴한 산출물을 archive(묘지)로 정리한다. **후보 제안 → 사람 승인분만 이동** (자동 이동 아님 — 수동 전용).

## 후보 판정 (§2.7 메타데이터 · §4.7 graph 사실)

- **plan**: `done`/`abandoned`/`superseded` + 나이 임계 초과. (`active`·`paused`는 절대 제외. done은 재개될 수 있어 *즉시* 안 함 §2.2.)
- **adr**: `superseded` + 나이.
- **spec**: **`refs` 코드 전부 삭제 or `superseded-by`만** — *stale(오래됨)은 archive 아님 → 재검증*(§2.7 2축 분리).
- **report**: 인수한 plan과 함께 + 나이.
- **lens**: 타입별 최신 N 초과 (라이브 뷰는 공격적, concept·custom은 보존 — 수명 티어 §2.4).
- **`_skills/*`는 비대상**(Sherpa 비소유 §4.4).

## 절차

1. graph 사실 + 메타데이터로 후보 목록 산출.
2. 사람에게 **목록 제시** → 승인 받음.
3. 승인분만 `docs/archive/{type}/`로 이동(원래 파일명 유지 §2.1).
4. `/sherpa-reindex` 호출해 INDEX·대시보드·graph 갱신.

> archive 규칙은 §2.2·§2.7, 위치는 §4.

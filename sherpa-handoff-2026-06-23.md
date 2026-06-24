# Sherpa 플러그인 설계 — 핸드오프 문서

> 작성: 2026-06-23 · 작성자: ch.ha@tnear.com + Claude
> 목적: **다른 컴퓨터/새 세션에서 이 설계를 이어가기 위한 자립형 컨텍스트.**
> 같이 받은 파일 (같은 폴더에 묶음):
> - `2026-06-22-sherpa-plugin-design.md` — 스펙 본문 (rev 5, 271줄)
> - `2026-06-23-anthropic-alignment.md` — 리서치 ① Anthropic 정합성
> - `2026-06-23-design-holes-and-expert-solutions.md` — 리서치 ② 허점/해법
> - `sherpa-handoff-2026-06-23.md` — (이 문서)

---

## 0. 30초 요약

**Sherpa** = 공개 배포용 Claude Code 플러그인 설계안. 개발자가 작업 중 **"길을 잃지 않게"** 하고, AI가 만드는 산출물(문서)을 **AI가 항상 관리**하게 한다. 개발자는 보고받고 승인만.

- **상태**: 설계 스펙 rev 5, *승인 대기* — 아직 **구현 안 됨**(코드 0).
- **스펙 위치**: `iamhardyha/ai-workflow` 레포 → `docs/superpowers/specs/2026-06-22-sherpa-plugin-design.md` (master, 커밋 11개 누적).
- **다음 단계 후보**: §8 미해결을 구현 plan으로 / `_skills` 네이밍 확정 / 리서치 노트 docs 보존.

---

## 1. 설계의 뼈대 (스펙 본문 요약)

### 산출물 (시간축 5종 + 조망 1종)
| 산출물 | 질문 | 핵심 |
|---|---|---|
| **adr** | *왜* 정했나 | append-only, Status(proposed/accepted/superseded/deprecated) + 양방향 supersede 링크 |
| **plan** | *무엇을* 할 건가 | 생명주기 Status(active/paused/done/abandoned/superseded), `## 작업` 태스크 체크박스(구현/테스트), `## 변경 이력` |
| **spec** | 지금 *어떻게* 동작하나 | 살아있는 단일 진실, `refs`(코드 대조), `last-verified` |
| **report** | 실제로 *무엇을* 했나 | plan 역참조 |
| **archive** | 은퇴 | 묘지, INDEX 없음 |
| **lens** (조망) | 전체를 *한눈에* | docs 읽어 **요약+시각 HTML**, 타입별 디렉토리(overview/threads/decisions/concept/custom), "어떤 걸 들여다볼까요?" 먼저 물음 |

### 거버넌스 4파일 (`.sherpa/`, 커밋)
- **workflow.md** — 어떻게 일하나(짧은 핵심, 상세는 core-workflow 스킬)
- **project-context.md** — 이게 뭔가
- **conventions.md** — 코드를 어떻게 쓰나(아키텍처 + 코드 규칙). 팀/개인 자유 선택
- **progress.md** — AI 작업 메모리(세션 간 상태 복원)
- (+ **skill-docs.md** — 외부 스킬 문서 등록부)

### 핵심 철학 — "프롬프트가 아니라 결정론적 강제" (§4.3)
LLM 지시 준수는 확률적이라 압축·핸드오프에서 깨진다 → **반드시 지킬 불변식은 hook/CI로 강제**:
- **graph 파서**: 역참조 링크 정적 파싱 → 끊긴 스레드·plan done·supersede·spec 드리프트를 *기계가* 판정(LLM 아님). lens는 그 위에 시각화만(환각 차단).
- 산출물 트리거·spec 드리프트·트리비얼 판정·컨벤션(기계화 가능분)을 hook/린터로 강제.

### 명령
`/sherpa-init` · `/sherpa-conventions` · `/sherpa-sweep` · `/sherpa-status` · `/sherpa-reindex` · `/sherpa-lens`

---

## 2. 진화 이력 (커밋 11개 = 설계 결정 흐름)

```
e0225fc  최초 스펙 (5종 산출물·거버넌스·워크플로우)
ff22b89  lens(조망 HTML 뷰) 추가
5f646e0  rev 2 — 허점 리서치 반영 (강제 계층·가역성 게이트·ADR supersede·NNNN 동시성 등)
8d28427  lens "먼저 묻기" 인터랙션 복원
646a2d8  conventions(코드 컨벤션) 거버넌스 추가
df535a8  conventions에 아키텍처 포함 + 팀/개인 자유 선택
8d4244b  plan 생명주기(Status) 추가
bc9f606  plan paused 상태 + 브레인스토밍 트리거 기준 + 태스크 체크박스
b26f05a  plan done 재개 규칙 + archive 결정(유예 후 sweep)
0dd1d94  산출물 템플릿·메타데이터 + 외부 스킬 문서 + 브레인스토밍 escalation
7ad8e19  신선도 정합 보정 — spec stale ≠ retire (검증 발견 수정)
```

핵심 결정 몇 개:
- **가역성 기반 게이트**: 모든 커밋 승인(고무도장화)이 아니라, 가역=자동(HOTL)·비가역만 사람 승인(HITL).
- **plan 생명주기**: 대부분 전이는 링크에서 자동 파생(done=report 역참조), `abandoned`만 명시. `paused`(다른 작업 이동)는 재개 가능. done은 종착 아님(재개 가능).
- **신선도 2축**: spec이 오래됨(stale)=재검증, 쓸모없어짐(retire)=archive. 섞으면 안 됨.
- **외부 스킬 문서**: 격리(`docs/_skills/{skill}/`)가 기본, 정규화는 opt-in. Sherpa 비소유·비파싱.

---

## 3. 리서치 결과 (요약 — 전문은 같은 폴더의 2개 파일)

rev 2가 반영한 리서치. 모든 URL은 서브에이전트가 실제 fetch로 확인.
전문 2편이 이 문서와 **같은 폴더에 함께 묶여 있음**: `2026-06-23-anthropic-alignment.md` ·
`2026-06-23-design-holes-and-expert-solutions.md`.
(레포에도 보존: `docs/superpowers/research/`, 커밋 `cdb5798`.)

### A. Anthropic 정합성 — **총평 높음**
정합: 커밋된 거버넌스 / CLAUDE.md @import / progressive-disclosure 스킬 / 승인 게이트 / lens 증류·링크백.
- ⚠️ **가장 큰 긴장**: `@import`는 컨텍스트를 *줄이지 않는다* (Anthropic 명시). → CLAUDE.md·workflow.md ≤200줄, 상세는 스킬. [출처: code.claude.com/docs/en/memory, /best-practices]
- **가장 큰 누락(반영함)**: 에이전트 작업 메모리/progress + compaction. → §2.5로 추가.
- 출처: anthropic.com/engineering/{building-effective-agents, effective-context-engineering-for-ai-agents, harness-design-long-running-apps}, anthropic.com/research/measuring-agent-autonomy

### B. 허점 9개 + 전문가 해법 (전부 스펙에 반영됨)
| # | 허점 | 해법 | 근거 |
|---|---|---|---|
| 1 | NNNN 동시성 충돌 | 머지 후 reindex 확정 | MADR #28 |
| 2·9 | 트리거/규칙 LLM 의존 | hook/CI 결정론 강제 | Willison(lethal trifecta), Siddiqi(agent hooks) |
| 3 | spec stale | 코드↔spec 자동 대조 | Martraire(Living Documentation) |
| 4 | lens 그래프 LLM 판정 | 결정론 파서가 사실, LLM은 시각화 | 정적 링크 체커 관행 |
| 5 | 커밋 게이트 병목 | 가역성 티어(HOTL/HITL) | Anthropic(0.8%만 비가역), Bainbridge(Ironies of Automation) |
| 6 | ADR 폐기 추적 | Status+양방향 supersede | Nygard 원전, MADR |
| 7 | lens 묘지 누적 | 타입별 최신 N + 날짜 스냅샷 | — |
| 8 | 트리비얼 LLM 판정 | opt-out + diff 결정론 | GitGuardian |

**핵심 한 줄**: LLM 준수는 확률적이라 핸드오프·압축에서 깨진다 → 신뢰성은 프롬프트가 아니라 *프롬프트 밖 결정론적 강제*(hook/CI, 정적 파싱)에서 온다.

---

## 4. 남은 일 (스펙 §8) — 다음에 할 것

전부 **구현 단계 디테일** (설계 레벨 구멍은 없음):
- graph 파서·드리프트 검사·트리거 hook **구체 구현**(언어·파싱 범위·CI) + 오탐/미탐 임계값
- NNNN 머지 후 재할당 vs ULID/날짜+슬러그 **최종 채택**
- `.sherpa/progress.md` 스키마 + compaction 재주입 hook 검증
- 컨벤션 — 언어별/아키텍처 린터 룰 매핑 카탈로그, 팀↔개인 병합 메커니즘
- 외부 스킬 문서 — 정규화 매핑, `skill-docs.md` 등록 메커니즘, **`_skills` 최종 네이밍**(가제)
- 산출물 템플릿 실제 스캐폴드(`templates/`) + 프론트매터 파서
- lens 타입별 "최신 N", archive 나이 임계값, spec 재검증 임계값

---

## 5. 재개 방법 (다른 컴퓨터 / 새 Claude 세션)

1. `iamhardyha/ai-workflow` 레포 클론 → `git log --oneline`로 위 이력 확인.
2. 스펙 읽기: `docs/superpowers/specs/2026-06-22-sherpa-plugin-design.md`.
3. 새 Claude 세션이면 이 핸드오프 문서를 먼저 붙여넣어 컨텍스트 주입.
4. 다음 작업 선택: **(권장)** §8을 구현 plan으로 분해 → graph 파서부터 (가장 레버리지 큼).

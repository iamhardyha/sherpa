# Sherpa — AI 산출물 워크플로우 플러그인 설계

> 작성일: 2026-06-22 · 갱신: 2026-06-26 (rev 13 — lens 수명 티어 §2.4: 라이브 뷰(휘발·재생성)·불변(concept)·보존(custom) — 대부분 lens는 쌓지 말고 재생성(§4.5 정합) · rev 12 graph.json §4.7 · rev 11 메타데이터 §2.8 · rev 10 실행 모드 §4.6) · 상태: 설계 승인 대기

## 1. 목적

개발자(앱 클라이언트 · 웹 클라이언트 · 서버)가 **자기 작업에만 몰두**하고, AI가 만들어내는 산출물은 **AI가 항상 관리**하도록 하는 공개 배포용 Claude Code 플러그인. 개발자는 AI가 무엇을 했는지 **보고받고 승인**하는 역할에 집중한다.

핵심 가치: 개발자가 작업하다 **길을 잃지 않게** 하고, 컨텍스트를 쉽게 파악·유지하게 한다.

**경량 컨텍스트 (불변식)**: 프로젝트가 커져 산출물이 무한히 쌓여도, 에이전트가 **상시 짊어지는 컨텍스트는 산출물 수와 무관하게 일정**해야 한다 — *누적은 O(n)이어도 상시 로드는 O(1)*. 산출물은 디스크에 쌓이되 컨텍스트 창에 들어오는 양은 묶는다. 산출물이 늘수록 adherence가 떨어지고 길을 잃으므로, 이 경량화 자체가 "길 잃지 않기"의 전제다. (강제 메커니즘 §4.5.)

대상: 모든 개발자 (특정 회사 내부용 아님 — 공개 배포).

## 2. 산출물 5종 (시간축 모델)

서로 역할이 겹치지 않도록 시간축으로 정렬한다. (이 5종을 가로질러 한 시점의 전체를 조망하는 **lens**는 시간축 밖 — §2.4.)

| 시점 | 산출물 | 질문 | 위치 | INDEX |
|---|---|---|---|---|
| 결정할 때 | **adr** | *왜* 이렇게 정했나 (append-only, 1결정 1장) | `docs/adr/{NNNN}-{date}-{제목}.md` | ✅ |
| 작업 전 | **plan** | 앞으로 *무엇을* 할 건가 (브레인스토밍·구현계획·세분화) | `docs/plan/{NNNN}-{date}-{제목}.md` | ✅ |
| 상시 | **spec** | 지금 *어떻게* 동작하나 (살아있는 단일 진실) | `docs/spec/{domain}/{name}.md` | ✅ |
| 작업 후 | **report** | 실제로 *무엇을* 했나 (한 일·검증·결정·이탈) | `docs/report/{NNNN}-{date}-{제목}.md` | ✅ |
| 은퇴 | **archive** | 더는 현역 아님 | `docs/archive/{adr\|plan\|report\|spec\|lens}/...` (lens는 `archive/lens/{view}/`) | ❌ (묘지) |

### 2.1 명명 규칙

- **adr · plan · report**: `{NNNN}-{YYYY-MM-DD}-{kebab-제목}.md`
  - 일련번호(NNNN)는 **폴더별 독립** 증가 (adr는 adr끼리, plan은 plan끼리…).
  - 일련번호 = 안정적 참조 핸들("report 0031"), 날짜 = 사람이 훑기 좋게. 역할이 달라 중복 아님.
  - **번호는 작업 중 미리 잡지 않는다 (동시성 충돌 회피 — 허점 1)**: 작업 중엔 `{date}-{슬러그}`가 임시 핸들, 일련번호는 **머지 후 `/sherpa-reindex`가 확정**. 두 브랜치가 같은 다음 번호를 읽어도(MADR가 겪은 실제 충돌) reindex가 머지 시점 폴더 INDEX 기준으로 **NNNN을 결정론적 재할당** — 단 역참조는 slug 기반이라 **링크는 안 건드린다**(§2.8). 슬러그 충돌(드묾)만 reindex가 식별·디스앰비그(그 인바운드 링크만 갱신). 사람이 머릿속으로 번호를 세지 않는다.
- **lens**: `docs/lens/{view}/{NNNN}-{YYYY-MM-DD}-{슬러그}.html` — **뷰 종류별 하위 디렉토리**(`overview`·`threads`·`decisions`·`concept`·`custom`). 타입별 폴더라 NNNN도 타입별 독립, sweep도 타입별 "최신 N개만"이 깔끔(묘지 누적 차단). lens는 "그날의 조망 스냅샷"이라 날짜를 박아 커밋 — 코드가 바뀌어 그림이 옛것이 돼도 거짓말이 아니라 그 시점의 사진.
- **spec (제외)**: `{domain}/{name}.md`. spec은 "언제 만들었나"가 아니라 "무엇을 설명하나"로 식별되는 살아있는 문서라 날짜·일련번호를 붙이지 않는다.
- **archive**: 원래 파일명 유지(정체성 보존). 출신별 하위폴더(`docs/archive/{adr|plan|report|spec|lens}/`)로 충돌 방지.

### 2.2 plan 생명주기 · report 연결 · 의도 변경

- **생명주기 (Status 필드)**: plan은 `active`(진행 중) ⇄ `paused`(잠시 중단), `active` → `done`(완료) | `abandoned`(폐기) | `superseded`(대체)로 산다. **`done`은 종착이 아님 — 재개되면 다시 `active`**. 프론트매터에 박되, **대부분 전이는 링크 그래프에서 결정론적으로 파생**(§4.3) — 사람이 수동 관리하지 않는다.
  - **탄생**: 트리비얼 아닌 다중 단계 작업이면 plan 생성(§6-C). status=`active`. (브레인스토밍은 설계 필요 시만 — §6-C.)
  - **완료 → `done`**: report가 이 plan을 역참조하면 graph 파서가 **자동 done 판정**(report가 곧 종결 기록). 수동 표기 불필요.
  - **재개 (`done` → `active`)**: 같은 범위에 후속 수정이 생기면 plan을 다시 `active`로 되돌리고 새 태스크 append(report는 후속 뒤 갱신). 범위가 다르면 새 plan. **방금 끝난 plan이 자주 되살아나므로 done을 *즉시* archive하지 않는다** — 아래 아카이브 규칙의 근거.
  - **잠시 중단 → `paused`**: 다른 작업으로 옮기며 잠깐 멈출 때 **명시 표기**(재개하면 `active`). `abandoned`(영영 접음)와 다름 — paused는 *돌아올* 작업이라 경고 대상 아님.
  - **폐기 → `abandoned`**: 작업을 영영 접을 때만 **명시 표기**(+ 변경이력에 사유 한 줄). report 없는 plan이 *진행 중인지 버려진 건지*는 구조로 못 가리니, 이것만 사람/AI가 신호한다.
  - **대체 → `superseded`**: 새 plan이 옛 plan을 갈음하면 양방향 링크(`supersedes`/`superseded-by`) — ADR(§2.3)과 동형.
- **구현 계획 = 태스크 체크박스 (어디까지 했나)**: plan은 `## 작업` 섹션에 작업을 태스크로 세분하고 각 태스크에 **구현·테스트 완료 체크박스**를 둔다 (예: `- [x] 2. 인증 연동 — [x] 구현 [ ] 테스트`). 진행 상황이 plan 안에서 한눈에 보이고, graph 파서가 체크박스를 읽어 **진척도(예: 구현 1/3, 테스트 0/3)**를 lens·status에 노출. 전 태스크 완료 + report 존재 → `done` 자동 파생과 교차검증. (progress.md §2.5는 세션 간 AI 메모리로 "지금 plan 0012의 태스크 2"를 가리키는 포인터 — **plan 체크박스가 정본, progress는 복원용**.)
- **끊긴 스레드의 정밀화 (lens·graph)**: '끊긴 plan↔report 스레드'를 status로 가른다 — `active`+오래됨+report없음 = **진짜 잊힌 작업(경고)**, `paused` = 보류(경고 아님, 재개 대기), `abandoned` = 의도된 폐기(경고 아님), `done` = 종결.
- **아카이브 (결정: 유예 후 sweep 제안 — 즉시 자동 이동 아님)**: `done`은 docs/plan/에 남아 lens에서 dimmed(active와 구분). `/sherpa-sweep`이 **나이 지난 `done`·`abandoned`·`superseded`를 후보로 제안 → 사람 일괄 승인** 후 archive. `active`·`paused`는 절대 archive 안 함. *방금 done이 재개될 수 있어*(위 재개 규칙) 즉시 자동 archive는 비채택.
- **연결**: report 상단에 자신이 인수한 plan을 역참조 (`plan: plan/0012-...`). "이 계획이 어떻게 끝났나"를 한 줄기로 추적.
- **작업 중 의도/진단 피벗** (예: "글자수 편차 → burst 주기"로 진단 재정의):
  1. plan 문서 하단 **`## 변경 이력`**에 한 줄 append — `{date} — 무엇을→무엇으로, 왜` (정본).
  2. 그 전환이 *되돌리기 어렵거나 대안이 있던 결정*일 때만 **ADR로 승격**, plan 변경이력 줄이 그 ADR를 역참조.
  3. 최종 report는 plan을 역참조하므로 "처음 의도 → 중간 피벗 → 최종 결과"가 자동으로 추적됨.
  - 트리플 쓰기(plan+adr+report 동시) 금지 — plan 변경이력이 정본, 나머지는 링크로 연결.

### 2.3 ADR 상태 · supersede (append-only의 폐기 추적 — 허점 6)

ADR은 append-only라 옛 결정도 남는다. 독자가 "이게 아직 유효한가"를 알게 하려면 상태와 양방향 링크가 필수다 (Nygard 원전 · MADR 관행).

- **Status 필드 (의무)**: `proposed` | `accepted` | `superseded` | `deprecated` — 프론트매터에 박는다.
- **번복 처리**: 결정을 뒤집을 땐 옛 ADR을 고치지 않고 **새 ADR 생성** + 양방향 링크 —
  - 새 ADR: `supersedes: adr/0017`
  - 옛 ADR: status를 `superseded`로, `superseded-by: adr/0042` 한 줄 append (append-only 유지).
- **효과**: lens `decisions` 뷰가 이 필드를 **결정론적으로 파싱**해 "현행 vs 폐기"를 정확히 산출(§2.4·§4.3) — 폐기된 결정을 현행으로 오해하는 일을 구조적으로 차단.

### 2.4 조망 산출물 — lens (시간축 밖)

위 5종이 "한 결정·한 계획·한 문서"를 다룬다면, lens는 **여러 산출물을 가로질러 한 시점의 전체를 조망**하는 HTML 뷰다. `/sherpa-lens`가 `docs/`를 스캔해 생성한다(§5.1).

- **왜 별도인가**: AI는 텍스트 문서에 최적화돼 있지만 사람은 문서 수십 장을 머리에 담기 어렵다. lens는 AI가 docs 전체를 읽어 **상단 요약 문단으로 증류 + 하단 시각으로 구조화**해, 사람이 요약만 훑거나 그림만 스캔해도 현황이 잡히게 한다. Sherpa 핵심 가치("길 잃지 않게")의 시각 버전.
- **데이터는 기계가, 그림은 AI가 (허점 4·7 차단)**: "끊긴 스레드·미처리 결정·폐기 안 된 ADR" 같은 **그래프 사실은 결정론적 파서가 산출**한다(§4.3 graph 파서 — 역참조 링크를 정적 파싱). LLM lens는 그 **사실 위에 요약·시각화만** 얹는다 — *무엇이 끊겼나*를 LLM이 판정하지 않으므로 환각·누락이 구조적으로 불가능. 허구 데이터 금지.
- **공통 구조 (불변)**: 모든 lens 뷰 = `요약 문단(AI 증류) → 시각(그래프·타임라인·카드)`. 요약 없는 그림 금지. 노드 클릭 → 해당 산출물 원본(`docs/{artifact}/….md`)으로 점프.
- **뷰 4종 (기본 메뉴) + custom**: ① `overview`(상태 요약 + 지표 + 주의 항목) ② `threads`(plan→report 스레드 — 끊긴 작업 추적) ③ `decisions`(ADR 히스토리 + supersede 상태) ④ `concept`(워크플로우 모델 온보딩). + ✏️ **`custom`**(작업자가 관점을 설명 → graph 사실 + docs 읽고 생성, 슬러그로 파일명). 메뉴 4종은 재생성 가능(같은 상태=같은 그림), custom은 고유 질문이라 보존 가치.
- **수명 티어 (휘발성이 커밋·아카이브 정책을 가른다)** — *재생성 가능성*(다시 만들 수 있나)과 *휘발성*(얼마나 빨리 낡나)은 다른 축이다:
  - **라이브 뷰 (휘발·재생성 — overview·threads·decisions)**: 현재 graph 상태의 순수 함수라 상태가 바뀌는 즉시 낡는다 → 기본은 **on-demand 재생성**(INDEX·대시보드처럼 '뷰', 커밋 안 함/transient). 한 시점을 *공유·동결*할 때만 opt-in 스냅샷 커밋 → sweep이 공격적으로(작은 N) 정리. 값은 '지금'이지 역사가 아님.
  - **불변 (durable — concept)**: Sherpa 워크플로우 모델 온보딩 — 거의 안 바뀜. 장수·낮은 sweep 압력, 스냅샷이라기보다 문서에 가깝다.
  - **보존 스냅샷 (질문 durable·데이터 휘발 — custom)**: 사람이 쓴 *관점·질문*은 재생성 불가라 날짜 박힌 '그날의 사진'으로 보존(데이터가 stale 돼도 시점 사진이라 거짓 아님). sweep 최신 N 유지.
  - 이 티어 분리가 §4.5 경량 컨텍스트를 직접 떠받친다 — **라이브 뷰를 묘지로 쌓지 않는다**(대부분의 lens는 쌓지 말고 재생성). 시간축 5종과 역할이 겹치지 않으므로 §2 표 밖.

### 2.5 에이전트 작업 메모리 — progress (AI가 길 잃지 않게)

5종 산출물은 전부 *사람 대면*이다. 하지만 Anthropic이 장기작업 핵심으로 꼽는 건 **에이전트 자신이 세션 간 상태를 복원하는 메모리**(NOTES.md·progress 파일)다. 컨텍스트 압축·새 세션 후 "내가 어디까지 했지"를 AI가 잃으면 산출물 관리도 무너진다.

- **`.sherpa/progress.md`** (커밋, 작업 단위 갱신): 진행 중 plan, 마지막 완료 단계, 다음 할 일, 미해결 블로커를 에이전트가 append. 새 세션·compaction 후 **가장 먼저 읽어 상태 복원**.
- **compaction 상호작용**: 컨텍스트가 압축되면 루트 `CLAUDE.md`는 자동 재주입되지만 `@import`된 `.sherpa/workflow.md` 재주입은 보장 안 됨 — compaction hook이 **workflow 핵심 + progress.md를 재주입**(§4.3).
- 5종(사람 대면)과 **직교**: progress는 AI 작업 메모리지 산출물 아님. 완료되면 그 내용이 report로 승격되고 progress는 비워진다.
- **병렬·팀 모드**: 단일 progress.md는 경합 → 에이전트별 네임스페이스(`progress/{agent}.md`)로 분리(§4.6).

### 2.6 컨벤션 거버넌스 — conventions (프로젝트 *아키텍처* + 코드를 *어떻게 쓰나*)

개발자·팀마다 **프로젝트 아키텍처**(레이어·모듈 경계, 의존성 방향, 폴더 구조, 헥사고날/클린 아키텍처…)와 **코드 작성 규칙**(클린코드 지향, 약어 금지, 추상화 수준, 컴포넌트 분리, CSS 모듈화…)이 다르다. 이걸 `conventions.md`에 캡처해 AI가 코드를 쓸 때 항상 따르게 한다. `/sherpa-conventions`가 작업자/팀을 인터뷰해 작성·갱신(§5.1). Anthropic도 CLAUDE.md 1순위 용도로 코딩 컨벤션을 꼽는다.

- **두 종류로 갈라 다룬다 (허점 2와 동일 — 프롬프트만으론 LLM이 까먹음)**:
  - **기계화 가능**: 코드 스타일(약어 금지·네이밍·CSS 모듈화·포맷)은 린터(ktlint·ruff·ESLint…), **아키텍처 규칙(의존성 방향·레이어 경계)**은 아키텍처 린터(ArchUnit·dependency-cruiser·import-linter·Konsist) → **있으면 룰로 매핑해 hook/CI 강제**(§4.3). AI 기억이 아니라 도구가 막는다.
  - **판단 필요**: 추상화 수준·컴포넌트 분리 기준·전체 구조 철학·"클린코드" — 린터로 못 잡으니 **advisory(@import) + `/code-review` 체크포인트**(§6-J).
- **린터 없으면 우아하게 후퇴**: 대부분 언어·서버 환경에 린터가 있다. `/sherpa-conventions`가 레포를 보고 — 있으면 그 룰로, 없으면 "깔까요?" 제안하거나 advisory+리뷰로. **강제는 보너스지 전제가 아님.**
- **≤200줄 핵심만** conventions.md, 상세·예시는 `conventions` 스킬로 progressive disclosure(workflow.md와 같은 패턴).
- **공유 범위 = 자유 선택**: `/sherpa-conventions`에서 **팀 공유(커밋 `.sherpa/conventions.md`)** 인지 **개인(로컬, 커밋 안 함)** 인지 그때그때 고른다. 둘 다 두면 **개인이 팀 위에 얹힘**(충돌 시 개인 우선, 팀 규칙은 못 약화). 혼자 하는 레포면 그냥 팀=나.

### 2.7 산출물 템플릿 · 필수 항목 (= sweep·graph·드리프트가 읽는 메타데이터)

각 산출물의 **필수 프론트매터 + 섹션**을 고정한다. 이 필수 항목이 곧 graph 파서·드리프트 검사·`/sherpa-sweep`이 읽는 메타데이터다 — 정의가 없으면 sweep·graph가 작동할 근거가 없다. 스캐폴드는 `templates/`에, 셀프검증 ①이 미작성 placeholder를 스캔(§6).

| 산출물 | 필수 프론트매터 (메타데이터) | 필수 섹션 |
|---|---|---|
| **adr** | `status`(proposed/accepted/superseded/deprecated) · `date` · (`supersedes`/`superseded-by`) | 맥락 · 결정 · 근거 · 대안 · 결과 |
| **plan** | `status`(active/paused/done/abandoned/superseded) · `date` · (`supersedes`/`superseded-by`) | 목표 · (설계 — 브레인스토밍 시) · `## 작업`(태스크 체크박스 §2.2) · `## 변경 이력` |
| **spec** | `domain` · `last-verified`(날짜) · `refs`(대조할 심볼·파일 경로) · (`superseded-by`) | 개요 · 동작 · 인터페이스/계약 |
| **report** | `date` · `plan`(역참조 — 필수) | 한 일 · 검증 · 결정 · 이탈 |
| **lens** | (HTML 생성물 — 손작성 프론트매터 없음) | 요약 블록 · 시각 (graph 사실 기반 §2.4) |

- spec의 `refs`가 §6-I 드리프트 검사의 입력(코드와 대조할 대상), `last-verified`는 보조 신호.
- plan `status`·`## 작업` 체크박스가 graph의 done 파생·진척도 입력(§2.2).
- **spec 신선도 = 2축 (섞지 말 것)**: ① *정확성*(last-verified 오래 / 드리프트) → **재검증·수정** 필요 → lens·status에 "재검증 필요" 플래그(**절대 archive 아님** — 살아있는 진실은 고치지 버리지 않음). ② *현역성*(설명 대상이 제거·대체) → **`refs` 코드가 전부 사라졌거나 `superseded-by`**면 archive 후보. sweep은 ②만 본다.
- 이 메타데이터를 `/sherpa-sweep`이 읽어 archive 후보를 판정(§5.1) — 메타데이터 ↔ sweep 정합.

### 2.8 메타데이터·역참조 계약 (deterministic-parse 계약)

§4.3 결정론 바닥(graph 파서·드리프트·트리거·done 파생)이 *읽는* 정확한 계약. 신뢰는 프롬프트가 아니라 이 계약에서 온다 — 필드·링크 문법이 고정돼야 정적 파서가 작동한다. (§2.7이 *무엇이 필수*인지라면, 여기는 *정확히 어떤 문법*인지.)

- **식별 = slug, NNNN은 표시용 (핵심 결정 — §8 NNNN 논쟁 해소)**: 산출물의 **영구 id = `{date}-{kebab-slug}`**(adr·plan·report·lens). **모든 역참조는 slug로 건다.** **NNNN은 사람용 정렬·표시 프리픽스일 뿐 id가 아님** → 머지 후 `/sherpa-reindex`가 NNNN을 (재)부여해도 **링크는 안 건드린다**(slug 불변). spec id는 `{domain}/{name}`. (ULID·NNNN-rewrite 대신 **slug-stable 채택** — reindex의 링크 전수 재작성 비용 소멸.)
- **역참조 문법 (프론트매터 = 정적 파서 입력)**: report→plan `plan: {slug}` · supersede `supersedes:`/`superseded-by: {slug}`(adr·plan) · spec 현역성 `superseded-by:` · spec→코드 `refs: [경로 | 경로#심볼 | 글롭]`. slug가 어느 산출물과도 안 맞으면 graph가 **broken-link** 판정.
- **`refs` → 드리프트 입력(§6-I)**: 항목 = 경로·심볼·글롭. *어느 ref 타깃이든 최근 diff에 걸리면* spec 재검증 플래그(archive 아님 §2.7).
- **plan `## 작업` 체크박스 문법**: `- [x] {N}. {제목} — [x] 구현 [ ] 테스트`. 파서가 구현·테스트 체크 수를 세 진척도(구현 m/n·테스트 k/n) 파생(§2.2). 전부 체크 + report 역참조 → done 교차검증.
- **상태 enum 고정**: adr `{proposed,accepted,superseded,deprecated}` · plan `{active,paused,done,abandoned,superseded}`. enum 위반 = 검증 실패.
- **슬러그 충돌(드묾)**: 두 브랜치가 같은 `{date}-{title}` 생성 → 머지 시 reindex가 식별·디스앰비그(짧은 접미)하고 **그 산출물의 인바운드 링크만** 갱신(전수 재작성 아님).
- 필수 필드 누락·placeholder = 셀프검증 ①(grep)이 잡음(§2.7·§6).

## 3. 파일 정체성 (4분류)

**Sherpa가 소유·관리하는** 파일은 정확히 네 부류로만 나뉜다 — 이 구분이 "어디에 뭘 쓰지?" 혼란을 없앤다. (외부 스킬 문서 `_skills/`는 이 4분류 *밖* — Sherpa 비소유·비파싱, §4.4.)

| 분류 | 파일 | 누가 쓰나 | 갱신 |
|---|---|---|---|
| **커밋 거버넌스** (소유) | `.sherpa/workflow.md` · `.sherpa/project-context.md` · `.sherpa/conventions.md` · `.sherpa/skill-docs.md` · 루트 `CLAUDE.md` | `/sherpa-init`이 템플릿에서 찍음, 이후 레포가 소유 (conventions는 `/sherpa-conventions`) | `/sherpa-init --upgrade`로 명시적 재생성 |
| **산출물** (내용) | adr · plan · spec · report · **lens**(스냅샷) · archive | 사람 + AI (lens는 AI 생성·사람 트리거) | 상시 트리거 |
| **에이전트 메모리** | `.sherpa/progress.md` | AI (작업 단위 append) | 세션 간 상태 복원 · 완료 시 report 승격 후 비움 |
| **뷰** (재생성) | INDEX ×5 · 대시보드 `docs/README.md` · **graph 사실 `docs/.graph.json`(gitignore)** | 기계 (손 안 댐) | `/sherpa-reindex`·hook이 폴더 스캔해 재생성 |

## 4. 레포 구조 (init 후)

```
README.md             ← 레포 자체 README (온보딩 진입점 → .sherpa/project-context.md 가리킴)
CLAUDE.md             ← 얇은 포인터(≤200줄). 핵심 규칙 + @.sherpa/workflow.md(짧은 핵심)·@project-context import. 상세는 core-workflow 스킬
.sherpa/
├── workflow.md       ← 워크플로우 핵심만 (커밋, 짧게 — 상세 절차는 core-workflow 스킬)
├── project-context.md ← 이 레포가 무엇인지 (커밋)
├── conventions.md    ← 코드 컨벤션 (커밋, §2.6 — 린터 매핑 + advisory)
├── progress.md       ← 에이전트 작업 메모리 (커밋, §2.5)
└── skill-docs.md     ← 외부 스킬 문서 등록부 (커밋, §4.4)
docs/
├── README.md         ← 루트 대시보드 (현재 상태만 — 뷰, 재생성)
├── .graph.json       ← graph 파서 산출 (역참조 링크 사실 — gitignore, 재생성)
├── adr/    INDEX.md(뷰) + {NNNN}-{date}-{제목}.md   (Status·supersede 필드 §2.3)
├── plan/   INDEX.md(뷰) + {NNNN}-{date}-{제목}.md   (Status §2.2 + 하단 ## 변경 이력)
├── spec/   INDEX.md(뷰) + {domain}/{name}.md
├── report/ INDEX.md(뷰) + {NNNN}-{date}-{제목}.md   (상단 plan 역참조)
├── lens/   INDEX.md(뷰) + {view}/{NNNN}-{date}-{슬러그}.html   (요약+시각, 타입별 커밋)
├── _skills/{스킬명}/...   외부 스킬 문서 (Sherpa 비소유·비파싱, §4.4)
└── archive/{adr|plan|report|spec|lens}/...   (lens는 {view}/ 중첩, INDEX 없음)
```

### 4.1 일관된 환경의 원천

**일관성 = 커밋된 파일(advisory) + 결정론적 강제(deterministic)** 의 2계층.

- **로딩**: Claude Code가 루트 `CLAUDE.md`를 자동 로드 → `@import`로 `.sherpa/workflow.md`(짧은 핵심)·`project-context.md`·`conventions.md`를 에이전트가 항상 앎. **SessionStart *로딩* 훅 없음**(@import가 네이티브). 단 @import는 *컨텍스트를 줄이지 않으므로*(Anthropic 명시) `CLAUDE.md`+`workflow.md`는 **≤200줄 핵심만**, 상세 절차는 `core-workflow` 스킬로 **progressive disclosure**(adherence 저하·비대화 방지).
- **강제**: advisory 텍스트는 LLM이 압축·핸드오프에서 무시할 수 있다(확률적). 그래서 **반드시 지켜야 하는 불변식은 hook/CI로 결정론적으로 강제**한다(§4.3). 로딩 훅(회피)과 강제 훅(채택)은 다른 것 — 전자는 @import로 충분, 후자는 advisory로 부족.
- 거버넌스 파일이 **git에 커밋** → 누가 클론하든·CI든·플러그인 미설치자든 **동일 규칙**. git이 레포별 버전을 핀 고정. 플러그인은 **설치·유지보수 도구**(런타임 의존 아님).

### 4.2 stream 옵션 (직군 일반화)

- 기본값 = stream 없음 → `docs/{artifact}/` (앱·웹 클라이언트 등 단일 덩어리 레포에 적합).
- stream 활성 → `docs/{stream}/{artifact}/` (서버처럼 복합 도메인 — 예: app/admin/shared).
- `/sherpa-init` 시 선택.

### 4.3 강제 계층 — 프롬프트가 아니라 hook/CI (허점 2·3·8·9 차단)

리서치 결론: **LLM의 지시 준수는 확률적이고 압축·핸드오프 지점에서 깨진다**(Willison, Karpathy, Siddiqi). "에이전트가 작업 끝에 표를 훑는다"는 보장이 아니다. 그래서 *반드시 지켜야 하는* 불변식은 advisory에서 빼내 결정론적 게이트로 옮긴다. (모두 `scripts/`의 순수 파싱 — hook과 CI가 공용.)

- **graph 파서** (Stop/PostToolUse hook + `/sherpa-reindex`): 역참조 링크를 정적 파싱해 `docs/.graph.json` 산출 — 끊긴 plan↔report 스레드(**plan status로 active-stale vs abandoned 구분** §2.2), plan `done` 자동 파생(report 역참조), supersede 안 된 ADR, 깨진 링크, **spec 재검증 필요(refs 드리프트·last-verified 오래)·spec retire 후보(refs 전부 삭제)**를 **기계가 판정**(LLM 아님). lens·status가 이 사실을 소비(§2.4) — *재검증은 surface만, archive 아님*(§2.7). 출력 스키마·파생 사실·질의는 §4.7.
- **산출물 트리거 강제**: 커밋 전 hook이 결정론적으로 검사 → **spec = `refs` 드리프트**, **report = plan 완료 파생**(§6-A), **trivial은 면제**(§6-D). 미충족이면 **완료 차단**.
- **spec 드리프트 강제**: spec이 가리키는 심볼·경로가 최근 변경됐는데 spec 미변경이면 셀프검증 **실패**(§6-I).
- **트리비얼 판정**: LLM이 아니라 diff 분석 — 코드 변경 시 기본값 "리뷰 필요", 면제는 기계가 "주석/공백만"을 확인할 때만(§6-D).
- **컨벤션 강제**: 기계화 가능한 컨벤션(§2.6)은 기존 린터 룰로 매핑해 hook/CI가 강제, 판단 규칙은 advisory + `/code-review`(§6-J). 린터 없으면 advisory로 후퇴.
- **compaction 재주입**: 컨텍스트 압축 시 workflow 핵심 + `progress.md` 재주입(§2.5).
- 셀프검증 6항목 중 기계화 가능한 것(placeholder grep·링크 체커)은 LLM 자가점검이 아니라 **스크립트**로.

### 4.4 외부 스킬 문서 — 격리 + 등록

외부 스킬·플러그인이 만드는 문서는 Sherpa 5종에 안 맞을 수 있다. Sherpa는 **이걸 소유·파싱하지 않되**(§3 4분류 밖) 한 곳에 모아 discoverable하게 둔다.

- **규칙**:
  - **매핑되면 정규화 (opt-in, 기본 아님)**: 외부 산출물이 Sherpa 타입에 해당하면(결정=adr · 계획=plan · 살아있는 문서=spec · 결과=report) 표준 디렉토리에 정규화. 단 외부 포맷을 함부로 변형하면 깨지니 **팀이 명시 opt-in할 때만**.
  - **안 맞으면 격리 (기본)**: `docs/_skills/{스킬명}/`(가제)에 스킬 자체 구조·네이밍 그대로. `_` 접두 = 핵심 산출물과 정렬·시각 구분.
- **등록·참조**: `.sherpa/skill-docs.md`에 "스킬 X → `docs/_skills/X/` (정규화 여부)" 한 줄 등록. 그 스킬을 쓸 때 에이전트가 **그 디렉토리를 먼저 참조**하도록 conventions/CLAUDE.md가 안내.
- **뷰**: `/sherpa-reindex`가 `_skills/*`를 대시보드 "외부 스킬 문서" 섹션으로 노출(discoverable). graph 파서는 Sherpa 링크·status가 없으니 **opaque 취급**(끊긴 스레드 판정 대상 아님).
- **신선도**: Sherpa는 외부 문서의 신선도를 **관리하지 않는다**(소유 스킬 책임). `/sherpa-sweep`은 `_skills/*`를 **자동 archive 하지 않음**(비소유). 대신 reindex가 "외부 스킬 문서 N개 · 마지막 수정일"을 대시보드에 노출해 사람이 stale을 인지 → 직접 정리.
- 최종 네이밍(`_skills` vs `external` vs `vendor` …)은 §8.

### 4.5 컨텍스트 경계 — 경량 유지 (상시 로드 O(1), 핵심 목적)

§1의 경량 컨텍스트 불변식을 떠받치는 구조. 원칙은 **누적(디스크) ≠ 상시 로드(컨텍스트)의 분리**다 — adr·plan·report는 append-only로 무한히 쌓여도, 매 세션 켜져 있는 맥락은 산출물 수와 무관하게 상수로 묶는다. 산출물이 늘수록 컨텍스트가 비대해지면 LLM adherence가 떨어져(§4.1) 정확히 Sherpa가 막으려는 "길 잃음"이 되돌아오므로, 경량화는 보너스가 아니라 전제다.

- **상시 로드 상한**: `CLAUDE.md`+`workflow.md`+`conventions.md` 핵심 ≤200줄(§4.1), 상세는 스킬로 progressive disclosure → 산출물이 늘어도 항상 켜진 양은 안 자람. `progress.md`는 완료 시 report 승격 후 비움(§2.5)이라 작업 메모리도 평탄.
- **통째 로드 금지 — 질의로 필요분만 (just-in-time)**: 에이전트는 문서 수십 장이나 INDEX·`.graph.json` *전체*를 컨텍스트에 올리지 않는다. `graph.json`은 **질의 계층**(예: "active-stale plan만", "이 spec의 refs만", "미처리 결정만")으로 필요한 사실만 추출해 소비 — 그래서 graph 파서(§4.3)는 단순 사실 산출이 아니라 *컨텍스트 경계를 지키는 질의 계층*이다. INDEX·대시보드도 사람·도구가 보는 뷰지 에이전트 상시 입력이 아님.
- **active set 경계**: sweep(§2.7·§5.1)이 죽은 산출물을 archive(INDEX 없는 묘지 — 비로드)로 빼 active set을 묶는다. lens 타입별 최신 N(§2.4)도 같은 동기 — 묘지 누적이 곧 컨텍스트 누수.
- **검증(advisory 아님)**: 측정 가능해야 강제다 — 산출물 N을 늘려도 상시 로드 토큰이 *평탄*한지 셀프검증/CI가 회귀 검사(§8 임계값과 연동). 평탄성이 깨지면 경계 누수로 본다.

### 4.6 실행 모드 독립성 — 단일·서브에이전트·하네스·에이전트 팀

개발자가 어떤 실행 모드로 일하든 산출물 관리는 동일하게 움직인다. 가능한 *이유*는 §4.1·§4.3의 귀결 — **강제가 에이전트 프롬프트 안이 아니라 git/파일 경계 밖(hook·CI·정적 파서)에 있어서**, 누가·몇이 쓰든 같은 경계에서 같은 불변식이 발화한다. 수렴은 산출물/git 계층에서 일어난다.

- **정확성은 보장, 협응은 오케스트레이터 책임 (두 축 분리)**: Sherpa는 **불변식 정확성**을 보장한다(드리프트·트리거·게이트는 작성자 수와 무관). 하지만 **병렬 작성자 조정**(누가 어느 파일을 쓰나)은 *팀을 띄운 층*(하네스·에이전트 팀)의 일이지 Sherpa 책임이 아니다. Sherpa 몫은 충돌을 **안전·탐지 가능**하게 만드는 것 — NNNN은 머지 후 reindex가 결정론 재할당(§2.1), 깨진 링크·드리프트는 바닥이 잡는다. *조용한 오머지는 막되 파일 소유권은 배분하지 않는다.*
- **모드별**: 단일=자명 · 서브에이전트=부모 advisory를 못 물려받아도 hook/CI 바닥이 구원(§4.3의 실증) · 하네스=워크플로우를 코드로 강제하니 더 강함 · 에이전트 팀=동시 쓰기 stress — 오케스트레이터가 작업을 *분할*해 같은 파일 동시 편집을 예방하는 게 정석.
- **`.sherpa/progress.md`는 Sherpa 소유 공유 상태라 예외**: 팀·병렬에서 단일 파일은 경합 → **에이전트별 네임스페이스**(`progress/{agent}.md`)로 분리, 오케스트레이터 progress가 병합점(단일 모드는 기존대로 단일 파일). 구현 §8.
- 승인 게이트(§6-F)는 *비가역 경계*(push·tag·publish — 자연 병목)에 있어 팀이라도 **단일 HITL 창구**로 모인다 — 게이트를 "가역성"에 둔 결정이 팀 확장성을 살린다.

### 4.7 graph.json — 파생 스키마 + 질의 인터페이스 (결정론 사실의 형태)

§2.8 계약이 파서의 *입력*이라면, `.graph.json`은 그 *출력* — 순수 사실(노드·엣지·파생 판정)이고 **요약·그림은 없다**(그건 lens, §2.4). gitignore·재생성(§3), 소비자는 읽기 전 신선도 보장(§8).

- **노드** (adr·plan·spec·report — lens는 소비자라 제외, `_skills`는 opaque §4.4): `{id(slug 또는 domain/name) · type · path · NNNN(표시) · status · date · title}`. plan은 `progress{impl: m/n, test: k/n}`, spec은 `{domain · refs[] · last-verified}` 추가.
- **엣지** (§2.8 역참조에서 파생, typed·directed): `plan-report`(report→plan) · `supersede`(adr·plan, 양방향 정합 검사) · `spec-refs`(spec→코드 타깃 — 산출물이 아니라 경로·심볼).
- **파생 사실** (기계 판정 — §4.3의 산물, LLM 아님): `plan.done`(인바운드 report 엣지 + 태스크 전부 체크 교차검증 §2.2) · `active-stale`(plan active + 나이>임계 + report 없음 = 진짜 잊힌 작업; paused·abandoned·done 제외) · `broken-link`(역참조 slug가 어느 노드와도 불일치) · `supersede-asymmetry`(한 방향만 있는 supersede §2.3) · `unhandled-decision`(adr `proposed`) · `drift`/`retire-candidate`(드리프트 체커가 `refs`↔git diff로 산출·주입 §6-I — **2축 분리**: drift=재검증(살아있음), retire=현역성 상실(refs 전멸/superseded-by), 섞지 않음).
- **질의 인터페이스 (통째 로드 금지 — §4.5)**: 에이전트·명령은 graph.json *전체*가 아니라 **명명된 슬라이스**만 가져온다 — 산출물 N과 무관하게 반환 크기 일정(O(1) 유지).

| 질의 | 반환 | 소비자 |
|---|---|---|
| `overview` | 카운트 + 주의 항목(active-stale·unhandled·drift·broken) | `/sherpa-status`·lens overview |
| `plan?status=active-stale` | 잊힌 작업 목록 | status·lens threads |
| `thread/{plan}` | 그 plan↔report 줄기 | lens threads |
| `spec/{id}/refs` | 그 spec의 refs만 | 코드 손대기 전 에이전트·드리프트 |
| `decisions?state=unhandled` | 미결·비대칭 ADR | lens decisions |
| `drift` | 재검증 플래그 spec | 검증·status |
| `progress/{plan}` | 체크박스 진척 | status·lens |

질의는 **읽기 전용 파생물** — 정본은 언제나 산출물 원본(§2.8). 같은 상태 → 같은 답(재현성).

## 5. 플러그인 구성 (하이브리드)

```
sherpa/  (플러그인 — 공개 배포)
├── .claude-plugin/plugin.json
├── commands/
│   ├── sherpa-init.md      레포 1회 초기화(+ --upgrade로 거버넌스 재생성). stream 선택.
│   ├── sherpa-conventions.md  작업자/팀 인터뷰 → conventions.md 작성·갱신 (+ 린터 매핑)
│   ├── sherpa-sweep.md     archive 스윕 — 후보 제안 → 사람 승인분만 이동 + 뷰 갱신
│   ├── sherpa-status.md    루트 대시보드 출력 (graph.json 소비 — 진행중 plan · 미처리 결정)
│   ├── sherpa-reindex.md   INDEX ×5 + 대시보드 + graph.json 폴더 스캔 재생성
│   └── sherpa-lens.md      graph 사실 + docs 스캔 → 요약+시각 HTML (메뉴 4종 + custom)
├── hooks/                  결정론적 강제 (§4.3 — 트리거·드리프트·graph·compaction 재주입)
├── scripts/                graph 파서·링크 체커·드리프트 검사 (hook·CI 공용, 순수 파싱)
├── skills/core-workflow/   불변 규칙의 상세 절차 (progressive disclosure — CLAUDE.md 비대화 방지)
├── skills/conventions/     컨벤션 캡처·린터 매핑 절차 + 상세 규칙/예시
├── skills/lens/            뷰 생성·요약 증류 + HTML 템플릿 (그래프 사실 위에 시각화만)
└── templates/              workflow.md(짧은 핵심) · project-context.md · progress.md · CLAUDE.md · docs·lens 스캐폴드
```

### 5.1 명령

| 명령 | 역할 | 트리거 |
|---|---|---|
| `/sherpa-init` | 레포 초기화 — `.sherpa/` 거버넌스(workflow·context·conventions·progress) + `docs/` 5종 + lens 타입별 폴더 + 뷰 스캐폴드. `--upgrade`로 거버넌스 재생성 → git diff 검토 후 커밋. `disable-model-invocation`(부작용 — 수동 전용). | 사람 |
| `/sherpa-conventions` | 작업자/팀 인터뷰 → **아키텍처 + 코드 컨벤션**을 conventions.md에 작성·갱신. **팀(커밋)/개인(로컬) 범위 선택**. 기계화 가능 규칙(아키텍처 의존성 방향 포함)은 린터 룰로 매핑(있으면)·없으면 제안/advisory, 판단 규칙은 advisory+리뷰(§2.6). | 사람 |
| `/sherpa-sweep` | **§2.7 메타데이터로** archive 후보 스캔 — plan(`done`/`abandoned`/`superseded`+나이) · adr(`superseded`+나이) · spec(**`refs` 코드 전부 삭제 or `superseded-by`** — *stale은 archive 아님→재검증, §2.7*) · report(plan과 함께·나이) · lens(타입별 최신 N 초과) → 목록 제시 → **사람 승인분만** 이동 + 뷰 갱신. `_skills`는 비대상(§4.4). `disable-model-invocation`. | 사람 |
| `/sherpa-status` | 루트 대시보드 출력 (`graph.json` 소비) — "내가 어디 있나" 길 안 잃기. | 사람 |
| `/sherpa-reindex` | INDEX·대시보드·graph.json 재생성 (손편집 누락 방지). | 사람/에이전트 |
| `/sherpa-lens` | **먼저 "어떤 걸 들여다볼까요?" 물어** 메뉴 4종 + custom을 선택받음 → `docs/.graph.json` 사실 + docs 읽어 요약 + 시각 HTML(`docs/lens/{view}/{NNNN}-{date}-{슬러그}.html`) → 브라우저 조망. 끊긴 스레드·미처리 결정은 graph 파서가 판정(§4.3). | 사람 |

## 6. 불변 워크플로우 규칙 (`.sherpa/workflow.md` 정본)

**A. 산출물 5종 상시 트리거** — §2 표. 에이전트가 작업 끝에 표를 훑되 **이것에만 의존하지 않는다**: 커밋 전 hook이 결정론적으로 검사해 누락이면 완료를 차단(§4.3). 단 **트리거는 두 갈래로 정확히 정의**된다 — ① **spec 트리거 = 드리프트**(코드가 spec의 `refs`를 바꿨는데 spec 미갱신 §6-I — 하드 게이트), ② **report 트리거 = plan 완료**("plan 태스크 전부 체크 + report 없음"을 graph가 파생 §2.2 — 코드 변경 자체가 아니라 *계획 종결*이 신호). **기계-trivial 변경(§6-D)은 트리거 의무 면제**(로그 한 줄에 report 강요 금지) — 단 드리프트·링크·placeholder 바닥은 그대로. advisory(훑기) + 강제(hook)의 이중화.

**B. plan↔report 연결 & 의도 변경** — §2.2.

**C. 불변 작업 순서** (실행 수단 무관 — 단일·서브에이전트·하네스·**에이전트 팀** 동일, §4.6):
1. (트리비얼 아니면) **plan 생성** — 작업을 `## 작업` 태스크 체크박스로 세분(§2.2), status `active`. **브레인스토밍은 기본 OFF — '설계 필요' 작업일 때만 또는 명시 요청 시** 트리거(→ plan 설계 섹션). 비가역·대안 결정이 있으면 ADR도(§2.3).
   - **'설계 필요' 기준** (브레인스토밍 트리거): ① 새 기능·서브시스템 ② 아키텍처 영향(여러 모듈·레이어·공유 primitive·공개 API·데이터 모델) ③ 비가역·대안 있는 결정 ④ 요구사항 모호. 그 외 작은 변경은 브레인스토밍 생략(요청 시만) — plan은 가벼운 태스크 목록만. **경계가 모호하면** 추측하지 말고 "설계 브레인스토밍 할까요?"를 사람에게 물어 결정(값싼 escalation).
2. 작업 수행
3. (로직이면) 유형별 테스트 작성 (단위/통합/인수)
4. 산출물 트리거 적용 — spec 갱신 · report 작성 · archive 정리
5. 검증 (에이전트가 직접 실행, 지시 대기 없음) — **문서**=셀프검증 6항목. **로직**=2단계: ① `/simplify`(품질 정리 — 재사용·단순화·효율·고도, 작업 트리에 적용 / *버그는 안 봄*) → ② `/code-review low`(위험·복잡=medium — 버그·정확성) + 테스트 통과(합격선 §6-K). simplify가 코드를 바꾸므로 그 *뒤*에 리뷰·테스트가 최종본을 본다(§6-E).
6. 보고
7. **가역성 기반 게이트**(§6-F) — 로컬 커밋은 자동(HOTL), 비가역 행위만 사람 승인(HITL)

**D. 트리비얼 면제 — 판단층만 면제, 결정론 바닥은 항상 (opt-out + 기계 판정, 허점 8)**: 사소한 변경에 비싼 **판단층**(`/simplify`·`/code-review`·테스트 *작성*·내부 일관성 판단)을 돌리면 경량 컨텍스트(§1)에 역행하고 §6-F처럼 진짜 변경의 주의를 흐린다 → **판단층은 면제**하되 **값싼 결정론 바닥(placeholder·링크·드리프트 검사 스크립트)은 trivial이라도 항상 실행**(면제가 안전한 전제 — §6-K). 산출물 트리거는 trivial 변경엔 의무 없음(§6-A). 면제 판정은 LLM 재량이 아니라 **기계**가 한다(§4.3).
- **코드**: 기본값 = 판단층 필요. 면제는 **diff가 주석/공백·포맷/로그 문구/자명한 리네임뿐임을 기계가 확인**할 때만. **버그·동작·계약 변경은 1~2줄이라도 면제 아님.** 함정 — ① *공백·포맷*은 **언어 인지** 필수(Python 들여쓰기·YAML·탭은 공백이 곧 동작 → brace 언어에서만 면제 성립), ② *로그 문구*는 식이 **순수 리터럴/기존 변수일 때만**(부작용 호출 포함 시 동작 변경 → 면제 불가), ③ *리네임*은 리뷰만 면제 — `refs`·공개 API를 건드리면 드리프트 검사(바닥)가 잡는다.
- **문서**: 기본값 = 셀프검증 6항목. **prose 본문 줄만 바뀐 게 기계 확인되면** 판단 항목(③ 코드 대조·④ 내부 일관성·⑥ 트리거 교차)만 생략, **바닥(① placeholder·② 링크·⑤ 드리프트)은 항상**. frontmatter(status·refs·date·plan)·링크 URL·코드펜스·heading anchor를 건드리면 trivial 아님.
- 기준은 줄 수가 아니라 **"동작/구조가 바뀌는가"** — 그 판정을 LLM 재량에 맡기지 않는다.

**E. 로직 검증 2단계 — `/simplify` → `/code-review` (코드 변경 후 표준)**: 코드를 바꾸면 ① 먼저 **`/simplify`**로 품질을 정리하고(재사용·단순화·효율·고도 — 작업 트리에 직접 적용, *버그 탐지는 안 함*), ② 그 다음 **`/code-review low` 명시 호출**로 정확성·버그를 검증한다(무인자 `/code-review` 금지 — high로 튐). **순서가 핵심** — simplify가 코드를 바꾸므로 리뷰가 *정리된 최종본*을 보게 한다. /code-review 티어: 위험·복잡 변경(보안·동시성·결제·공유 primitive)만 medium, 그 외 low. **high/max/ultra는 사람만**(넓게 훑고 false positive를 사람이 추림). low/medium은 별도 클라우드 과금 아님(로컬 effort), ultra만 클라우드. **역할 분리**: `/simplify`=품질(깔끔함), `/code-review`=버그(정확성) — 서로 안 겹친다.

**F. 가역성 기반 차등 게이트 (허점 5 — 고무도장화 방지)**: 기준은 "중요한가"가 아니라 **"되돌릴 수 있는가"**(Anthropic: 행동의 ~0.8%만 비가역).
- **자동 (HOTL — 사후 개입 가능)**: 로컬 파일 편집·로컬 커밋 등 git으로 가역(reset/revert/amend). 게이트 없이 진행 → report·digest로 사후 노출.
- **체크포인트 (반가역)**: main 머지·PR 오픈·스테이징 배포 → 1회 확인.
- **명시 게이트 (HITL)**: `force-push`·릴리스 태그·외부 발행·프로덕션 마이그레이션 등 **비가역만**. 보고 → 변경 시 재승인 → 명시 승인(답변≠승인).
매 커밋 승인은 고무도장을 낳아 정작 위험한 8%의 주의를 흐린다 — 그래서 가역 행위는 게이트하지 않는다.

**G. 생성물 재생성 규칙**: INDEX·대시보드는 손편집 안 함, `/sherpa-reindex`가 재생성. WORKFLOW(`.sherpa/workflow.md`)는 `/sherpa-init --upgrade`로만 재생성.

**H. lens 규칙** (§2.4): 그래프 사실은 **graph 파서가 결정론적으로 판정**(§4.3) — lens는 그 위에 `요약 문단 → 시각`만 얹는다(끊긴 스레드를 LLM이 판정하지 않음 → 환각 차단). 실제 docs grounding 강제·허구 금지, 노드는 원본 링크백. 출력은 `docs/lens/{view}/{NNNN}-{date}-{슬러그}.html` 스냅샷 커밋, sweep이 타입별 최신 N개만 유지. 사람 호출("길 잃었을 때 들여다보는" 도구).

**I. spec 드리프트 강제 (허점 3)**: spec "살아있는 단일 진실"은 last-verified 날짜만으론 stale을 못 막는다(수동 날짜는 신뢰만 가장). spec이 참조하는 **심볼·파일 경로·시그니처를 추출해 코드와 결정론적으로 diff** — spec이 가리키는 파일이 최근 커밋에서 바뀌었는데 spec은 안 바뀌었으면 셀프검증 **실패**(§4.3). last-verified는 보조 신호로 강등.

**J. 컨벤션 적용 (§2.6)**: 코드를 쓸 때 conventions.md(아키텍처 + 코드 규칙)를 따른다 — 기계화 가능 규칙(스타일·의존성 방향)은 린터/hook이 강제, 판단 규칙(아키텍처 구조·추상화·컴포넌트 분리)은 `/code-review`(§6-E)가 점검. 린터 없는 레포는 advisory로 후퇴(강제는 보너스). 팀·개인 conventions 둘 다 있으면 병합 적용(§2.6).

**K. 검증 합격선 — 게이트(Sherpa 불변) + 임계값(conventions 자유)** (§6-C step 5의 "통과" 정의): *무엇이 통과인가*를 둘로 가른다 — **반드시 통과할 결정론적 게이트는 Sherpa가 불변으로 강제**(hook/CI, §4.3), **얼마나의 임계값(숫자·심각도)은 conventions.md가 프로젝트별로 정함**(없으면 권고 기본값으로 후퇴). 숫자를 스펙에 박으면 공개 플러그인이 모든 레포에 안 맞는다.
- **불변 게이트 (미충족 = 완료 차단, 답변으로 무마 불가 — 기계 판정)**: 로직 = 테스트 **green**(실패 0) · `/code-review` **CRITICAL·HIGH 해소** · spec↔코드 **드리프트 0**(§6-I) · 산출물 트리거 전 행 처리(§6-A). 문서 = 셀프검증 6항목 전부.
- **프로젝트 임계값 (conventions.md — 자유, 없으면 권고로 후퇴)**: 테스트 커버리지 목표(예: 80%) · MEDIUM·LOW 이슈 처리 수위. *게이트는 강제, 임계값은 권고* — 임계값은 사람이 conventions로 조정.
- **바닥은 trivial 면제 불가**: 위 결정론 게이트 중 **링크·placeholder·드리프트는 사소한 변경이라도 항상 실행**(§6-D). 비싼 판단층(`/simplify`·`/code-review`·테스트 작성)은 면제 대상이고, **산출물 트리거(특히 report)도 trivial이면 의무 면제**(§6-A — plan 완료가 신호지 코드 변경이 아님). 면제가 안전한 전제가 바로 이 바닥이다.

**테스트 의무** (로직): 단위(도메인·UseCase) / 통합(어댑터·DB·외부) / 인수(컨트롤러~E2E). 사소 변경 면제.

**문서 셀프 검증 6항목** (①②⑤⑥은 스크립트로 기계화 — §4.3, LLM 자가점검 아님): ① placeholder/TODO 스캔(grep) ② 경로·링크 유효성(링크 체커) ③ 코드 대조 ④ 내부 일관성 ⑤ **spec↔코드 드리프트 검사**(심볼·경로 diff) — 통과 시 `last-verified`를 오늘로 갱신, 드리프트면 '재검증 필요'(archive 아님) ⑥ 산출물 트리거 표 전 행 처리(hook 교차검증).

## 7. 비목표 (YAGNI)

- SessionStart **로딩** 훅 (CLAUDE.md @import로 대체) — 단 *강제* 훅(PreToolUse·Stop·CI)은 채택(§4.3). 로딩≠강제.
- 레포별 WORKFLOW.md 손편집 (템플릿에서 init/upgrade).
- archive INDEX (묘지 — 빠른 조회 불필요).
- 도메인 특화 명령(`/api-spec` 등) — 범용 플러그인이라 제외, 필요 시 별도.
- lens 장식용 그림 — 텍스트 INDEX보다 빨리 이해되지 않는 뷰는 안 만든다. lens는 이해 가속 도구지 장식이 아님(요약 없는 그림 금지).

## 8. 미해결/후속

**해소됨 (rev 2)**: core-workflow↔workflow.md 분담(§4.1 — workflow.md=짧은 핵심, skill=상세) · lens 판정 휴리스틱(§4.3 graph 파서로 결정론화) · 자유입력 품질 가드(graph 사실 grounding) · NNNN 동시성(§2.1 머지 후 reindex 확정) · ADR supersede(§2.3) · 커밋 게이트 병목(§6-F 가역성 티어) · spec 드리프트(§6-I) · 트리비얼 LLM 판정(§6-D) · 에이전트 메모리(§2.5).

**남은 구현 플랜 과제** (아래 임계값·튜닝 노브 — lens N·archive 나이·재검증 임계값·active set 상한 — 은 전부 §4.5 *상시 로드 O(1)* 목적을 만족시키기 위한 손잡이다):
- graph 파서·드리프트 검사·트리거 hook의 **구체 구현**(언어·정적 파싱 범위·CI 통합)과 오탐/미탐 임계값.
- **graph 파서·질의 계층 구현**(스키마·질의는 §4.7 설계 완료): 정적 파싱·드리프트 주입 실제 구현 + 산출물 N 증가 시 상시-로드 토큰 *평탄성* 회귀 검사(§4.5). (1순위 — 사실 산출이자 컨텍스트 경계.)
- **트리비얼 판정 분류기**(§6-D): 코드용 **언어별 공백·부작용 인지** diff 분석 + 문서용 **prose-only 분류**(frontmatter·링크·코드펜스·anchor 제외) — 면제 경계를 결정론으로 구현(LLM 재량 배제).
- ~~NNNN 재할당 vs ULID/슬러그~~ → **해소(§2.8)**: 역참조 slug-stable·NNNN 표시용 → reindex가 링크 비건드림(슬러그 충돌만 디스앰비그).
- `.sherpa/progress.md` 스키마와 compaction 재주입 hook의 실제 동작 검증 + **팀/병렬 에이전트별 네임스페이스**(`progress/{agent}.md`) 분리·병합 메커니즘(§4.6).
- **팀 동시성(§4.6)** — 같은 파일 동시 편집의 머지/탐지 정책, `/sherpa-reindex` *단일 실행*(머지 시점) 직렬화 보장.
- **lens 수명 티어 구현(§2.4 결정 완료)** — 라이브 뷰(overview·threads·decisions) transient 경로·gitignore 메커니즘 + 동결 opt-in UX, durable(concept)·보존(custom) 커밋, 티어별 sweep N값.
- **`.graph.json` 신선도** — gitignore라 fresh clone·CI엔 부재 → 이를 읽는 hook이 선행 재생성 보장.
- **판단층 이식성** — `/simplify`·`/code-review`는 Claude Code 전용. 바닥(스크립트)=이식 가능, 판단=CC-bound임을 명시(타 하네스 후퇴 경로).
- **미설치자/CI 강제(H1, 보류)** — 강제 스크립트+CI를 레포에 vendoring할지(플러그인↔레포 경계) 추후 결정.
- lens 타입별 "최신 N개"의 N값, 타입별 archive 나이 임계값, spec 재검증 임계값(last-verified 나이 — *archive 아님, surface용*).
- 컨벤션(§2.6) — 언어별/아키텍처 린터 룰 매핑 카탈로그, 팀↔개인 레이어 병합·우선순위의 구체 메커니즘.
- 외부 스킬 문서(§4.4) — 정규화 매핑 카탈로그, `.sherpa/skill-docs.md` 등록 메커니즘, `_skills` 최종 네이밍 확정.
- 산출물 템플릿(§2.7) 실제 스캐폴드 작성(`templates/`) + 프론트매터 파서.
- 명령 프리픽스 풀네임(`/sherpa-*`) 확정 — 짧은 별칭 필요 시 추후.

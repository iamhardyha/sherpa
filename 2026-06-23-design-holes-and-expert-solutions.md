# Sherpa 설계 허점 분석 + 전문가 해법

> 리서치: 2026-06-23 · Sherpa 설계 스펙 **rev 2 근거 자료**
> 대상 스펙: [../specs/2026-06-22-sherpa-plugin-design.md](../specs/2026-06-22-sherpa-plugin-design.md)
> 방법: 비판적 리딩으로 허점 식별 → 유명 SW/AI 전문가·관행으로 해법. 모든 URL fetch 확인, 미검증은 **[미검증]** 표기.

---

## 허점 1 — NNNN 일련번호 경쟁 조건
**허점**: "다음 번호는 에이전트가 폴더 INDEX를 읽어 결정"(§2.1) — 동시 작업 시 같은 다음 번호 충돌.
**왜**: A·B 브랜치가 둘 다 `0031` 할당 → "안정적 참조 핸들"이 둘을 가리킴.
**해법**:
- MADR Issue #28 — https://github.com/adr/madr/issues/28 — 정확히 이 시나리오, lock 파일로 충돌 표면화(결정적 해법 아님을 인정).
- Nygard 원전 — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions — "sequentially and monotonically. Numbers will not be reused" — 단일 작성 흐름 전제.
- 분산 ID(ULID/UUIDv7) — https://byteaether.github.io/2025/uuid-vs-ulid-vs-integer-ids-a-technical-guide-for-modern-systems/ , https://www.authgear.com/post/time-sortable-identifiers-uuidv7-ulid-snowflake/ — 순차 정수는 쓰기 경쟁; 시간정렬 ID로 조율 없이 생성.
**적용**: 머지 후 reindex가 결정론적 재할당 + 역참조 갱신 (또는 날짜+슬러그/ULID). → **rev 2 §2.1 반영.**

## 허점 2 — "에이전트가 작업 끝에 트리거 표를 훑는다"의 신뢰성
**허점**: §6-A가 LLM의 프롬프트 준수에 의존. 결정론적 강제 없음.
**왜**: 압축·새 세션·"자명한 다음 단계"에서 표 점검 건너뜀 → spec/report 누락.
**해법**:
- Simon Willison "lethal trifecta" — https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ — 프롬프트 보호는 "확률적이지 보장이 아니다."
- Karpathy "2025 LLM Year in Review" — https://karpathy.bearblog.dev/year-in-review-2025/ — 능력이 jagged, 규칙 준수 가정 불가. (X 트윗 원문 **[미검증]** — 402 차단, 블로그가 1차 출처.)
- Zarar Siddiqi "Agent Hooks" — https://zarar.dev/agent-hooks-deterministic-guardrails-for-ai-generated-code/ — 규칙을 결정론적 hook으로(PreToolUse 차단 / Stop hook).
- chengkai "Guardrails Into the Repo" — https://dev.to/wilddog64/i-built-the-guardrails-into-the-repo-not-the-prompt-4n3l — "프롬프트는 핸드오프에서 실패."
- Anthropic tool_choice / Structured outputs — https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/implement-tool-use , https://platform.claude.com/docs/en/build-with-claude/structured-outputs — 도구 호출·형식 준수를 디코딩 단계에서 보장.
**적용**: 트리거 적용을 Stop/PostToolUse hook으로 강제. → **rev 2 §4.3.**

## 허점 3 — spec "살아있는 단일 진실"의 stale
**허점**: 코드 변경 시 spec 갱신 누락. last-verified 날짜만으론 못 막음.
**해법**:
- Cyrille Martraire "Living Documentation" — https://www.infoq.com/articles/book-review-living-documentation/ , https://github.com/cyriux/livingdocumentation-thebook — 지식은 소스·테스트에 이미 존재, 자동 추출·대조. (livingdocumentation.net **[사망]** — repo·InfoQ로 대체.)
- JetBrains Writerside — https://blog.jetbrains.com/writerside/2022/01/the-holy-grail-of-always-up-to-date-documentation/ — 수동 "review by 날짜"는 실패; 소스 직접 참조 + webhook.
- Gojko Adzic "Specification by Example" — https://gojko.net/books/specification-by-example/
- API drift — https://totalshiftleft.ai/blog/api-schema-validation-catching-drift — "파괴적 변경 60–70%가 리뷰 통과", 자동 대조가 사람 리뷰를 이김.
**적용**: spec `refs`를 코드와 결정론적 diff, 불일치 시 셀프검증 실패. → **rev 2 §6-I.** (rev 5에서 stale=재검증/retire=archive 2축 분리 보정.)

## 허점 4 — lens "끊긴 스레드"를 LLM이 판정
**허점**: 본질이 결정론적 그래프인데 확률적 모델이 판정 → 누락·환각.
**해법**:
- markdown-link-check — https://github.com/tcort/markdown-link-check , linkchecker-markdown — https://github.com/scivision/linkchecker-markdown — 참조 무결성은 정적 파싱 표준.
- GitGuardian — https://blog.gitguardian.com/automated-guard-rails-for-vibe-coding/ — "이진 보증을 줘야 한다."
**적용**: graph 파서가 사실 산출, LLM은 시각화만. → **rev 2 §2.4·§4.3.**

## 허점 5 — 휴먼 승인 게이트의 병목
**허점**: 모든 커밋 승인 → 고무도장화.
**해법**:
- Anthropic "Measuring AI Agent Autonomy" — https://www.anthropic.com/research/measuring-agent-autonomy — "효과적 감독은 모든 행동 승인이 아니라 중요할 때 개입할 위치." 행동의 **0.8%만 비가역**.
- Anthropic "Building Effective Agents" — https://www.anthropic.com/research/building-effective-agents — 체크포인트에서만 피드백.
- Antigravity Lab "Delegate the Undoable" — https://antigravitylab.net/en/articles/agents/antigravity-agent-reversibility-tiered-autonomy-architecture — 기준을 "되돌릴 수 있는가"로. 3티어(Auto ~70% / Checkpoint ~22% / Irreversible ~8%).
- "Approval Fatigue" — https://aipatternbook.com/approval-fatigue — "50번 OK면 51번째도 안전해 보인다."
- Bainbridge "Ironies of Automation" (1983) — https://ckrybus.com/static/papers/Bainbridge_1983_Automatica.pdf
- Credo AI HOTL — https://www.credo.ai/glossary/human-on-the-loop ; NIST AI RMF — https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf (HTTP 200 확인, 바이너리라 인용문 추출 불가).
**적용**: 가역성 티어 — 가역=HOTL 자동, 비가역=HITL 게이트. → **rev 2 §6-F.**

## 허점 6 — append-only ADR의 폐기(superseded) 추적
**허점**: 번복된 ADR을 추적하는 명세 없음 → 폐기 결정을 현행으로 오해.
**해법**:
- Nygard 원전 — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions — "번복되면 옛것을 남기되 superseded로 표시." Status가 5요소 중 하나.
- MADR — https://adr.github.io/madr/ , https://github.com/adr/madr — status에 `superseded by ADR-0123`.
- Olaf Zimmermann — https://ozimmer.ch/practices/2022/11/22/MADRTemplatePrimer.html — `proposed|accepted|deprecated|superseded by`.
**적용**: ADR Status + 양방향 supersede 링크. → **rev 2 §2.3.**

## 허점 7 — lens 스냅샷 묘지 누적 + 환각 박제
**허점**: 날짜 스냅샷 커밋이 쌓이고, grounding 깨지면 환각 시각화가 영구 박제.
**해법**: 허점 2·4의 결정론 데이터 분리 + GitGuardian "이진 보증". 재생성 뷰로 두거나 타입별 최신 N.
**적용**: graph 사실 분리 + sweep 타입별 최신 N. → **rev 2 §2.4.**

## 허점 8 — "트리비얼" 판정 주체가 LLM
**허점**: §6-D "동작 바뀌는가"를 LLM이 판정 → 버그를 "포맷"으로 오분류하면 review/test 통째 건너뜀.
**해법**: GitGuardian/Siddiqi 결정론 게이트 — 코드 변경 감지 시 기본 "리뷰 필요", 면제는 diff(주석/공백)로만.
**적용**: opt-out + diff 결정론 판정. → **rev 2 §6-D.**

## 허점 9 — `.sherpa/workflow.md`가 @import에만 의존 (강제력 0)
**허점**: @import는 텍스트를 컨텍스트에 넣을 뿐 준수 강제 안 함.
**해법**: chengkai — https://dev.to/wilddog64/i-built-the-guardrails-into-the-repo-not-the-prompt-4n3l — 일관성의 마지막 방어선은 hook/CI.
**적용**: 핵심 불변식을 hook/CI로 이중화. → **rev 2 §4.3.**

---

## 우선순위 표

| # | 허점 | 심각도 | 수정 난이도 |
|---|---|---|---|
| 2 | 트리거 LLM 신뢰성 | **높음** | 중 |
| 9 | workflow 강제력 0 | **높음** | 중 |
| 3 | spec stale | **높음** | 높음 |
| 1 | NNNN 동시성 | 중 | 낮음 |
| 6 | ADR superseded | 중 | 낮음 |
| 4 | lens 그래프 LLM 판정 | 중 | 중 |
| 5 | 커밋 게이트 병목 | 중 | 낮음 |
| 8 | 트리비얼 LLM 판정 | 중 | 낮음 |
| 7 | lens 묘지/환각 | 낮음 | 낮음 |

---

## 핵심 한 줄
검증된 출처 공통 결론: **LLM 지시 준수는 확률적이며 핸드오프·압축에서 깨진다**(Willison·Karpathy·Siddiqi·chengkai). 신뢰성은 프롬프트가 아니라 *프롬프트 밖 결정론적 강제*(hook/CI·제약 디코딩·정적 파싱)에서 온다. Sherpa 허점 다수(2·3·4·8·9)가 "에이전트가 훑고/판단하고/기억한다"는 한 뿌리 → 거버넌스 불변식을 hook/정적검증으로 이전하는 것이 최대 레버리지.

**검증 메모**: 인용 URL은 모두 fetch 확인. **[미검증]** — Karpathy X 트윗 원문(402, 블로그가 대체), NIST PDF 본문(바이너리), livingdocumentation.net(사망 — repo/InfoQ 대체).

# {프로젝트명}

<!-- 얇은 포인터 (≤200줄, §4.1·§4.5). 상세 절차는 core-workflow 스킬로 progressive disclosure.
     @import는 컨텍스트를 줄이지 않으므로(Anthropic) 여기엔 핵심만 둔다. -->

@.sherpa/workflow.md
@.sherpa/project-context.md
@.sherpa/conventions.md

## 핵심 규칙 (요약 — 정본은 위 import + core-workflow 스킬)

- **산출물은 AI가 관리한다.** 작업하면 §2 5종(adr·plan·spec·report·archive) 트리거를 적용한다.
- **불변 작업 순서**: plan → 작업 → 테스트 → 산출물 트리거 → 검증 → 보고 → 가역성 게이트.
- **검증**: 문서=셀프검증 6항목 / 로직=`/simplify` → `/code-review low`(위험·복잡=medium) + 테스트.
- **게이트는 가역성 기준**: 로컬 작업은 자동, 비가역(force-push·릴리스·발행)만 사람 승인.
- 막히면 `.sherpa/progress.md`를 먼저 읽어 상태를 복원한다.
- 상세 절차가 필요하면 **core-workflow 스킬**을 연다.

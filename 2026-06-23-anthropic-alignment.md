# Sherpa 설계 ↔ Anthropic 공개 방향 정합성 검증

> 리서치: 2026-06-23 · Sherpa 설계 스펙 **rev 2 근거 자료**
> 대상 스펙: [../specs/2026-06-22-sherpa-plugin-design.md](../specs/2026-06-22-sherpa-plugin-design.md)
> 방법: Anthropic 1차 자료를 실제 fetch 후 verbatim 인용 대조. 추론은 "추정", 미발견은 "NOT ADDRESSED" 표기.

---

## 0. 검증에 사용한 1차 출처 (모두 실제 fetch 확인)

| 약칭 | 제목 | URL |
|---|---|---|
| BEA | Building effective agents | https://www.anthropic.com/engineering/building-effective-agents |
| CTX | Effective context engineering for AI agents | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| HARNESS | Harness design for long-running application development | https://www.anthropic.com/engineering/harness-design-long-running-apps |
| LONGRUN | Effective harnesses for long-running agents | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| MEM-BLOG | Context management (memory tool 발표) | https://claude.com/blog/context-management |
| MEM-DOC | Memory tool reference | https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool |
| CTX-EDIT | Context editing docs | https://platform.claude.com/docs/en/docs/build-with-claude/context-editing |
| CC-BP | Claude Code best practices | https://code.claude.com/docs/en/best-practices |
| CC-MEM | CLAUDE.md / memory 문서 | https://code.claude.com/docs/en/memory |
| CC-PLUG | Plugins 문서 | https://code.claude.com/docs/en/plugins |
| CC-SKILL | Agent Skills overview | https://platform.claude.com/docs/en/docs/agents-and-tools/agent-skills/overview |
| CC-SUB | Subagents 문서 | https://code.claude.com/docs/en/sub-agents |
| CC-PERM | Permissions 문서 | https://code.claude.com/docs/en/permissions |

---

## 1. 정합성 높은 부분

| Sherpa 결정 | Anthropic 근거 (verbatim) | 출처 |
|---|---|---|
| 거버넌스 = git 커밋, 플러그인은 "런타임 의존 아닌 설치·유지보수 도구" (§4.1) | "Check CLAUDE.md into git so your team can contribute. The file compounds in value over time." / 프로젝트 CLAUDE.md는 "Shared with: Team members via source control" | CC-BP, CC-MEM |
| 루트 CLAUDE.md가 @import로 workflow를 항상 로드 (§4.1) | "CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files are expanded and loaded into context at launch... maximum depth of four hops." | CC-MEM |
| SessionStart 훅 의도적 회피 — @import가 네이티브 (§4.1, §7) | "Both are loaded at the start of every conversation." 훅은 "must happen every time with zero exceptions"인 결정적 동작용 | CC-MEM, CC-BP |
| 플러그인이 commands + skills 번들 (§5) | "Plugins bundle skills, hooks, subagents, and MCP servers into a single installable unit." | CC-BP, CC-PLUG |
| core-workflow / lens 스킬 = 필요 시 펼치는 상세 절차 (§5) | "progressive disclosure: Claude loads information in stages as needed, rather than consuming context upfront." | CC-SKILL, CC-BP |
| lens = docs 읽어 증류 + 시각, 노드→원본 링크백 (§2.4) | 서브에이전트 "returns only a condensed, distilled summary"; just-in-time는 "lightweight identifiers (file paths...)" | CTX |
| lens 데이터 규칙 = 실제 docs 읽어 생성, 허구 금지 (§2.4, §6-H) | 에이전트는 매 단계 "ground truth from the environment" 확보 | BEA |
| 커밋 게이트 = harness 강제, "답변≠승인" (§6-F) | "Bash commands / File modification → Approval required: Yes"; "Rules are evaluated in order: deny, then ask, then allow." | CC-PERM |
| 작업→테스트→검증→보고→커밋, "완료는 end-to-end 검증 후" (§6-C) | "Only mark a feature complete after end-to-end verification confirms it works, not just after the code is written." | MEM-DOC, LONGRUN |
| 트리비얼 정의를 "동작이 바뀌는가"로 날카롭게 (§6-D) | 지침은 "specific enough to verify" | CC-MEM |
| INDEX·대시보드 = 기계 재생성 (§3, §6-G) | "Folder hierarchies, naming conventions, and timestamps all provide important signals" | CTX |
| adr append-only (§2) | 장기 세션은 "progress log", git history 등 append 가능한 durable artifact로 상태 복원 | LONGRUN |

**핵심**: Sherpa의 4대 기둥(커밋된 거버넌스 / @import / progressive-disclosure 스킬 / 승인 게이트)은 Anthropic 공개 권장과 **결이 거의 그대로 일치**.

---

## 2. 어긋나거나 긴장이 있는 부분

### 2-1. @import는 컨텍스트를 절약하지 않는다 — workflow.md 비대화 시 충돌 ⚠️ (가장 중요)
- 스펙: 루트 CLAUDE.md가 `@.sherpa/workflow.md`(§6 전체)를 "항상 로드"하는 것이 일관성의 원천.
- Anthropic: **"Splitting into `@path` imports helps organization but does not reduce context, since imported files load at launch."** / **"target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."** / "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" [CC-MEM, CC-BP]
- → **반영**: rev 2에서 workflow.md=짧은 핵심, 상세는 core-workflow 스킬로 분담(§4.1).

### 2-2. "AI가 항상 관리" 톤 vs 단순성 원칙
- Anthropic: "find the simplest solution possible... This might mean not building agentic systems at all." [BEA]
- 긴장: 모든 작업에 5종+lens 상시 부과는 단순 작업에선 무거울 수 있음. 트리비얼 면제(§6-D)·YAGNI(§7)가 완충. (정도의 문제 — 명백한 위반 아님, **추정**.)

### 2-3. lens HTML 스냅샷 커밋 vs "뷰는 손 안 댐"
- Anthropic은 타임스탬프 스냅샷 자체는 지지("timestamps... provide important signals" [CTX]). 충돌은 Anthropic과가 아니라 **스펙 내부 분류 모호성**(lens가 뷰이자 산출물). → rev 2에서 graph 사실 분리·날짜 스냅샷으로 정리.

### 2-4. lens가 "사람 호출 전용"
- Anthropic 노트테이킹은 "regularly writes notes" — 정기·자동 권장 [CTX]. lens는 "사람용 조망 뷰"라 수동 트리거가 곧 위반은 아님. (끊긴 스레드 감지는 정기 자동 시 더 살아남 — **추정**.)

---

## 3. Anthropic이 강조하지만 (당시) 스펙에 빠졌던 것

| 빠진 요소 | Anthropic 근거 | 출처 | 처리 |
|---|---|---|---|
| Context compaction / editing | "Compaction is... summarizing... reinitiating a new context window" / "Context editing automatically clears stale tool calls" | CTX, MEM-BLOG, CTX-EDIT | rev 2 §2.5/§4.3 compaction 재주입 |
| 파일 기반 외부 메모리 / progress | "NOTES.md file" / claude-progress.txt "lets a fresh agent recover state fast" | CTX, LONGRUN, MEM-DOC | rev 2 §2.5 progress.md |
| 평가(eval) | "every component in a harness encodes an assumption... worth stress testing" | HARNESS, BEA | 미반영 (주의: "build evals first" 명시 문장은 **NOT ADDRESSED** — 약한 추론) |
| "right altitude" 원칙 | "The right altitude is the Goldilocks zone..." | CTX | §6 규칙 고도 균형 점검 권장 |
| 에이전트 자율성 범위 명시 | "Agents' autonomy makes them ideal for scaling tasks in trusted environments." | BEA, CC-PERM | rev 2 §6-F 가역성 티어 |
| `disable-model-invocation` (부작용 명령) | "Use `disable-model-invocation: true` for workflows with side effects" | CC-BP | rev 2 §5.1 반영 |

---

## 4. 종합

- **정합성 총평: 높음.** 4대 기둥이 verbatim 수준으로 일치.
- **가장 실질적 리스크**: §2-1 — @import 비대화 경고. → workflow 짧은 핵심 + skill 분담으로 해소.
- **가장 큰 누락**: 에이전트 작업 메모리 + compaction. → §2.5 progress.md로 추가.
- **정직성**: "eval 먼저 만들라"는 명시 문장은 fetch 범위에서 미발견(NOT ADDRESSED) — eval 평가는 "stress-test" 권고로부터의 약한 추론. "single source of truth"도 CTX 본문에서 직접 다루지 않음 — spec의 "살아있는 단일 진실"은 일반 원칙과의 정합으로만 평가.

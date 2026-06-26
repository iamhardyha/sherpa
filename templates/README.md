# templates/ — 산출물 스캐폴드

`/sherpa-init`이 `docs/` 5종을 찍을 때 쓰는 스캐폴드. 각 템플릿의 **프론트매터·섹션은 §2.7 필수 항목 + §2.8 deterministic-parse 계약을 그대로 박은 것** — 이게 graph 파서·드리프트·sweep가 읽는 메타데이터다. 임의 변형 시 결정론 바닥이 깨진다.

## 산출물 템플릿 (프론트매터 손작성)

| 파일 | 산출물 | 핵심 메타데이터 |
|---|---|---|
| `adr.md` | 결정 (왜) | `status` enum · supersede 양방향 링크 |
| `plan.md` | 계획 (무엇을 할) | `status` enum · `## 작업` 체크박스(진척도 파싱) · `## 변경 이력` |
| `spec.md` | 살아있는 진실 (지금 어떻게) | `refs`(드리프트 입력) · `last-verified` |
| `report.md` | 결과 (무엇을 했) | `plan`(역참조 — done 파생 입력) |

## 이 폴더에 *없는* 것

- **lens** — HTML 생성물이라 손작성 프론트매터가 없다(§2.7). 뷰 템플릿(요약 블록 → 시각)은 `skills/lens/`에 둔다.
- **거버넌스 템플릿** (`workflow.md`·`project-context.md`·`conventions.md`·`progress.md`·`CLAUDE.md`) — `/sherpa-init`이 찍는 `.sherpa/` 파일들. 별도 배치(다음 작업).

## 규칙

- 식별자 = `{date}-{slug}` (영구), `NNNN`은 표시용 (§2.8). 역참조는 전부 `{slug}`로.
- `{...}` placeholder와 미작성 섹션은 셀프검증 ①(grep)이 잡는다(§6).
- 상태 전이는 대부분 graph가 링크에서 파생 — `abandoned`·`paused`·supersede만 명시(§2.2).

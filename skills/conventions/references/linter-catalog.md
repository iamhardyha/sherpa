# 린터 매핑 카탈로그 — 언어별 코드 스타일 + 아키텍처 린터

`/sherpa-conventions`가 레포를 보고 매핑할 때 참고. **있으면 그 룰로 강제, 없으면 제안/advisory 후퇴**(§2.6). 정본 규칙은 §2.6·§6-J.

## 두 축 — 스타일 린터 + 아키텍처 린터

| 언어/생태계 | 코드 스타일 (포맷·네이밍·약어) | 아키텍처 (의존성 방향·레이어 경계) |
|---|---|---|
| **JS/TS** | ESLint, Prettier, Biome | dependency-cruiser, eslint-plugin-boundaries |
| **Python** | ruff, flake8, black, isort | import-linter |
| **Java** | Checkstyle, Spotless, PMD | ArchUnit |
| **Kotlin** | ktlint, detekt | Konsist, ArchUnit |
| **Go** | gofmt, golangci-lint, revive | go-arch-lint, depguard(golangci) |
| **Rust** | rustfmt, clippy | (clippy 일부 — 경계는 크레이트 분리로) |
| **C#/.NET** | dotnet format, StyleCop | NetArchTest, ArchUnitNET |
| **Ruby** | RuboCop, Standard | packwerk |
| **PHP** | PHP_CodeSniffer, PHP-CS-Fixer | Deptrac |
| **Swift** | SwiftLint, swift-format | (모듈 경계는 SPM 타겟으로) |

## 매핑 원칙

- **탐지 우선**: 레포에 이미 설정된 린터(`.eslintrc`·`pyproject.toml`·`build.gradle`…)를 먼저 찾아 그 룰을 쓴다 — 새로 강요하지 않는다.
- **아키텍처 = 기계화 가능**: "의존성 방향·레이어 경계"는 추상적 advisory가 아니라 위 아키텍처 린터로 **강제 가능**(§2.6 핵심). domain→infra 역의존 금지 같은 규칙을 룰로 박는다.
- **hook/CI 공용**: 매핑된 룰은 커밋 전 hook과 CI가 같이 실행(§4.3). 로컬·원격 동일.
- **후퇴 경로**: 린터 없음 → ① 가벼우면 "깔까요?" 제안 ② 아니면 advisory + `/code-review`. 강제는 보너스.

## 판단 규칙은 매핑 대상 아님

추상화 수준·컴포넌트 분리 기준·"클린코드"는 어떤 린터로도 못 잡는다 → conventions.md advisory + `/code-review`(§6-E)가 사람 판단으로 점검. 카탈로그에 억지로 넣지 않는다.

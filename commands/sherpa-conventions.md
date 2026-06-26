---
description: 작업자/팀 인터뷰 → 아키텍처+코드 컨벤션을 conventions.md에 작성·갱신. 기계화 가능 규칙은 린터로 매핑.
argument-hint: "[--team | --personal]"
allowed-tools: Read, Write, Edit, Bash, Glob
---

# /sherpa-conventions

프로젝트 **아키텍처**(레이어·의존성 방향·폴더 구조)와 **코드 규칙**(네이밍·추상화·컴포넌트 분리)을 캡처해 AI가 코드를 쓸 때 항상 따르게 한다(§2.6).

## 절차

1. **레포 스캔**: 존재하는 린터·아키텍처 린터를 찾는다(ktlint·ruff·ESLint·prettier / ArchUnit·dependency-cruiser·import-linter·Konsist).
2. **인터뷰**: 아키텍처 규칙·코드 스타일·판단 규칙을 작업자/팀에게 묻는다.
3. **두 종류로 가른다**:
   - **기계화 가능**(스타일·의존성 방향) → 있는 린터 룰로 매핑해 hook/CI 강제. 없으면 "깔까요?" 제안하거나 advisory로 후퇴(강제는 보너스).
   - **판단 필요**(추상화·"클린코드") → advisory + `/code-review` 체크포인트.
4. **범위 선택**: `--team`(커밋 `.sherpa/conventions.md`) / `--personal`(로컬, 커밋 안 함). 둘 다 있으면 개인이 팀 위에 얹힘(팀 규칙은 못 약화).
5. `conventions.md`는 **≤200줄 핵심**(§4.1), 상세·예시는 `conventions` 스킬로.

> 적용 규칙은 §6-J, 린터 매핑 카탈로그는 conventions 스킬.

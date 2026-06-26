---
description: 레포를 Sherpa 워크플로우로 1회 초기화 — .sherpa/ 거버넌스 + docs/ 5종 + 뷰 스캐폴드. --upgrade로 거버넌스 재생성.
argument-hint: "[--upgrade] [--stream]"
allowed-tools: Read, Write, Edit, Bash, Glob
disable-model-invocation: true
---

# /sherpa-init

레포를 Sherpa 구조로 초기화한다. **부작용이 크므로 수동 전용**(모델 자동 호출 금지).

## 절차

1. **레포 파악**: 언어·프레임워크·린터 존재를 스캔(`project-context.md`·`conventions.md` 채울 근거).
2. **stream 선택**(§4.2): 기본=stream 없음 → `docs/{artifact}/`. 복합 도메인(서버 등)이면 `--stream` → `docs/{stream}/{artifact}/`. 모호하면 사람에게 묻는다.
3. **거버넌스 생성** — `templates/governance/`에서 찍는다:
   - 루트 `CLAUDE.md`, `.sherpa/{workflow,project-context,conventions,progress}.md`, `.sherpa/skill-docs.md`.
   - project-context는 1번 스캔 결과로 초안, 사람이 검토.
4. **docs/ 스캐폴드**: `docs/{adr,plan,spec,report,lens,archive}/` + 각 INDEX(뷰) + `docs/README.md` 대시보드. lens는 타입별 폴더(overview·threads·decisions·concept·custom).
5. **.gitignore**: `docs/.graph.json`(재생성물 §3) 추가.
6. **보고 → 커밋**(가역이라 자동, §6-F). 컨벤션은 후속 `/sherpa-conventions`로 채우라고 안내.

## --upgrade

거버넌스 파일을 템플릿 최신으로 재생성한다. **덮어쓰기 전 git diff를 사람이 검토**(레포가 소유한 변경을 날리지 않게). workflow.md는 이 경로로만 재생성(§6-G).

> 산출물 템플릿·계약은 §2.7·§2.8, 거버넌스 구조는 §4.

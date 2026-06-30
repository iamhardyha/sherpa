---
description: 레포를 Sherpa 워크플로우로 1회 초기화 — .sherpa/ 거버넌스 + docs/ 5종 + 뷰 스캐폴드. --upgrade로 거버넌스 재생성.
argument-hint: "[--upgrade] [--stream]"
allowed-tools: Read, Write, Edit, Bash, Glob
disable-model-invocation: true
---

# /sherpa-init

레포를 Sherpa 구조로 초기화한다. **부작용이 크므로 수동 전용**(모델 자동 호출 금지).

## 절차

스캐폴드는 **결정론적 스크립트**가 만든다(프롬프트로 찍지 않음 — §4.3). 에이전트는 호출·인터뷰·보고만.

1. **stream 선택**(§4.2): 기본=stream 없음 → `docs/{artifact}/`. 복합 도메인(서버 등)이면 stream 이름 → `docs/{stream}/{artifact}/`. 모호하면 사람에게 묻는다.
2. **스캐폴드 실행** — 거버넌스(`templates/governance/` → `CLAUDE.md`·`.sherpa/*`) + `docs/` 구조(산출물 5종 + lens 타입별 + archive)를 한 번에 생성. 기존 파일은 보호(덮어쓰지 않음):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/dist/init/init.js" [stream]
   ```
3. **뷰 생성** — INDEX·대시보드·graph를 재생성:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/dist/graph/reindex.js" docs
   ```
4. **project-context 초안**: 레포 언어·프레임워크·구조를 스캔해 `.sherpa/project-context.md`를 채우고 사람이 검토.
5. **보고 → 커밋**(가역이라 자동, §6-F). 컨벤션은 후속 `/sherpa-conventions`로 채우라고 안내.

## --upgrade

거버넌스 파일을 템플릿 최신으로 재생성한다. **덮어쓰기 전 git diff를 사람이 검토**(레포가 소유한 변경을 날리지 않게). workflow.md는 이 경로로만 재생성(§6-G).

> 산출물 템플릿·계약은 §2.7·§2.8, 거버넌스 구조는 §4.

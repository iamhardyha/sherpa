---
description: INDEX ×5 + 대시보드 + graph.json을 폴더 스캔으로 재생성 — 손편집 누락 방지. NNNN 확정.
allowed-tools: Read, Write, Edit, Bash, Glob
---

# /sherpa-reindex

뷰(재생성물 §3)를 폴더 사실로부터 다시 만든다. **손편집하지 않는 생성물 전용** — 사람/에이전트 모두 호출 가능.

## 절차 (단일 실행 — 머지 시점 직렬화 §8)

1. **폴더 스캔**: `docs/{adr,plan,spec,report,lens}/`의 프론트매터·역참조를 §2.8 계약으로 파싱.
2. **graph 파서**: 역참조 링크를 정적 파싱해 `docs/.graph.json` 산출(노드·엣지·파생 사실 §4.7). 드리프트 체커 결과 주입.
3. **NNNN 확정**(§2.1): 폴더 INDEX 기준 결정론 재할당. **역참조는 slug 기반이라 링크는 안 건드린다**(§2.8). 슬러그 충돌만 디스앰비그(그 인바운드 링크만 갱신).
4. **INDEX ×5 + `docs/README.md` 대시보드** 재생성. `_skills/*`는 "외부 스킬 문서 N개·마지막 수정일"로 노출(§4.4).
5. 결과 보고(가역 → 자동 커밋 §6-F).

> 식별·역참조 계약은 §2.8, graph 스키마는 §4.7. graph.json은 gitignore(재생성물).

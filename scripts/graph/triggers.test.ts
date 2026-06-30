import { test, expect } from 'vitest';
import { buildGraph } from './graph.js';
import { checkTriggers } from './triggers.js';

// §6-A: 산출물 트리거 두 갈래 — spec=드리프트, report=plan완료+report없음. 미충족=완료 차단.

// report 트리거: 태스크 전부 완료인데 report 역참조 없음 → report 작성 필요
test('plan 태스크 전부 완료인데 report 없으면 report-trigger 위반', () => {
  const graph = buildGraph([
    {
      path: 'docs/plan/0001-2026-06-25-graph.md',
      content: '---\nstatus: active\ndate: 2026-06-25\n---\n## 작업\n- [x] 1. a — [x] 구현 [x] 테스트',
    },
  ]);
  expect(checkTriggers(graph)).toContainEqual({ kind: 'report-trigger', plan: '2026-06-25-graph' });
});

// report가 있으면 위반 아님
test('plan 완료 + report 있으면 report-trigger 아님', () => {
  const graph = buildGraph([
    {
      path: 'docs/plan/0001-2026-06-25-graph.md',
      content: '---\nstatus: active\ndate: 2026-06-25\n---\n## 작업\n- [x] 1. a — [x] 구현 [x] 테스트',
    },
    {
      path: 'docs/report/0002-2026-06-26-graph.md',
      content: '---\ndate: 2026-06-26\nplan: 2026-06-25-graph\n---\n# 완료',
    },
  ]);
  expect(checkTriggers(graph)).not.toContainEqual({ kind: 'report-trigger', plan: '2026-06-25-graph' });
});

// spec 트리거 = 드리프트 사실(git 연동 시 주입) → spec-trigger 위반
test('drift 사실이 있으면 spec-trigger 위반', () => {
  const graph = { nodes: [], edges: [], facts: [{ kind: 'drift', spec: 'auth/token' }] };
  expect(checkTriggers(graph)).toContainEqual({ kind: 'spec-trigger', spec: 'auth/token' });
});

// 미완 태스크면 위반 아님(아직 작업 중)
test('태스크 미완이면 report-trigger 아님', () => {
  const graph = buildGraph([
    {
      path: 'docs/plan/0001-2026-06-25-graph.md',
      content: '---\nstatus: active\ndate: 2026-06-25\n---\n## 작업\n- [ ] 1. a — [ ] 구현 [ ] 테스트',
    },
  ]);
  expect(checkTriggers(graph)).toEqual([]);
});

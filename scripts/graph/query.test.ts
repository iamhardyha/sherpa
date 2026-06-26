import { test, expect } from 'vitest';
import { buildGraph } from './graph.js';
import { factsByKind, overview } from './query.js';

const ENTRIES = [
  {
    path: 'docs/plan/0001-2026-06-01-forgotten.md',
    content: '---\nstatus: active\ndate: 2026-06-01\n---\n## 작업',
  },
  {
    path: 'docs/adr/0002-2026-06-26-cache.md',
    content: '---\nstatus: proposed\ndate: 2026-06-26\n---\n# 제안',
  },
];

// §4.5·§4.7: 전체 graph가 아니라 명명 슬라이스만 — 산출물 N과 무관하게 일정
test('factsByKind는 해당 종류 사실만 슬라이스한다', () => {
  const graph = buildGraph(ENTRIES, { today: '2026-06-26', staleDays: 14 });
  expect(factsByKind(graph, 'active-stale')).toEqual([
    { kind: 'active-stale', plan: '2026-06-01-forgotten' },
  ]);
});

// §4.7 overview: 카운트 + 주의 항목 — /sherpa-status·lens overview가 소비
test('overview는 타입 카운트와 주의 항목 수를 요약한다', () => {
  const graph = buildGraph(ENTRIES, { today: '2026-06-26', staleDays: 14 });
  expect(overview(graph)).toEqual({
    counts: { plan: 1, adr: 1 },
    attention: { 'active-stale': 1, 'unhandled-decision': 1 },
  });
});

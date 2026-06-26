import { test, expect } from 'vitest';
import { buildGraph } from './graph.js';
import { renderDashboard, renderIndex } from './render.js';

// §5.1 INDEX: 타입별 산출물 목록 (다른 타입은 제외)
test('INDEX는 해당 타입 산출물만 목록으로 렌더한다', () => {
  const graph = buildGraph([
    {
      path: 'docs/adr/0001-2026-06-20-use-node.md',
      content: '---\nstatus: accepted\ndate: 2026-06-20\n---\n# Node',
    },
    {
      path: 'docs/adr/0002-2026-06-26-cache.md',
      content: '---\nstatus: proposed\ndate: 2026-06-26\n---\n# Cache',
    },
    {
      path: 'docs/plan/0003-2026-06-26-other.md',
      content: '---\nstatus: active\ndate: 2026-06-26\n---\n## 작업',
    },
  ]);
  const md = renderIndex(graph, 'adr');

  expect(md).toContain('use-node');
  expect(md).toContain('cache');
  expect(md).toContain('accepted');
  expect(md).not.toContain('other'); // plan은 제외
});

// §5.1 /sherpa-status·대시보드: graph 사실 → 마크다운 (진행 중·주의·카운트)
test('대시보드는 진행 중 plan·주의 항목·카운트를 렌더한다', () => {
  const graph = buildGraph(
    [
      {
        path: 'docs/plan/0001-2026-06-01-forgotten.md',
        content: '---\nstatus: active\ndate: 2026-06-01\n---\n## 작업\n- [x] 1. 노드 — [x] 구현 [ ] 테스트',
      },
      {
        path: 'docs/adr/0002-2026-06-26-cache.md',
        content: '---\nstatus: proposed\ndate: 2026-06-26\n---\n# 제안',
      },
    ],
    { today: '2026-06-26', staleDays: 14 },
  );
  const md = renderDashboard(graph);

  expect(md).toContain('2026-06-01-forgotten'); // 진행 중 plan
  expect(md).toContain('구현 1/1'); // 진척도
  expect(md).toContain('active-stale'); // 주의(오래된 active+report없음)
  expect(md).toContain('unhandled-decision'); // 주의(proposed ADR)
});

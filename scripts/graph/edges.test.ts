import { test, expect } from 'vitest';
import { parseArtifact } from './node.js';
import { buildEdges } from './edges.js';

// §4.7: report→plan 역참조에서 plan-report 엣지(typed·directed)
test('report의 plan 역참조에서 plan-report 엣지를 만든다', () => {
  const plan = parseArtifact(
    'docs/plan/0001-2026-06-25-graph-parser.md',
    `---\nstatus: active\ndate: 2026-06-25\n---\n## 작업`,
  );
  const report = parseArtifact(
    'docs/report/0002-2026-06-26-graph.md',
    `---\ndate: 2026-06-26\nplan: 2026-06-25-graph-parser\n---\n# 리포트`,
  );
  expect(buildEdges([plan, report])).toEqual([
    { type: 'plan-report', from: '2026-06-26-graph', to: '2026-06-25-graph-parser' },
  ]);
});

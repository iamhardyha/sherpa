import { test, expect } from 'vitest';
import { buildGraph, serializeGraph } from './graph.js';

// §3·§4.7: graph를 결정론적 JSON으로 직렬화 (.graph.json — 재생성물, gitignore)
test('graph를 결정론적 JSON 문자열로 직렬화한다', () => {
  const graph = buildGraph([
    {
      path: 'docs/adr/0001-2026-06-26-use-node-runtime.md',
      content: '---\nstatus: accepted\ndate: 2026-06-26\n---\n# 결정',
    },
  ]);
  const json = serializeGraph(graph);
  expect(JSON.parse(json).nodes[0].id).toBe('2026-06-26-use-node-runtime');
  expect(json.endsWith('\n')).toBe(true);
  // 같은 graph → 같은 출력(재현성)
  expect(serializeGraph(graph)).toBe(json);
});

// 파일 목록 → 노드·엣지·파생 사실을 가진 통합 graph (§4.7 파이프라인)
test('파일 목록에서 노드·엣지·사실을 가진 graph를 만든다', () => {
  const graph = buildGraph([
    {
      path: 'docs/plan/0001-2026-06-25-graph-parser.md',
      content: '---\nstatus: active\ndate: 2026-06-25\n---\n## 작업',
    },
    {
      path: 'docs/report/0002-2026-06-26-graph.md',
      content: '---\ndate: 2026-06-26\nplan: 2026-06-25-graph-parser\n---\n# 리포트',
    },
  ]);
  expect(graph.nodes).toHaveLength(2);
  expect(graph.edges).toContainEqual({
    type: 'plan-report',
    from: '2026-06-26-graph',
    to: '2026-06-25-graph-parser',
  });
  expect(graph.facts).toContainEqual({ kind: 'done', plan: '2026-06-25-graph-parser' });
});

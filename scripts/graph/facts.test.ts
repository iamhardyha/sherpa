import { test, expect } from 'vitest';
import { parseArtifact } from './node.js';
import { buildEdges } from './edges.js';
import { deriveFacts } from './facts.js';

// §2.2·§4.7: active + 나이>임계 + report 없음 = active-stale(진짜 잊힌 작업). today 주입(파서 순수).
test('오래된 active plan은 report 없으면 active-stale로 파생된다', () => {
  const plan = parseArtifact(
    'docs/plan/0001-2026-06-01-forgotten.md',
    `---\nstatus: active\ndate: 2026-06-01\n---\n## 작업`,
  );
  const facts = deriveFacts([plan], [], { today: '2026-06-26', staleDays: 14 });
  expect(facts).toContainEqual({ kind: 'active-stale', plan: '2026-06-01-forgotten' });
});

// paused는 의도된 보류라 active-stale 아님(§2.2)
test('paused plan은 오래돼도 active-stale이 아니다', () => {
  const plan = parseArtifact(
    'docs/plan/0002-2026-06-01-on-hold.md',
    `---\nstatus: paused\ndate: 2026-06-01\n---\n## 작업`,
  );
  const facts = deriveFacts([plan], [], { today: '2026-06-26', staleDays: 14 });
  expect(facts).not.toContainEqual({ kind: 'active-stale', plan: '2026-06-01-on-hold' });
});

// §2.3·§4.7: supersede가 한 방향만 있으면(옛 노드의 superseded-by 누락) supersede-asymmetry
test('supersede 한 방향만 있으면 supersede-asymmetry로 파생된다', () => {
  const newAdr = parseArtifact(
    'docs/adr/0002-2026-06-25-use-ts.md',
    `---\nstatus: accepted\ndate: 2026-06-25\nsupersedes: 2026-06-20-use-js\n---\n# 새`,
  );
  const oldAdr = parseArtifact(
    'docs/adr/0001-2026-06-20-use-js.md',
    `---\nstatus: superseded\ndate: 2026-06-20\n---\n# 옛 (superseded-by 누락)`,
  );
  const nodes = [newAdr, oldAdr];
  expect(deriveFacts(nodes, buildEdges(nodes))).toContainEqual({
    kind: 'supersede-asymmetry',
    from: '2026-06-25-use-ts',
    to: '2026-06-20-use-js',
  });
});

// §4.7: proposed 상태 ADR = unhandled-decision (미처리 결정)
test('proposed 상태 ADR은 unhandled-decision으로 파생된다', () => {
  const adr = parseArtifact(
    'docs/adr/0003-2026-06-26-cache-strategy.md',
    `---\nstatus: proposed\ndate: 2026-06-26\n---\n# 제안`,
  );
  expect(deriveFacts([adr], [])).toContainEqual({
    kind: 'unhandled-decision',
    adr: '2026-06-26-cache-strategy',
  });
});

// §4.7: 역참조 slug가 어느 노드와도 불일치하면 broken-link (코드 경로 refs는 제외)
test('역참조 대상이 없는 엣지는 broken-link로 파생되고 done은 아니다', () => {
  const report = parseArtifact(
    'docs/report/0002-2026-06-26-graph.md',
    `---\ndate: 2026-06-26\nplan: 2026-06-25-missing-plan\n---\n# 리포트`,
  );
  const nodes = [report]; // 대상 plan 노드 없음
  const facts = deriveFacts(nodes, buildEdges(nodes));
  expect(facts).toContainEqual({
    kind: 'broken-link',
    from: '2026-06-26-graph',
    to: '2026-06-25-missing-plan',
    edge: 'plan-report',
  });
  expect(facts).not.toContainEqual({ kind: 'done', plan: '2026-06-25-missing-plan' });
});

// §2.2·§4.7: report가 역참조하는 plan은 done으로 자동 파생
test('report가 역참조하는 plan은 done으로 파생된다', () => {
  const plan = parseArtifact(
    'docs/plan/0001-2026-06-25-graph-parser.md',
    `---\nstatus: active\ndate: 2026-06-25\n---\n## 작업`,
  );
  const report = parseArtifact(
    'docs/report/0002-2026-06-26-graph.md',
    `---\ndate: 2026-06-26\nplan: 2026-06-25-graph-parser\n---\n# 리포트`,
  );
  const nodes = [plan, report];
  expect(deriveFacts(nodes, buildEdges(nodes))).toContainEqual({
    kind: 'done',
    plan: '2026-06-25-graph-parser',
  });
});

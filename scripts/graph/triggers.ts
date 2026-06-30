import type { Graph } from './graph.js';
import type { Fact } from './facts.js';

// §6-A 산출물 트리거 — 미충족이면 완료 차단(차단형 §4.3). 두 갈래로 정확히 정의(rev10).
// - spec 트리거 = 드리프트(코드가 spec refs 바꿈+spec 미갱신) → graph의 drift 사실 소비
// - report 트리거 = plan 완료(태스크 전부 체크) + report 역참조 없음 → 작성 필요
export function checkTriggers(graph: Graph): Fact[] {
  const violations: Fact[] = [];
  const reported = new Set(
    graph.edges.filter((e) => e.type === 'plan-report').map((e) => e.to),
  );

  for (const node of graph.nodes) {
    if (node.type !== 'plan' || !node.progress) continue;
    const { impl, test } = node.progress;
    const allDone = impl.total > 0 && impl.done === impl.total && test.done === test.total;
    if (allDone && !reported.has(node.id)) {
      violations.push({ kind: 'report-trigger', plan: node.id });
    }
  }

  // spec 트리거 = 드리프트 사실(§6-I — git 연동 시 주입됨)
  for (const fact of graph.facts) {
    if (fact.kind === 'drift') {
      violations.push({ kind: 'spec-trigger', spec: fact.spec });
    }
  }

  return violations;
}

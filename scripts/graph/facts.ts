import type { Node } from './node.js';
import type { Edge } from './edges.js';

export interface Fact {
  kind: string;
  [key: string]: string;
}

export interface DeriveOptions {
  today?: string; // 'YYYY-MM-DD' 주입 — 파서 순수성(Date.now 미사용)
  staleDays?: number; // active-stale 나이 임계 (기본 14)
}

function daysSince(date: string, today: string): number {
  return Math.floor((Date.parse(today) - Date.parse(date)) / 86_400_000);
}

// 노드+엣지에서 결정론 사실을 판정한다 (§4.3·§4.7). LLM 아님.
export function deriveFacts(nodes: Node[], edges: Edge[], options: DeriveOptions = {}): Fact[] {
  const facts: Fact[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const reportedPlans = new Set(
    edges.filter((e) => e.type === 'plan-report').map((e) => e.to),
  );
  const staleDays = options.staleDays ?? 14;

  // 노드 기반 사실
  for (const node of nodes) {
    // unhandled-decision: 아직 수락/폐기되지 않은 ADR(§2.3)
    if (node.type === 'adr' && node.status === 'proposed') {
      facts.push({ kind: 'unhandled-decision', adr: node.id });
    }

    // active-stale: active + report 없음 + 나이>임계 = 진짜 잊힌 작업(§2.2).
    // paused·abandoned·done은 제외. today 없으면 나이 판정 불가 → 스킵.
    if (
      node.type === 'plan' &&
      node.status === 'active' &&
      !reportedPlans.has(node.id) &&
      options.today &&
      daysSince(node.date, options.today) > staleDays
    ) {
      facts.push({ kind: 'active-stale', plan: node.id });
    }
  }

  // 엣지 기반 사실
  for (const edge of edges) {
    // spec-refs의 to는 코드 경로(노드 아님) — 링크 무결성 대상 아님
    if (edge.type === 'spec-refs') continue;

    // broken-link: 역참조 slug가 어느 노드와도 불일치 → 깨진 엣지는 더 파생하지 않음
    const target = byId.get(edge.to);
    if (!target) {
      facts.push({ kind: 'broken-link', from: edge.from, to: edge.to, edge: edge.type });
      continue;
    }

    // done: plan에 인바운드 plan-report 엣지 = report가 종결 기록(§2.2)
    if (edge.type === 'plan-report') {
      facts.push({ kind: 'done', plan: edge.to });
    }

    // supersede-asymmetry: 옛 노드가 superseded-by로 새 노드를 마주 가리키지 않음(§2.3)
    if (edge.type === 'supersede' && target.supersededBy !== edge.from) {
      facts.push({ kind: 'supersede-asymmetry', from: edge.from, to: edge.to });
    }
  }

  return facts;
}

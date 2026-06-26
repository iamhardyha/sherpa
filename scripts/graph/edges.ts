import type { Node } from './node.js';

export interface Edge {
  type: string;
  from: string;
  to: string;
}

// 노드 집합의 역참조(§2.8)에서 typed 엣지를 뽑는다 (§4.7).
export function buildEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];

  for (const node of nodes) {
    if (node.type === 'report' && node.planRef) {
      edges.push({ type: 'plan-report', from: node.id, to: node.planRef });
    }
  }

  return edges;
}

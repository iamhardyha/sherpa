// 노드 집합의 역참조(§2.8)에서 typed 엣지를 뽑는다 (§4.7).
export function buildEdges(nodes) {
    const edges = [];
    for (const node of nodes) {
        if (node.type === 'report' && node.planRef) {
            edges.push({ type: 'plan-report', from: node.id, to: node.planRef });
        }
        if ((node.type === 'adr' || node.type === 'plan') && node.supersedes) {
            edges.push({ type: 'supersede', from: node.id, to: node.supersedes });
        }
        if (node.type === 'spec' && node.refs) {
            for (const ref of node.refs) {
                edges.push({ type: 'spec-refs', from: node.id, to: ref });
            }
        }
    }
    return edges;
}

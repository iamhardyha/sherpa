// 주의가 필요한 사실의 종류 (overview·status가 표면화 §4.7)
const ATTENTION_KINDS = ['active-stale', 'unhandled-decision', 'broken-link', 'supersede-asymmetry'];
// 명명 슬라이스 — 전체 graph가 아니라 해당 종류 사실만 (§4.5 통째 로드 금지)
export function factsByKind(graph, kind) {
    return graph.facts.filter((f) => f.kind === kind);
}
function countBy(items, key) {
    const out = {};
    for (const item of items)
        out[key(item)] = (out[key(item)] ?? 0) + 1;
    return out;
}
// overview: 타입 카운트 + 주의 항목 수 (§4.7 — /sherpa-status·lens overview 소비)
export function overview(graph) {
    const attentionFacts = graph.facts.filter((f) => ATTENTION_KINDS.includes(f.kind));
    return {
        counts: countBy(graph.nodes, (n) => n.type),
        attention: countBy(attentionFacts, (f) => f.kind),
    };
}

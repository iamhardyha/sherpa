// ref 문법(§2.8): 'path#symbol' | 'path' | 'dir/**' → 대조할 파일 경로(prefix)
function refToPath(ref) {
    return ref.split('#')[0].replace(/\/?\*+$/, '');
}
// refPath가 파일 집합과 겹치나 — 정확 일치 또는 디렉토리 prefix(글롭)
function matches(refPath, files) {
    if (files.has(refPath))
        return true;
    const prefix = refPath.endsWith('/') ? refPath : refPath + '/';
    for (const f of files) {
        if (f.startsWith(prefix))
            return true;
    }
    return false;
}
// §6-I·§2.7: spec refs ↔ 코드 변경 대조 (결정론). 2축 분리 — drift≠retire.
export function checkDrift(specs, changed, existing) {
    const facts = [];
    for (const spec of specs) {
        if (spec.type !== 'spec' || !spec.refs)
            continue;
        const refPaths = spec.refs.map(refToPath);
        // ① 정확성: ref 코드가 변경됐는데 spec은 미변경 → 재검증(archive 아님)
        if (!changed.has(spec.path) && refPaths.some((rp) => matches(rp, changed))) {
            facts.push({ kind: 'drift', spec: spec.id });
        }
        // ② 현역성: ref 코드가 전부 사라짐 → retire 후보(archive 후보). drift와 섞지 않음(§2.7).
        if (refPaths.every((rp) => !matches(rp, existing))) {
            facts.push({ kind: 'retire-candidate', spec: spec.id });
        }
    }
    return facts;
}

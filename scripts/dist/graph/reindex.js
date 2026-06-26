import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectEntries, ARTIFACT_DIRS } from './collect.js';
import { buildGraph, serializeGraph } from './graph.js';
import { checkDrift } from './drift.js';
import { collectGitState } from './git.js';
import { renderDashboard, renderIndex } from './render.js';
// docs/ → .graph.json 재생성 (§4.7). today·gitState는 주입(함수 순수성 — §6-I 드리프트는 git 의존).
export async function reindex(docsDir, today, gitState) {
    const entries = await collectEntries(docsDir);
    const graph = buildGraph(entries, { today });
    // 드리프트/retire 사실 주입(§6-I·§2.7) — git 정보 있을 때만
    const driftFacts = gitState
        ? checkDrift(graph.nodes.filter((n) => n.type === 'spec'), gitState.changed, gitState.existing)
        : [];
    const fullGraph = { ...graph, facts: [...graph.facts, ...driftFacts] };
    // 사실(graph.json) + 뷰(대시보드·INDEX ×N) 재생성 (§5.1 — 손편집 금지 §6-G)
    await writeFile(join(docsDir, '.graph.json'), serializeGraph(fullGraph));
    await writeFile(join(docsDir, 'README.md'), renderDashboard(fullGraph));
    for (const type of ARTIFACT_DIRS) {
        const dir = join(docsDir, type);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'INDEX.md'), renderIndex(fullGraph, type));
    }
    return { nodes: fullGraph.nodes.length, edges: fullGraph.edges.length, facts: fullGraph.facts.length };
}
// CLI 진입점 — 부작용 경계에서 오늘 날짜·git 상태 수집(파서는 주입받아 순수)
const invokedDirectly = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
    const docsDir = process.argv[2] ?? 'docs';
    const today = new Date().toISOString().slice(0, 10);
    let gitState;
    try {
        gitState = collectGitState(process.cwd());
    }
    catch {
        gitState = undefined; // git 레포가 아니면 드리프트 없이 진행(graph·뷰는 생성)
    }
    reindex(docsDir, today, gitState)
        .then((s) => console.log(`graph: ${s.nodes} nodes · ${s.edges} edges · ${s.facts} facts → ${docsDir}/.graph.json`))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

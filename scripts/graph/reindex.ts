import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectEntries } from './collect.js';
import { buildGraph, serializeGraph } from './graph.js';
import { checkDrift } from './drift.js';
import { collectGitState, type GitState } from './git.js';

export interface ReindexResult {
  nodes: number;
  edges: number;
  facts: number;
}

// docs/ → .graph.json 재생성 (§4.7). today·gitState는 주입(함수 순수성 — §6-I 드리프트는 git 의존).
export async function reindex(docsDir: string, today: string, gitState?: GitState): Promise<ReindexResult> {
  const entries = await collectEntries(docsDir);
  const graph = buildGraph(entries, { today });

  // 드리프트/retire 사실 주입(§6-I·§2.7) — git 정보 있을 때만
  const driftFacts = gitState
    ? checkDrift(graph.nodes.filter((n) => n.type === 'spec'), gitState.changed, gitState.existing)
    : [];
  const fullGraph = { ...graph, facts: [...graph.facts, ...driftFacts] };

  await writeFile(join(docsDir, '.graph.json'), serializeGraph(fullGraph));
  return { nodes: fullGraph.nodes.length, edges: fullGraph.edges.length, facts: fullGraph.facts.length };
}

// CLI 진입점 — 부작용 경계에서 오늘 날짜·git 상태 수집(파서는 주입받아 순수)
const invokedDirectly = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split('/').pop()!);
if (invokedDirectly) {
  const docsDir = process.argv[2] ?? 'docs';
  const today = new Date().toISOString().slice(0, 10);
  const gitState = collectGitState(process.cwd());
  reindex(docsDir, today, gitState)
    .then((s) => console.log(`graph: ${s.nodes} nodes · ${s.edges} edges · ${s.facts} facts → ${docsDir}/.graph.json`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

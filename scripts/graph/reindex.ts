import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectEntries } from './collect.js';
import { buildGraph, serializeGraph } from './graph.js';

export interface ReindexResult {
  nodes: number;
  edges: number;
  facts: number;
}

// docs/ → .graph.json 재생성 (§4.7). today는 주입(active-stale 판정 §2.2 — 함수 순수성).
export async function reindex(docsDir: string, today: string): Promise<ReindexResult> {
  const entries = await collectEntries(docsDir);
  const graph = buildGraph(entries, { today });
  await writeFile(join(docsDir, '.graph.json'), serializeGraph(graph));
  return { nodes: graph.nodes.length, edges: graph.edges.length, facts: graph.facts.length };
}

// CLI 진입점 — 부작용 경계에서 오늘 날짜 생성(파서는 주입받아 순수)
const invokedDirectly = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split('/').pop()!);
if (invokedDirectly) {
  const docsDir = process.argv[2] ?? 'docs';
  const today = new Date().toISOString().slice(0, 10);
  reindex(docsDir, today)
    .then((s) => console.log(`graph: ${s.nodes} nodes · ${s.edges} edges · ${s.facts} facts → ${docsDir}/.graph.json`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

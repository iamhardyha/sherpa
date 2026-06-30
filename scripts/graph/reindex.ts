import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ARTIFACT_DIRS } from './collect.js';
import { serializeGraph } from './graph.js';
import { buildFullGraph } from './pipeline.js';
import { collectGitState, type GitState } from './git.js';
import { renderDashboard, renderIndex } from './render.js';
import { isInvokedDirectly } from '../utils/cli.js';

export interface ReindexResult {
  nodes: number;
  edges: number;
  facts: number;
}

// docs/ → .graph.json + 뷰(대시보드·INDEX) 재생성 (§4.7·§5.1). today·gitState는 주입(순수성).
export async function reindex(docsDir: string, today: string, gitState?: GitState): Promise<ReindexResult> {
  const graph = await buildFullGraph(docsDir, today, gitState);

  // 사실(graph.json) + 뷰(대시보드·INDEX ×N) 재생성 (손편집 금지 §6-G)
  await writeFile(join(docsDir, '.graph.json'), serializeGraph(graph));
  await writeFile(join(docsDir, 'README.md'), renderDashboard(graph));
  for (const type of ARTIFACT_DIRS) {
    const dir = join(docsDir, type);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'INDEX.md'), renderIndex(graph, type));
  }

  return { nodes: graph.nodes.length, edges: graph.edges.length, facts: graph.facts.length };
}

// CLI 진입점 — 부작용 경계에서 오늘 날짜·git 상태 수집(파서는 주입받아 순수)
if (isInvokedDirectly(import.meta.url)) {
  const docsDir = process.argv[2] ?? 'docs';
  const today = new Date().toISOString().slice(0, 10);
  let gitState: GitState | undefined;
  try {
    gitState = collectGitState(process.cwd());
  } catch {
    gitState = undefined; // git 레포가 아니면 드리프트 없이 진행
  }
  reindex(docsDir, today, gitState)
    .then((s) => console.log(`graph: ${s.nodes} nodes · ${s.edges} edges · ${s.facts} facts → ${docsDir}/.graph.json`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

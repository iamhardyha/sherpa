import { collectEntries } from './collect.js';
import { buildGraph, type Graph } from './graph.js';
import { checkDrift } from './drift.js';
import type { GitState } from './git.js';

// 파일 수집 → 그래프 → 드리프트 사실 주입까지 한 번에 (reindex·trigger-check 공용).
// gitState는 주입(옵셔널) — 함수 순수성 유지, 부작용(collectGitState)은 호출자 몫.
export async function buildFullGraph(
  docsDir: string,
  today: string,
  gitState?: GitState,
): Promise<Graph> {
  const entries = await collectEntries(docsDir);
  const graph = buildGraph(entries, { today });
  const driftFacts = gitState
    ? checkDrift(graph.nodes.filter((n) => n.type === 'spec'), gitState.changed, gitState.existing)
    : [];
  return { ...graph, facts: [...graph.facts, ...driftFacts] };
}

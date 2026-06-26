import { parseArtifact, type Node } from './node.js';
import { buildEdges, type Edge } from './edges.js';
import { deriveFacts, type Fact, type DeriveOptions } from './facts.js';

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  facts: Fact[];
}

export interface Entry {
  path: string;
  content: string;
}

// 파일 목록 → 노드 → 엣지 → 파생 사실 (§2.8 입력 → §4.7 출력 파이프라인).
export function buildGraph(entries: Entry[], options: DeriveOptions = {}): Graph {
  const nodes = entries.map((e) => parseArtifact(e.path, e.content));
  const edges = buildEdges(nodes);
  const facts = deriveFacts(nodes, edges, options);
  return { nodes, edges, facts };
}

// graph → 결정론적 JSON (docs/.graph.json — 재생성물 §3). 파일 쓰기는 호출자(CLI/hook) 몫.
export function serializeGraph(graph: Graph): string {
  return JSON.stringify(graph, null, 2) + '\n';
}

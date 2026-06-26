import { basename } from 'node:path';
import type { Graph } from './graph.js';
import { overview } from './query.js';

// 타입별 산출물 목록 → INDEX 마크다운 (§5.1). NNNN 순 정렬, 원본 링크백.
export function renderIndex(graph: Graph, type: string): string {
  const nodes = graph.nodes
    .filter((n) => n.type === type)
    .sort((a, b) => a.nnnn.localeCompare(b.nnnn) || a.id.localeCompare(b.id));

  const lines = [`# ${type} INDEX`, ''];
  if (nodes.length === 0) {
    lines.push('_(없음)_');
  } else {
    for (const n of nodes) {
      const num = n.nnnn ? `\`${n.nnnn}\` ` : '';
      const status = n.status ? ` — ${n.status}` : '';
      lines.push(`- ${num}[${n.id}](${basename(n.path)})${status}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

// graph 사실 → 대시보드 마크다운 (§5.1 — /sherpa-status·docs/README.md). 뷰(재생성물).
export function renderDashboard(graph: Graph): string {
  const ov = overview(graph);
  const activePlans = graph.nodes.filter((n) => n.type === 'plan' && n.status === 'active');

  const lines = ['# 📊 Sherpa 대시보드', ''];

  lines.push('## 진행 중');
  if (activePlans.length === 0) {
    lines.push('_(없음)_');
  } else {
    for (const p of activePlans) {
      const pr = p.progress;
      const prog = pr
        ? ` — 구현 ${pr.impl.done}/${pr.impl.total} · 테스트 ${pr.test.done}/${pr.test.total}`
        : '';
      lines.push(`- \`${p.id}\`${prog}`);
    }
  }
  lines.push('');

  lines.push('## ⚠️ 주의');
  const attention = Object.entries(ov.attention);
  if (attention.length === 0) {
    lines.push('_(없음)_');
  } else {
    for (const [kind, count] of attention) lines.push(`- ${kind}: ${count}`);
  }
  lines.push('');

  lines.push('## 카운트');
  lines.push(Object.entries(ov.counts).map(([type, count]) => `${type} ${count}`).join(' · ') || '_(없음)_');
  lines.push('');

  return lines.join('\n');
}

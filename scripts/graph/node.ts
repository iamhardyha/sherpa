import matter from 'gray-matter';
import { deriveIdentity } from './identity.js';
import { parseProgress, type Progress } from './progress.js';

export interface Node {
  id: string;
  type: string;
  nnnn: string;
  path: string;
  status: string;
  date: string;
  // spec 전용 (§4.7)
  domain?: string;
  lastVerified?: string;
  refs?: string[];
  // plan 전용 (§4.7)
  progress?: Progress;
  // 역참조 (엣지 source §2.8)
  planRef?: string;
  supersedes?: string;
  supersededBy?: string;
}

// YAML 1.1은 2026-06-26을 timestamp(Date)로 파싱 — §2.8은 date를 문자열로 규정
function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? '' : String(value);
}

// docs/{type}/… 산출물 파일 → graph 노드(§4.7). 정체성(§2.8) + frontmatter.
export function parseArtifact(path: string, content: string): Node {
  const { data, content: body } = matter(content);
  const identity = deriveIdentity(path);
  const base: Node = {
    ...identity,
    path,
    status: data.status ?? '',
    date: normalizeDate(data.date),
  };

  // supersede 양방향 링크는 adr·plan 공통 (§2.3·§2.8) — 값 있을 때만
  if (identity.type === 'adr' || identity.type === 'plan') {
    if (data.supersedes) base.supersedes = data.supersedes;
    if (data['superseded-by']) base.supersededBy = data['superseded-by'];
  }

  if (identity.type === 'plan') {
    return { ...base, progress: parseProgress(body) };
  }

  if (identity.type === 'report') {
    return { ...base, planRef: data.plan ?? '' };
  }

  if (identity.type === 'spec') {
    return {
      ...base,
      domain: data.domain ?? '',
      lastVerified: normalizeDate(data['last-verified']),
      refs: Array.isArray(data.refs) ? data.refs : [],
    };
  }

  return base;
}

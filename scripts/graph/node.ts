import matter from 'gray-matter';
import { deriveIdentity } from './identity.js';

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
}

// YAML 1.1은 2026-06-26을 timestamp(Date)로 파싱 — §2.8은 date를 문자열로 규정
function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? '' : String(value);
}

// docs/{type}/… 산출물 파일 → graph 노드(§4.7). 정체성(§2.8) + frontmatter.
export function parseArtifact(path: string, content: string): Node {
  const { data } = matter(content);
  const identity = deriveIdentity(path);
  const base: Node = {
    ...identity,
    path,
    status: data.status ?? '',
    date: normalizeDate(data.date),
  };

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

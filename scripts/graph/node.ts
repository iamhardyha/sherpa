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

type Frontmatter = Record<string, unknown>;

// YAML 1.1은 2026-06-26을 timestamp(Date)로 파싱 — §2.8은 date를 문자열로 규정
function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? '' : String(value);
}

// supersede 양방향 링크는 adr·plan 공통 (§2.3·§2.8) — 값 있을 때만
function supersedeFields(type: string, data: Frontmatter): Partial<Node> {
  if (type !== 'adr' && type !== 'plan') return {};
  return {
    ...(data.supersedes ? { supersedes: String(data.supersedes) } : {}),
    ...(data['superseded-by'] ? { supersededBy: String(data['superseded-by']) } : {}),
  };
}

// 산출물 타입별 추가 필드 (§4.7). 새 타입 추가 시 여기 + edges.ts + 테스트를 함께 갱신.
function typeFields(type: string, data: Frontmatter, body: string): Partial<Node> {
  if (type === 'plan') return { progress: parseProgress(body) };
  if (type === 'report') return { planRef: data.plan ? String(data.plan) : '' };
  if (type === 'spec') {
    return {
      domain: data.domain ? String(data.domain) : '',
      lastVerified: normalizeDate(data['last-verified']),
      refs: Array.isArray(data.refs) ? (data.refs as string[]) : [],
    };
  }
  return {};
}

// docs/{type}/… 산출물 파일 → graph 노드(§4.7). 정체성(§2.8) + frontmatter.
export function parseArtifact(path: string, content: string): Node {
  const { data, content: body } = matter(content);
  const identity = deriveIdentity(path);
  return {
    ...identity,
    path,
    status: data.status ? String(data.status) : '',
    date: normalizeDate(data.date),
    ...supersedeFields(identity.type, data),
    ...typeFields(identity.type, data, body),
  };
}

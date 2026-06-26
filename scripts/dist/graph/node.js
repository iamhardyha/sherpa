import matter from 'gray-matter';
import { deriveIdentity } from './identity.js';
import { parseProgress } from './progress.js';
// YAML 1.1은 2026-06-26을 timestamp(Date)로 파싱 — §2.8은 date를 문자열로 규정
function normalizeDate(value) {
    if (value instanceof Date)
        return value.toISOString().slice(0, 10);
    return value == null ? '' : String(value);
}
// supersede 양방향 링크는 adr·plan 공통 (§2.3·§2.8) — 값 있을 때만
function supersedeFields(type, data) {
    if (type !== 'adr' && type !== 'plan')
        return {};
    return {
        ...(data.supersedes ? { supersedes: String(data.supersedes) } : {}),
        ...(data['superseded-by'] ? { supersededBy: String(data['superseded-by']) } : {}),
    };
}
// 산출물 타입별 추가 필드 (§4.7). 새 타입 추가 시 여기 + edges.ts + 테스트를 함께 갱신.
function typeFields(type, data, body) {
    if (type === 'plan')
        return { progress: parseProgress(body) };
    if (type === 'report')
        return { planRef: data.plan ? String(data.plan) : '' };
    if (type === 'spec') {
        return {
            domain: data.domain ? String(data.domain) : '',
            lastVerified: normalizeDate(data['last-verified']),
            refs: Array.isArray(data.refs) ? data.refs : [],
        };
    }
    return {};
}
// docs/{type}/… 산출물 파일 → graph 노드(§4.7). 정체성(§2.8) + frontmatter.
export function parseArtifact(path, content) {
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

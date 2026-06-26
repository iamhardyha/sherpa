import { test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { collectEntries } from './collect.js';

const DOCS = fileURLToPath(new URL('./__fixtures__/docs', import.meta.url));

// docs/{adr,plan,spec,report}/ 의 산출물 .md 수집 — INDEX(뷰)는 제외
test('docs 디렉토리에서 산출물 .md를 수집한다 (INDEX 제외)', async () => {
  const entries = await collectEntries(DOCS);
  const ids = entries.map((e) => e.path).sort();

  // adr·plan·spec 3개 (INDEX.md 제외)
  expect(entries).toHaveLength(3);
  expect(ids.some((p) => p.endsWith('adr/0001-2026-06-20-use-node.md'))).toBe(true);
  expect(ids.some((p) => p.endsWith('spec/auth/token.md'))).toBe(true); // 중첩 domain
  expect(ids.some((p) => p.endsWith('INDEX.md'))).toBe(false);
  // content가 실제로 읽혔다
  expect(entries.find((e) => e.path.includes('plan'))?.content).toContain('## 작업');
});

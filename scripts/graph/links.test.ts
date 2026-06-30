import { test, expect } from 'vitest';
import { extractLinks, checkLinks } from './links.js';

// 셀프검증 ②(§6): 마크다운 로컬 링크 추출 — 외부 URL·앵커는 제외
test('마크다운에서 로컬 링크만 추출한다(외부 URL 제외, 앵커 제거)', () => {
  const md = '[a](./foo.md) 텍스트 [b](https://x.com) [c](../bar.md#section) [d](#anchor-only)';
  expect(extractLinks(md)).toEqual(['./foo.md', '../bar.md']);
});

// checkLinks: 존재하지 않는 로컬 링크를 broken으로 (existing 주입 — 순수)
test('존재하지 않는 로컬 링크를 broken으로 잡는다', () => {
  const md = '[a](./foo.md) [b](./missing.md)';
  const existing = new Set(['docs/foo.md']);
  expect(checkLinks(md, 'docs', existing)).toEqual(['docs/missing.md']);
});

// 전부 존재하면 broken 없음
test('링크 대상이 모두 존재하면 broken 없음', () => {
  const md = '[a](./foo.md)';
  const existing = new Set(['docs/foo.md']);
  expect(checkLinks(md, 'docs', existing)).toEqual([]);
});

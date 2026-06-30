import { test, expect } from 'vitest';
import { isTrivialDoc, isTrivialCode } from './classify.js';

// §6-D 문서: prose 본문 줄만 바뀌면 trivial. frontmatter·링크·코드펜스·heading은 non-trivial.
test('prose 본문만 변경된 문서는 trivial', () => {
  expect(isTrivialDoc(['오타를 고쳤다', '설명 문장을 다듬었다'])).toBe(true);
});
test('frontmatter 필드 변경은 non-trivial', () => {
  expect(isTrivialDoc(['status: accepted'])).toBe(false);
});
test('링크 변경은 non-trivial', () => {
  expect(isTrivialDoc(['자세히는 [문서](./spec.md) 참고'])).toBe(false);
});
test('heading·코드펜스 변경은 non-trivial', () => {
  expect(isTrivialDoc(['## 새 섹션'])).toBe(false);
  expect(isTrivialDoc(['```ts'])).toBe(false);
});

// §6-D 코드: 주석·빈 줄만이면 trivial. 코드 줄이 있으면 non-trivial.
test('주석·빈 줄만 변경된 코드는 trivial', () => {
  expect(isTrivialCode(['// 주석 추가', '  ', '# 파이썬 주석'])).toBe(true);
});
test('동작 줄이 있으면 non-trivial', () => {
  expect(isTrivialCode(['const x = compute();'])).toBe(false);
});

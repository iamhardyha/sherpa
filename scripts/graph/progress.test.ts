import { test, expect } from 'vitest';
import { parseProgress } from './progress.js';

// §2.8 체크박스: - [x] {N}. {제목} — [x] 구현 [ ] 테스트 → 구현 m/n·테스트 k/n (§2.2·§4.7)
test('plan 본문 체크박스에서 구현·테스트 진척도를 센다', () => {
  const body = `## 작업
- [x] 1. 스키마 — [x] 구현 [x] 테스트
- [x] 2. 파서 — [x] 구현 [ ] 테스트
- [ ] 3. 엣지 — [ ] 구현 [ ] 테스트`;
  expect(parseProgress(body)).toEqual({
    impl: { done: 2, total: 3 },
    test: { done: 1, total: 3 },
  });
});

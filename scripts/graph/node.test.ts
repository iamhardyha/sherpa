import { test, expect } from 'vitest';
import { parseArtifact } from './node.js';

// §4.7: plan 노드는 본문 체크박스 진척도(progress)를 담는다 (§2.2)
test('plan 노드는 본문 진척도를 담는다', () => {
  const content = `---
status: active
date: 2026-06-25
---
## 작업
- [x] 1. 스키마 — [x] 구현 [ ] 테스트
- [ ] 2. 파서 — [ ] 구현 [ ] 테스트`;
  expect(parseArtifact('docs/plan/0003-2026-06-25-graph-parser.md', content)).toMatchObject({
    type: 'plan',
    status: 'active',
    progress: { impl: { done: 1, total: 2 }, test: { done: 0, total: 2 } },
  });
});

// §4.7: spec 노드는 domain·refs·last-verified 추가 (refs는 §6-I 드리프트 입력)
test('spec 노드는 refs와 last-verified를 담는다', () => {
  const content = `---
domain: auth
last-verified: 2026-06-20
refs:
  - src/auth/token.ts#issueToken
  - src/auth/**
---
# 토큰`;
  expect(parseArtifact('docs/spec/auth/token.md', content)).toMatchObject({
    type: 'spec',
    id: 'auth/token',
    domain: 'auth',
    lastVerified: '2026-06-20',
    refs: ['src/auth/token.ts#issueToken', 'src/auth/**'],
  });
});

// §4.7 노드: id·type·nnnn·path + frontmatter(status·date). §2.8 계약.
test('adr 파일을 노드로 파싱한다', () => {
  const content = `---
status: accepted
date: 2026-06-26
---
# Node 런타임 채택`;
  expect(parseArtifact('docs/adr/0001-2026-06-26-use-node-runtime.md', content)).toEqual({
    id: '2026-06-26-use-node-runtime',
    type: 'adr',
    nnnn: '0001',
    path: 'docs/adr/0001-2026-06-26-use-node-runtime.md',
    status: 'accepted',
    date: '2026-06-26',
  });
});

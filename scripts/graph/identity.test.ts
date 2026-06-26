import { test, expect } from 'vitest';
import { deriveIdentity } from './identity.js';

// §2.8: id = {date}-{slug} (영구), NNNN은 표시용. type은 경로에서.
test('adr 경로에서 type·nnnn·id를 도출한다', () => {
  expect(deriveIdentity('docs/adr/0001-2026-06-26-use-node-runtime.md')).toEqual({
    type: 'adr',
    nnnn: '0001',
    id: '2026-06-26-use-node-runtime',
  });
});

// §2.8: spec id = {domain}/{name} (날짜·NNNN 없음 — 무엇을 설명하나로 식별)
test('spec 경로에서 domain/name id를 도출한다', () => {
  expect(deriveIdentity('docs/spec/auth/token.md')).toEqual({
    type: 'spec',
    nnnn: '',
    id: 'auth/token',
  });
});

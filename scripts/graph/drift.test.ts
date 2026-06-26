import { test, expect } from 'vitest';
import { parseArtifact } from './node.js';
import { checkDrift } from './drift.js';

const spec = parseArtifact(
  'docs/spec/auth/token.md',
  `---\ndomain: auth\nlast-verified: 2026-06-20\nrefs:\n  - src/auth/token.ts#issueToken\n  - src/auth/helpers/**\n---\n# 토큰`,
);

// §6-I·§2.7①: ref 코드가 변경됐는데 spec은 안 바뀜 → drift(재검증, archive 아님)
test('ref 코드가 변경됐는데 spec은 안 바뀌면 drift', () => {
  const changed = new Set(['src/auth/token.ts']); // spec.path는 미변경
  const existing = new Set(['src/auth/token.ts']);
  expect(checkDrift([spec], changed, existing)).toContainEqual({ kind: 'drift', spec: 'auth/token' });
});

// spec 자체가 함께 변경됐으면 drift 아님(재검증 끝났다고 봄)
test('ref와 spec이 함께 변경되면 drift가 아니다', () => {
  const changed = new Set(['src/auth/token.ts', 'docs/spec/auth/token.md']);
  const existing = new Set(['src/auth/token.ts']);
  expect(checkDrift([spec], changed, existing)).not.toContainEqual({ kind: 'drift', spec: 'auth/token' });
});

// §2.7②: ref 코드가 전부 사라짐 → retire-candidate(현역성 상실 — archive 후보). drift와 별개 축.
test('ref 파일이 전부 사라지면 retire-candidate', () => {
  const existing = new Set<string>(); // ref 파일 전부 없음
  expect(checkDrift([spec], new Set(), existing)).toContainEqual({
    kind: 'retire-candidate',
    spec: 'auth/token',
  });
});

// ref가 하나라도 살아있으면 retire 아님(살아있는 진실은 archive 아님 §2.7)
test('ref 파일이 하나라도 살아있으면 retire-candidate가 아니다', () => {
  const existing = new Set(['src/auth/token.ts']);
  expect(checkDrift([spec], new Set(), existing)).not.toContainEqual({
    kind: 'retire-candidate',
    spec: 'auth/token',
  });
});

import { test, expect } from 'vitest';
import { planScaffold } from './scaffold.js';

// §4·§5.1 /sherpa-init: .sherpa 거버넌스 + docs 5종 + lens 타입별 + archive 구조 계획(순수)
test('기본 스캐폴드 — 거버넌스 + docs 산출물 + lens 타입별 + archive', () => {
  const plan = planScaffold({ docsDir: 'docs' });

  // 디렉토리
  expect(plan.dirs).toContain('.sherpa');
  expect(plan.dirs).toContain('docs/adr');
  expect(plan.dirs).toContain('docs/spec');
  expect(plan.dirs).toContain('docs/lens/overview');
  expect(plan.dirs).toContain('docs/lens/custom');
  expect(plan.dirs).toContain('docs/archive');

  // 거버넌스 템플릿 복사 (templates/governance → 레포)
  expect(plan.copies).toContainEqual({ from: 'templates/governance/CLAUDE.md', to: 'CLAUDE.md' });
  expect(plan.copies).toContainEqual({
    from: 'templates/governance/workflow.md',
    to: '.sherpa/workflow.md',
  });
  expect(plan.copies).toContainEqual({
    from: 'templates/governance/progress.md',
    to: '.sherpa/progress.md',
  });
});

// §4.2 stream 옵션: docs/{stream}/{artifact}/
test('stream 옵션이면 docs/{stream}/{artifact} 구조', () => {
  const plan = planScaffold({ docsDir: 'docs', stream: 'server' });
  expect(plan.dirs).toContain('docs/server/adr');
  expect(plan.dirs).toContain('docs/server/lens/overview');
});

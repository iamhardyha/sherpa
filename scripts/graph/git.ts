import { execFileSync } from 'node:child_process';

export interface GitState {
  changed: Set<string>; // 워킹트리에서 변경된 파일 (드리프트 입력 §6-I)
  existing: Set<string>; // 추적 중인 파일 (retire 판정 §2.7)
}

function git(args: string[], cwd: string): string {
  // stderr는 무시 — git 레포가 아니면 throw하고 호출부(collectGitState 소비자)가 graceful 처리
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

// 부작용 — git에서 변경/추적 파일 수집. 경로는 레포 루트 상대(refs·spec.path와 같은 기준).
export function collectGitState(repoRoot: string): GitState {
  const lines = (out: string) => out.split('\n').filter(Boolean);
  return {
    changed: new Set(lines(git(['diff', '--name-only', 'HEAD'], repoRoot))),
    existing: new Set(lines(git(['ls-files'], repoRoot))),
  };
}

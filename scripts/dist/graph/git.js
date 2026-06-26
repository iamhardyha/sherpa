import { execFileSync } from 'node:child_process';
function git(args, cwd) {
    return execFileSync('git', args, { cwd, encoding: 'utf8' });
}
// 부작용 — git에서 변경/추적 파일 수집. 경로는 레포 루트 상대(refs·spec.path와 같은 기준).
export function collectGitState(repoRoot) {
    const lines = (out) => out.split('\n').filter(Boolean);
    return {
        changed: new Set(lines(git(['diff', '--name-only', 'HEAD'], repoRoot))),
        existing: new Set(lines(git(['ls-files'], repoRoot))),
    };
}

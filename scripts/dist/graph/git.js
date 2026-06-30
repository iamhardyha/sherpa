import { execFileSync } from 'node:child_process';
function git(args, cwd) {
    // stderr는 무시 — git 레포가 아니면 throw하고 호출부(collectGitState 소비자)가 graceful 처리
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}
// 부작용 — git에서 변경/추적 파일 수집. 경로는 레포 루트 상대(refs·spec.path와 같은 기준).
export function collectGitState(repoRoot) {
    const lines = (out) => out.split('\n').filter(Boolean);
    return {
        changed: new Set(lines(git(['diff', '--name-only', 'HEAD'], repoRoot))),
        existing: new Set(lines(git(['ls-files'], repoRoot))),
    };
}

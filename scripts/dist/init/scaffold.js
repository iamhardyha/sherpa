const ARTIFACT_DIRS = ['adr', 'plan', 'spec', 'report'];
const LENS_VIEWS = ['overview', 'threads', 'decisions', 'concept', 'custom'];
// templates/governance/{파일} → 레포 {경로}
const GOVERNANCE = [
    { from: 'templates/governance/CLAUDE.md', to: 'CLAUDE.md' },
    { from: 'templates/governance/workflow.md', to: '.sherpa/workflow.md' },
    { from: 'templates/governance/project-context.md', to: '.sherpa/project-context.md' },
    { from: 'templates/governance/conventions.md', to: '.sherpa/conventions.md' },
    { from: 'templates/governance/progress.md', to: '.sherpa/progress.md' },
];
// §4·§5.1: /sherpa-init이 만들 구조 계획 (순수 — 부작용 없음). stream은 산출물 앞에 낌(§4.2).
export function planScaffold(options) {
    const docsDir = options.docsDir ?? 'docs';
    const base = options.stream ? `${docsDir}/${options.stream}` : docsDir;
    const dirs = ['.sherpa'];
    for (const a of ARTIFACT_DIRS)
        dirs.push(`${base}/${a}`);
    for (const v of LENS_VIEWS)
        dirs.push(`${base}/lens/${v}`);
    dirs.push(`${base}/archive`);
    return { dirs, copies: GOVERNANCE };
}

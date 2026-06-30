import { buildFullGraph } from './pipeline.js';
import { collectGitState } from './git.js';
import { checkTriggers } from './triggers.js';
// §6-A 차단형 hook — 커밋 전 산출물 트리거 미충족이면 exit 2(차단). PreToolUse(Bash) stdin으로 hook JSON.
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin)
        chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
}
async function main() {
    // hook JSON에서 실행 명령 추출 — git commit일 때만 검사(critical few §6-D 정신)
    let command = '';
    try {
        command = JSON.parse(await readStdin())?.tool_input?.command ?? '';
    }
    catch {
        // stdin 없거나 파싱 실패 — 통과
    }
    if (!command.includes('git commit'))
        process.exit(0);
    // hook은 레포 루트의 docs/ 고정(reindex와 달리 인자 없음 — stream 지원은 §4.2/§8)
    const docsDir = 'docs';
    const today = new Date().toISOString().slice(0, 10);
    let gitState;
    try {
        gitState = collectGitState(process.cwd());
    }
    catch {
        gitState = undefined; // git 레포 아님 — 드리프트 없이 진행
    }
    const graph = await buildFullGraph(docsDir, today, gitState);
    const violations = checkTriggers(graph);
    if (violations.length === 0)
        process.exit(0);
    console.error('🚫 Sherpa: 산출물 트리거 미충족 — 커밋을 막습니다 (§6-A).');
    for (const v of violations) {
        if (v.kind === 'report-trigger') {
            console.error(`  • plan '${v.plan}' 태스크가 전부 완료됨 → report 작성이 필요합니다 (§2.2).`);
        }
        else if (v.kind === 'spec-trigger') {
            console.error(`  • spec '${v.spec}' 가 코드 변경과 드리프트 → 재검증·갱신이 필요합니다 (§6-I).`);
        }
    }
    process.exit(2); // 차단 — stderr가 에이전트 컨텍스트로 주입됨
}
main().catch((err) => {
    console.error(err);
    process.exit(0); // 검사 자체 실패는 차단하지 않음(작업 방해 최소)
});

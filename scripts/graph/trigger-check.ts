import { collectEntries } from './collect.js';
import { buildGraph } from './graph.js';
import { checkDrift } from './drift.js';
import { collectGitState } from './git.js';
import { checkTriggers } from './triggers.js';

// §6-A 차단형 hook — 커밋 전 산출물 트리거 미충족이면 exit 2(차단). PreToolUse(Bash) stdin으로 hook JSON.
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function main(): Promise<void> {
  // hook JSON에서 실행 명령 추출 — git commit일 때만 검사(critical few §6-D 정신)
  let command = '';
  try {
    command = JSON.parse(await readStdin())?.tool_input?.command ?? '';
  } catch {
    // stdin 없거나 파싱 실패 — 통과
  }
  if (!command.includes('git commit')) process.exit(0);

  const docsDir = 'docs';
  const entries = await collectEntries(docsDir); // docs 없으면 빈 배열(graceful)
  const today = new Date().toISOString().slice(0, 10);
  const graph = buildGraph(entries, { today });

  // 드리프트 사실 주입(spec 트리거 입력)
  let driftFacts: ReturnType<typeof checkDrift> = [];
  try {
    const git = collectGitState(process.cwd());
    driftFacts = checkDrift(graph.nodes.filter((n) => n.type === 'spec'), git.changed, git.existing);
  } catch {
    // git 레포 아님 — 드리프트 없이 진행
  }
  const full = { ...graph, facts: [...graph.facts, ...driftFacts] };

  const violations = checkTriggers(full);
  if (violations.length === 0) process.exit(0);

  console.error('🚫 Sherpa: 산출물 트리거 미충족 — 커밋을 막습니다 (§6-A).');
  for (const v of violations) {
    if (v.kind === 'report-trigger') {
      console.error(`  • plan '${v.plan}' 태스크가 전부 완료됨 → report 작성이 필요합니다 (§2.2).`);
    } else if (v.kind === 'spec-trigger') {
      console.error(`  • spec '${v.spec}' 가 코드 변경과 드리프트 → 재검증·갱신이 필요합니다 (§6-I).`);
    }
  }
  process.exit(2); // 차단 — stderr가 에이전트 컨텍스트로 주입됨
}

main().catch((err) => {
  console.error(err);
  process.exit(0); // 검사 자체 실패는 차단하지 않음(작업 방해 최소)
});

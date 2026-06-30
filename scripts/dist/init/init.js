import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { planScaffold } from './scaffold.js';
// 스캐폴드 계획 실행 (부작용). 기존 파일은 덮어쓰지 않음 — 레포 소유 보호(재생성은 --upgrade §5.1).
export async function executeScaffold(plan, pluginRoot, targetRoot) {
    for (const dir of plan.dirs) {
        await mkdir(join(targetRoot, dir), { recursive: true });
    }
    let created = 0;
    let skipped = 0;
    for (const { from, to } of plan.copies) {
        const dest = join(targetRoot, to);
        if (existsSync(dest)) {
            skipped++;
            continue;
        }
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, await readFile(join(pluginRoot, from), 'utf8'));
        created++;
    }
    return { created, skipped };
}
// CLI 진입점 — 부작용 경계. pluginRoot는 템플릿 위치(${CLAUDE_PLUGIN_ROOT}), targetRoot는 현재 레포.
const invokedDirectly = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (invokedDirectly) {
    const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
    const targetRoot = process.cwd();
    const stream = process.argv[2] || undefined;
    executeScaffold(planScaffold({ stream }), pluginRoot, targetRoot)
        .then((r) => console.log(`Sherpa 초기화 완료 — 거버넌스 ${r.created}개 생성, ${r.skipped}개 유지(기존). 다음: /sherpa-reindex 로 INDEX·대시보드 생성.`))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

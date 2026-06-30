import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { planScaffold, type ScaffoldPlan } from './scaffold.js';
import { isInvokedDirectly } from '../utils/cli.js';

// 스캐폴드 계획 실행 (부작용). 기존 파일은 덮어쓰지 않음 — 레포 소유 보호(재생성은 --upgrade §5.1).
export async function executeScaffold(
  plan: ScaffoldPlan,
  pluginRoot: string,
  targetRoot: string,
): Promise<{ created: number; skipped: number }> {
  await Promise.all(plan.dirs.map((dir) => mkdir(join(targetRoot, dir), { recursive: true })));

  const created = await Promise.all(
    plan.copies.map(async ({ from, to }) => {
      const dest = join(targetRoot, to);
      if (existsSync(dest)) return false; // 기존 보호
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, await readFile(join(pluginRoot, from), 'utf8'));
      return true;
    }),
  );

  const createdCount = created.filter(Boolean).length;
  return { created: createdCount, skipped: created.length - createdCount };
}

// CLI 진입점 — pluginRoot는 템플릿 위치(${CLAUDE_PLUGIN_ROOT}), targetRoot는 현재 레포.
if (isInvokedDirectly(import.meta.url)) {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ?? process.cwd();
  const targetRoot = process.cwd();
  const stream = process.argv[2];
  executeScaffold(planScaffold({ stream }), pluginRoot, targetRoot)
    .then((r) =>
      console.log(
        `Sherpa 초기화 완료 — 거버넌스 ${r.created}개 생성, ${r.skipped}개 유지(기존). 다음: /sherpa-reindex 로 INDEX·대시보드 생성.`,
      ),
    )
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

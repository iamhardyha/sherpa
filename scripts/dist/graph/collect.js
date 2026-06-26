import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
// graph가 파싱하는 산출물 디렉토리 (lens는 HTML, archive는 묘지 — 제외)
export const ARTIFACT_DIRS = ['adr', 'plan', 'spec', 'report'];
// docs/{type}/ 의 산출물 .md를 읽어 entries로 (§4.7 파서 입력).
// INDEX(뷰 §3)는 제외. 디렉토리가 없으면 건너뛴다.
export async function collectEntries(docsDir) {
    const entries = [];
    for (const type of ARTIFACT_DIRS) {
        const typeDir = join(docsDir, type);
        let names;
        try {
            names = await readdir(typeDir, { recursive: true });
        }
        catch {
            continue; // 해당 산출물 디렉토리 없음
        }
        for (const name of names) {
            if (!name.endsWith('.md') || name.endsWith('INDEX.md'))
                continue;
            const path = join(typeDir, name);
            const content = await readFile(path, 'utf8');
            entries.push({ path, content });
        }
    }
    return entries;
}

import { join } from 'node:path';
const MD_LINK = /\[[^\]]*\]\(([^)]+)\)/g;
// 마크다운에서 로컬 경로 링크만 추출 — 외부 URL(스킴)·순수 앵커 제외, 앵커는 잘라낸다.
export function extractLinks(markdown) {
    const links = [];
    for (const match of markdown.matchAll(MD_LINK)) {
        const target = match[1].split('#')[0].trim(); // 앵커 제거
        if (target === '')
            continue; // 순수 앵커(#foo)
        if (/^[a-z][a-z0-9+.-]*:/i.test(target))
            continue; // http: mailto: 등 스킴
        links.push(target);
    }
    return links;
}
// 로컬 링크 대상이 존재 집합에 없으면 broken (existing 주입 — 순수, 부작용은 호출자).
export function checkLinks(markdown, fromDir, existing) {
    const broken = [];
    for (const link of extractLinks(markdown)) {
        const resolved = join(fromDir, link);
        if (!existing.has(resolved))
            broken.push(resolved);
    }
    return broken;
}

// §2.8 태스크 라인: …— [x] 구현 [ ] 테스트. 라인마다 구현·테스트 체크를 센다.
const TASK_LINE = /\[([ xX])\]\s*구현.*?\[([ xX])\]\s*테스트/;
export function parseProgress(body) {
    const impl = { done: 0, total: 0 };
    const test = { done: 0, total: 0 };
    for (const line of body.split('\n')) {
        const match = line.match(TASK_LINE);
        if (!match)
            continue;
        impl.total++;
        test.total++;
        if (match[1].toLowerCase() === 'x')
            impl.done++;
        if (match[2].toLowerCase() === 'x')
            test.done++;
    }
    return { impl, test };
}

// CLI로 직접 실행됐는지 — import.meta.url이 실행 스크립트와 일치하나. (CLI 진입점 가드 공용)
export function isInvokedDirectly(importMetaUrl) {
    const script = process.argv[1];
    return script ? importMetaUrl.endsWith(script.split('/').pop()) : false;
}

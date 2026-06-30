// §6-D 트리비얼 판정 — 기계가 한다(LLM 재량 아님). 변경된 줄(diff +/-)을 받아 분류.
// 문서에서 trivial이 아닌(구조를 건드리는) 줄 패턴
const NON_TRIVIAL_DOC = [
    /^---\s*$/, // frontmatter 구분자
    /^[a-z][\w-]*:\s/i, // frontmatter 필드(key: value)
    /\[[^\]]*\]\([^)]+\)/, // 마크다운 링크
    /^\s*```/, // 코드펜스
    /^#{1,6}\s/, // heading(anchor 영향)
];
// prose 본문 줄만 바뀌면 trivial. 구조(frontmatter·링크·펜스·heading)를 건드리면 non-trivial.
export function isTrivialDoc(changedLines) {
    return !changedLines.some((line) => NON_TRIVIAL_DOC.some((re) => re.test(line)));
}
// 주석 시작 마커(공통 — //, #, /* * */)
const COMMENT = /^(\/\/|#|\/\*|\*\/|\*)/;
// 빈 줄·주석만이면 trivial. 동작 줄이 하나라도 있으면 non-trivial.
// (들여쓰기가 바뀐 줄은 trim 후 내용이 남으므로 코드 줄로 보아 non-trivial — 언어 안전)
export function isTrivialCode(changedLines) {
    for (const line of changedLines) {
        const trimmed = line.trim();
        if (trimmed === '' || COMMENT.test(trimmed))
            continue;
        return false;
    }
    return true;
}

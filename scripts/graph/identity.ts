import { basename } from 'node:path';

export interface Identity {
  type: string;
  nnnn: string;
  id: string;
}

// §2.8: docs/{type}/{NNNN}-{date}-{slug}.md → id={date}-{slug}(영구), NNNN은 표시용.
export function deriveIdentity(path: string): Identity {
  const segments = path.split('/');
  const docsIdx = segments.indexOf('docs');
  const type = segments[docsIdx + 1];

  // spec은 docs/spec/{domain}/{name}.md → id={domain}/{name} (날짜·NNNN 없음)
  if (type === 'spec') {
    const rest = segments.slice(docsIdx + 2);
    const name = basename(rest[rest.length - 1], '.md');
    const domain = rest.slice(0, -1).join('/');
    return { type, nnnn: '', id: domain ? `${domain}/${name}` : name };
  }

  const stem = basename(path, '.md');
  const match = stem.match(/^(\d+)-(\d{4}-\d{2}-\d{2}-.+)$/);
  if (!match) throw new Error(`잘못된 산출물 파일명: ${path}`);

  return { type, nnnn: match[1], id: match[2] };
}

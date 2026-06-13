// 最小 BibTeX 解析：@type{key, field={value} | field="value"}
// 不支持嵌套花括号字段——v0.1 够用，复杂条目由换真阶段的解析库接管
export interface BibEntry {
  key: string;
  title: string;
  year: number;
  journal: string;
  abstract: string;
  author: string;
}

export function parseBibtex(src: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const entryRe = /@\w+\s*\{\s*([^,]+),([\s\S]*?)\}\s*(?=@|\s*$)/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(src))) {
    const fields: Record<string, string> = {};
    const fieldRe = /(\w+)\s*=\s*(?:\{([^{}]*)\}|"([^"]*)")/g;
    let f: RegExpExecArray | null;
    while ((f = fieldRe.exec(m[2]))) {
      fields[f[1].toLowerCase()] = (f[2] ?? f[3] ?? '').trim();
    }
    entries.push({
      key: m[1].trim(),
      title: fields.title ?? '',
      year: Number(fields.year ?? 0),
      journal: fields.journal ?? '',
      abstract: fields.abstract ?? '',
      author: fields.author ?? ''
    });
  }
  return entries.filter((e) => e.title);
}

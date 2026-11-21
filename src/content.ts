import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';

const text = z.string().trim().min(1);
const siteSchema = z.strictObject({
  title: text,
  url: z.httpUrl().refine(value => {
    const url = new URL(value);
    return url.pathname.endsWith('/') && !url.search && !url.hash && !url.username && !url.password;
  }, 'Expected the public site root, ending in /'),
  language: text,
  author: z.strictObject({
    name: text,
    links: z.array(z.strictObject({
      label: text,
      icon: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a theme icon name'),
      url: z.url({ protocol: /^(https?|mailto)$/ }),
    })),
  }),
});

const postSchema = z.strictObject({
  title: text,
  date: z.iso.date(),
  tags: z.array(text),
});

function readYaml<T>(source: string, file: string, schema: z.ZodType<T>): T {
  try {
    const result = schema.safeParse(parse(source));
    if (result.success) return result.data;
    throw new Error(z.prettifyError(result.error));
  } catch (error) {
    throw new Error(`${file}: ${error instanceof Error ? error.message : error}`);
  }
}

export function readSite() {
  const file = 'site.yaml';
  return readYaml(readFileSync(file, 'utf8'), file, siteSchema);
}

export function readPosts() {
  const posts = readdirSync('content/posts', { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(({ name }) => {
      const file = `content/posts/${name}`;
      const source = readFileSync(file, 'utf8');
      const header = /^---\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m.exec(source);
      if (!header || header.index !== 0) throw new Error(`${file}: expected YAML front matter`);
      const slug = name.slice(0, -3);
      if (!slug || slug === '.' || slug === '..') throw new Error(`${file}: invalid post filename`);
      return {
        ...readYaml(header[1], file, postSchema),
        file,
        url: `/posts/${encodeURIComponent(slug)}/`,
        markdown: source.slice(header[0].length),
      };
    });
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url, 'en'));
}

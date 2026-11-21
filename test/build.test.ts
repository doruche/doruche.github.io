import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

test('builds linked Markdown under a subpath and keeps the last valid build', t => {
  const directory = mkdtempSync(join(tmpdir(), 'blog-build-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const folder of ['assets', 'theme']) cpSync(folder, join(directory, folder), { recursive: true });
  writeFileSync(join(directory, 'site.yaml'), [
    'title: Example', 'url: https://example.org/blog/', 'language: zh-CN',
    'author:', '  name: Author', '  links: []',
  ].join('\n'));
  const posts = join(directory, 'content/posts');
  mkdirSync(posts, { recursive: true });
  const header = '---\ntitle: Example\ndate: 2026-11-21\ntags: []\n---\n';
  writeFileSync(join(posts, 'a.md'), header + '五十分钟~~（没有打错）~~。见[第二篇](./b.md)。');
  writeFileSync(join(posts, 'b.md'), header);
  const generate = () => execFileSync(process.execPath, [join(import.meta.dirname, '../src/build.ts')], {
    cwd: directory, stdio: 'pipe',
  });
  generate();
  const published = join(directory, 'public/posts/a/index.html');
  const article = readFileSync(published, 'utf8');
  assert.match(article, /五十分钟<s>（没有打错）<\/s>/);
  assert.match(article, /href="\/blog\/posts\/b\/">第二篇/);
  assert.match(article, /rel="canonical" href="https:\/\/example.org\/blog\/posts\/a\/"/);

  writeFileSync(join(posts, 'b.md'), header.replace('tags: []', 'tag: []'));
  assert.throws(generate, /content\/posts\/b\.md[\s\S]*tags/);
  assert.equal(readFileSync(published, 'utf8'), article);
  rmSync(join(posts, 'b.md'));
  assert.throws(generate, /content\/posts\/a\.md: unknown local link .\/b.md/);
});

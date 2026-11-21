import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ejs from 'ejs';
import { readPages, readPosts, readSite } from './content.ts';
import { renderMarkdown } from './markdown.ts';

const theme = 'theme/primitive';

function template(name: string) {
  const filename = `${theme}/${name}.ejs`;
  return ejs.compile(readFileSync(filename, 'utf8'), { filename });
}

export function build(output: string) {
  const site = readSite();
  const base = new URL(site.url);
  const url = (route: string) => base.pathname.slice(0, -1) + route;
  const posts = readPosts();
  const pages = readPages();
  const routes = new Map([...posts, ...pages].map(entry => [resolve(entry.file), entry.url]));
  const year = new Date().getFullYear();
  const layout = template('layout');
  const article = template('post');
  const standalone = template('page');
  const staging = mkdtempSync(resolve(output) + '-');
  try {
    function page(route: string, title: string, body: string) {
      const canonical = new URL(url(route), base.origin).href;
      const html = layout({ site, pages, year, url, route, title, canonical, body });
      const file = join(staging, decodeURIComponent(route), 'index.html');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html, { flag: 'wx' });
    }

    page('/', site.title, template('home')({ posts, url }));
    const groups = Map.groupBy(posts, post => post.date.slice(0, 4));
    const years = Array.from(groups, ([year, posts]) => ({ year, posts }));
    page('/archive/', `Archive · ${site.title}`, template('archive')({ years, url }));

    posts.forEach((post, index) => {
      const html = renderMarkdown(post.markdown, post.file, routes, url);
      const body = article({ post: { ...post, html }, newer: posts[index - 1], older: posts[index + 1], url });
      page(post.url, `${post.title} · ${site.title}`, body);
    });
    for (const entry of pages) {
      const html = renderMarkdown(entry.markdown, entry.file, routes, url);
      page(entry.url, `${entry.title} · ${site.title}`, standalone({ page: { ...entry, html }, url }));
    }
    cpSync('assets', join(staging, 'assets'), { recursive: true });
    mkdirSync(join(staging, theme), { recursive: true });
    for (const file of ['style.css', 'LICENSE']) {
      cpSync(join(theme, file), join(staging, theme, file));
    }
    chmodSync(staging, 0o755);
    rmSync(output, { recursive: true, force: true });
    renameSync(staging, output);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  return base.pathname;
}

if (import.meta.main) build('public');

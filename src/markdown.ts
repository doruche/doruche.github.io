import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, relative, sep } from 'node:path';
import MarkdownIt from 'markdown-it';
import cjkFriendly from 'markdown-it-cjk-friendly';

const markdown = new MarkdownIt({ linkify: true }).use(cjkFriendly);

// Numbered h2 headings open with a § link to themselves: <h2 id="section-1"><span><a>§1</a>Title</span></h2>.
// The span keeps the number on the same baseline as the title text.
const renderToken: NonNullable<typeof markdown.renderer.rules.heading_open> =
  (tokens, index, options, _env, self) => self.renderToken(tokens, index, options);
markdown.renderer.rules.heading_open = (tokens, index, options, env, self) => {
  const open = renderToken(tokens, index, options, env, self);
  const section = tokens[index].meta?.section;
  if (!section) return open;
  return `${open}<span class="section-heading"><a class="section-number" href="#section-${section}" aria-label="Section ${section}">§${section}</a>`;
};
markdown.renderer.rules.heading_close = (tokens, index, options, env, self) => {
  const close = renderToken(tokens, index, options, env, self);
  return tokens[index].meta?.section ? `</span>${close}` : close;
};

export type Section = { number: number; id: string; title: string };
const assets = resolve('assets');

export function renderMarkdown(
  source: string, file: string, routes: Map<string, string>, sitePath: (route: string) => string,
  { numberSections = false } = {},
) {
  function publishedLink(href: string) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(href)) return href;
    if (href.startsWith('/')) return sitePath(href);

    const target = new URL(href, pathToFileURL(resolve(file)));
    const path = fileURLToPath(target);
    let route = routes.get(path);
    if (!route && path.startsWith(assets + sep) && existsSync(path)) {
      const assetPath = relative(assets, path).split(sep).map(encodeURIComponent).join('/');
      route = '/assets/' + assetPath;
    }
    if (!route) throw new Error(`${file}: unknown local link ${href}`);
    return sitePath(route) + target.search + target.hash;
  }

  const tokens = markdown.parse(source, {});
  const sections: Section[] = [];
  if (numberSections) {
    tokens.forEach((token, index) => {
      if (token.type !== 'heading_open' || token.tag !== 'h2') return;
      const number = sections.length + 1;
      const id = `section-${number}`;
      token.attrSet('id', id);
      token.meta = { section: number };
      tokens[index + 2].meta = { section: number };
      const title = (tokens[index + 1].children ?? [])
        .map(child => (child.type === 'softbreak' ? ' ' : child.type === 'text' || child.type === 'code_inline' ? child.content : ''))
        .join('')
        .trim();
      sections.push({ number, id, title });
    });
  }
  for (const block of tokens) {
    for (const token of block.children ?? []) {
      if (token.type === 'link_open' || token.type === 'image') {
        const attr = token.type === 'image' ? 'src' : 'href';
        const href = token.attrGet(attr);
        if (typeof href === 'string' && href) token.attrSet(attr, publishedLink(href));
      }
    }
  }
  return { html: markdown.renderer.render(tokens, markdown.options, {}), sections };
}

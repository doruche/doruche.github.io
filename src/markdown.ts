import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, relative, sep } from 'node:path';
import MarkdownIt from 'markdown-it';
import cjkFriendly from 'markdown-it-cjk-friendly';

const markdown = new MarkdownIt({ linkify: true }).use(cjkFriendly);
const assets = resolve('assets');

export function renderMarkdown(
  source: string, file: string, postUrls: Map<string, string>, sitePath: (route: string) => string,
) {
  function publishedLink(href: string) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(href)) return href;
    if (href.startsWith('/')) return sitePath(href);

    const target = new URL(href, pathToFileURL(resolve(file)));
    const path = fileURLToPath(target);
    let route = postUrls.get(path);
    if (!route && path.startsWith(assets + sep) && existsSync(path)) {
      const assetPath = relative(assets, path).split(sep).map(encodeURIComponent).join('/');
      route = '/assets/' + assetPath;
    }
    if (!route) throw new Error(`${file}: unknown local link ${href}`);
    return sitePath(route) + target.search + target.hash;
  }

  const tokens = markdown.parse(source, {});
  for (const block of tokens) {
    for (const token of block.children ?? []) {
      if (token.type === 'link_open' || token.type === 'image') {
        const attr = token.type === 'image' ? 'src' : 'href';
        const href = token.attrGet(attr);
        if (typeof href === 'string' && href) token.attrSet(attr, publishedLink(href));
      }
    }
  }
  return markdown.renderer.render(tokens, markdown.options, {});
}

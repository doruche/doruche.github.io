# doruche's blog

Source for [i.doruche.cc](https://i.doruche.cc/), a static blog with the Primitive theme.

## Development

Use Node 26 and the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm run server
```

Open `http://127.0.0.1:4000/`. After an edit, refresh the page. Use `pnpm run build` to generate `public/`. Pushes to `main` publish that directory to GitHub Pages.

## Writing

Edit site details and personal links in `site.yaml`. Put each article in `content/posts/<name>.md`; its published address is `/posts/<name>/`. All three header fields are required.

```yaml
---
title: My article
date: 2026-11-21
tags: []
---
```

Standalone pages such as About live in `content/pages/<name>.md` and are published at `/<name>/`. Each one appears as a text link in the site navigation, labelled with its title. Pages need these header fields:

```yaml
---
title: About
updated: 2026-11-21
---
```

Link to another article with `[title](./other-post.md)`, or from a page with `[title](../posts/other-post.md)`. Keep images in `assets/` and reference them from Markdown with paths such as `../../assets/photo.png`.

Page templates and styles live in `theme/primitive/`. The generator lives in `src/`.

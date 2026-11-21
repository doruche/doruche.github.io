# doruche's blog

This is the source repository for [i.doruche.cc](https://i.doruche.cc), a
[Hexo](https://hexo.io/) static site.

## Local development

Use the Node.js version in `.nvmrc` and the pnpm version in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm run server
```

Generate the site into `public/` with `pnpm run build`.

The site is built and deployed by GitHub Actions on pushes to `main`.

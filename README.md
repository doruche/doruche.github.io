# doruche's blog

This is the source repository for [i.doruche.cc](https://i.doruche.cc), a
[Hexo](https://hexo.io/) static site.

## Local development

Enter the reproducible Nix environment and install the locked npm
dependencies:

```bash
nix develop
npm ci
npm run server
```

Generate the site into `public/` with `npm run build`. The generated directory,
`node_modules/`, and Hexo's `db.json` cache are intentionally not tracked.

The site is built and deployed by GitHub Actions on pushes to `main`.

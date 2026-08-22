# W.A.T.A. Tech Hub

The central, access-aware launcher for W.A.T.A. applications and share-ready instructions.

- Production: `https://wata.cleanwata.org`
- Cloudflare project: `wata-tech-hub`
- Access directory: Airtable `🔐 App Access`

## Build

```sh
npm run check
npm run build
```

The static site and Pages advanced-mode Worker are written to `dist/`. Cloudflare Pages should use `npm run build` and `dist` as its output directory.

## Deployment boundary

This repository owns only the Tech Hub frontend, PWA, icons, instructions, and Hub gateway. During the controlled migration, `/api/` uses a service binding named `PORTAL` to the proven read-only `wata-partner-portals` Worker. Registry frontend code and Registry PWA assets are not deployed from this repository.

Production domain routing must not move until a preview deployment passes desktop, mobile, authentication, card-link, and PWA checks.

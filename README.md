# W.A.T.A. Tech Hub

The central, access-aware launcher for W.A.T.A. applications and share-ready instructions.

- Production: `https://wata.cleanwata.org`
- Preview: `https://wata-tech-hub.pages.dev`
- Cloudflare project: `wata-tech-hub`
- Access directory: Airtable `🔐 App Access`

## Build

```sh
npm run check
npm run build
```

The static site and Pages advanced-mode Worker are written to `dist/`. Cloudflare Pages is connected directly to this GitHub repository and deploys `main` automatically with `npm run build` and `dist` as its output directory.

## Deployment boundary

This repository owns only the Tech Hub frontend, PWA, icons, instructions, and Hub gateway. `/api/` uses a service binding named `PORTAL` to the proven authorization/data Worker, `wata-partner-portals`. Registry frontend code and Registry PWA assets are not deployed from this repository.

Cloudflare Access protects the production hostname with the `Airtable App Access directory` policy. The Access application includes both `wata.cleanwata.org` and the current `wata-tech-hub.pages.dev` project destination so the production hostname remains attached to the correct Pages project.

The legacy `wata-partner-portals-gateway` Pages project is retained temporarily for rollback only. It no longer owns the Tech Hub production domain.

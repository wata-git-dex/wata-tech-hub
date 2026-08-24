# W.A.T.A. Toolkit

The central, access-aware launcher for W.A.T.A. applications and share-ready instructions.

- Production: `https://toolkit.cleanwata.org`
- Compatibility addresses: `https://app.cleanwata.org`, `https://wata.cleanwata.org`
- Preview: `https://wata-tech-hub.pages.dev`
- Cloudflare project: `wata-tech-hub`
- Access directory: Airtable `🔐 App Access`

## Build

```sh
npm run check
npm run build
```

The static site and Pages advanced-mode Worker are written to `dist/`. Cloudflare Pages is connected directly to this GitHub repository and deploys `main` automatically with `npm run build` and `dist` as its output directory.

## Shared-data integration boundary

`data-adapter.js` is the only UI-facing identity/data boundary. The interface calls `getSession()`, `signIn(email)`, `signOut()`, `getBootstrap()`, and `updateProfile(profile)` there. Today, `getBootstrap()` preserves the existing `/api/bootstrap` request and normalizes the current Airtable/Worker payload into the future shared response shape (`user`, `profile`, `roles`, `apps`, and `trips`).

Profile edits in this interface pass are explicitly temporary local drafts. They do not create a Toolkit-only users table, profile database, authentication service, or roles/permissions matrix. The later ecosystem identity integration should replace the adapter internals, not the views.

## Deployment boundary

This repository owns only the Toolkit frontend, PWA, icons, instructions, and gateway. `/api/` uses a service binding named `PORTAL` to the proven authorization/data Worker, `wata-partner-portals`. Registry frontend code and Registry PWA assets are not deployed from this repository.

Cloudflare Access protects the production hostnames with the existing `Airtable App Access directory` policy. The Access application includes canonical `toolkit.cleanwata.org`, compatibility addresses `app.cleanwata.org` and `wata.cleanwata.org`, and the current `wata-tech-hub.pages.dev` project destination. Normal browser visits to `app.cleanwata.org` move to the canonical Toolkit address; an existing standalone PWA remains available on the old origin until it is reinstalled.

The Toolkit shows one `Filter Registry` app. `Partner Portal` is the partner-scoped experience inside that Registry, not a separate app or deployment.

The legacy `wata-partner-portals-gateway` Pages project is retained temporarily for rollback only. It no longer owns the Toolkit production domain.

## Install icon

The approved Toolkit artwork is exported in `assets/tech-hub/` at 32, 180, 192, and 512 pixels. The build also publishes conventional `/apple-touch-icon.png` and `/favicon-32.png` paths so macOS, iOS, and browser PWA installers do not fall back to a generated letter icon. Installed web apps retain a local copy of their icon; after an icon release, remove and reinstall an older standalone app to refresh that copy.

# W.A.T.A. Wonderful World

The primary member-facing W.A.T.A. account, shared-profile, and personal Toolkit surface. Community remains a separate optional application. The Toolkit launcher is one function inside Wonderful World, not a separate identity system.

The 2026-09-09 navigation cohesion pass follows `../../docs/WATA-NAVIGATION-SYSTEM.md`: 44 px rounded-square header utilities, a compact flag-and-language popover, a grouped right drawer, synchronized language state, collapsed settings panels, keyboard/scrim/close behavior, and a separated sign-out action. Toolkit has no implemented notifications feed, so it intentionally omits the bell rather than presenting fake unread data.

The 2026-09-11 safe-area candidate uses `viewport-fit=cover` plus one four-edge inset contract for the sticky header, landscape sidebar, content/footer edges, and full-height drawer. Synthetic portrait/landscape browser acceptance is recorded in `../../docs/WATA-SAFE-AREA-RELEASE-GATE.md`; physical iPhone Safari and installed-PWA acceptance remain pending and must not be inferred from CSS checks.

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

`data-adapter.js` is the only UI-facing identity/data boundary. The interface calls `getSession()`, `signIn()`, `signOut()`, and `getBootstrap()` there. Today, `getBootstrap()` preserves the existing `/api/bootstrap` request and normalizes the current Airtable/Worker payload into the shared response shape (`user`, `profile`, `roles`, `apps`, `trips`, and an optional person-scoped `filters` list).

The branded entry screen deliberately continues to the existing secure verification flow. It does not copy Community's origin-local Supabase session or pretend the future server-managed cross-domain session is already deployed. Google and W.A.T.A. credentials may appear as separate methods only when the platform session service can bind both to the same canonical identity.

`filters` is the **My Filters** relationship view, not a Registry grant. The adapter retains only stable filter identity, location summary, status, and verified relationship type. Full Filter Registry access still requires its own app grant and operational scopes.

The W.A.T.A. platform owns one reusable shared-profile component; Toolkit must host that component in place and must not create a Toolkit-only profile store or require a visit to Community. The current read-only profile surface remains an integration gap until the coordinated component adapter is accepted. Follow `../../docs/WATA-SHARED-PROFILE-SYSTEM.md` before changing that boundary.

## Deployment boundary

This repository owns only the Toolkit frontend, PWA, icons, instructions, and gateway. `/api/` uses a service binding named `PORTAL` to the proven authorization/data Worker, `wata-partner-portals`. Registry frontend code and Registry PWA assets are not deployed from this repository.

Cloudflare Access protects the production hostnames with the existing `Airtable App Access directory` policy. The Access application includes canonical `toolkit.cleanwata.org`, compatibility addresses `app.cleanwata.org` and `wata.cleanwata.org`, and the current `wata-tech-hub.pages.dev` project destination. Normal browser visits to `app.cleanwata.org` move to the canonical Toolkit address; an existing standalone PWA remains available on the old origin until it is reinstalled.

The Toolkit shows one `Filter Registry` app. `Partner Portal` is the partner-scoped experience inside that Registry, not a separate app or deployment.

The legacy `wata-partner-portals-gateway` Pages project is retained temporarily for rollback only. It no longer owns the Toolkit production domain.

## Install icon

The approved Toolkit artwork is exported in `assets/tech-hub/` at 32, 180, 192, and 512 pixels. The build also publishes conventional `/apple-touch-icon.png` and `/favicon-32.png` paths so macOS, iOS, and browser PWA installers do not fall back to a generated letter icon.

Cloudflare Access application `W.A.T.A. Toolkit Install Assets` bypasses authentication only for the manifest, conventional install icons, and `/assets/tech-hub/icon-*`. This lets an operating-system installer fetch the artwork without exposing the protected Toolkit page, APIs, or user data. Installed web apps retain a local copy of their icon; after an icon release, remove and reinstall an older standalone app to refresh that copy.

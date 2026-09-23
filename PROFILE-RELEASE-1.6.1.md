# Wonderful World 1.6.1

Released 2026-09-23. Application commit e55df470a79d70fd9a206dd25f123981f177b2ff.
Deployment: https://74fe4ac6.wata-tech-hub.pages.dev
Public entry: https://wata.cleanwata.org/#profile

- Map-first travel: search or open the country list; selected silhouette tiles below map.
- Icon-led tabs and identity/location fields; separate city and country controls.
- Sun/moon appearance cards, accent dots and language choices.
- Full-width profile and clearer sidebar selection.
- Local 512px JPEG crop/zoom with position sliders, upload/save status and 45-second timeout.
- Form hidden until its external stylesheet loads to prevent unstyled flashes.

Verification: 30 repository tests; separate DOM tests of failed-save/draft/timeout recovery and map selection; local browser crop/zoom/use/cancel and test-adapter save; desktop and 390px phone light/dark review. Public HTML and five changed asset hashes verified against isolated build. Shared profile artifact 1.2.1 is checksummed in vendor manifest. Existing permissions and backend unchanged.

Not claimed: new authenticated production save, measured live-upload latency, Marissa access or invitation-to-install acceptance. Sign-in UI was verified live. Preserve saved drafts before refreshing; footer/menu should report 1.6.1. Rollback application commit: 937ff8c9c76ec9095fa255a336fc991a797fd364.

Unrelated companion/connected-preview work remains in the original worktree and was excluded from the release.

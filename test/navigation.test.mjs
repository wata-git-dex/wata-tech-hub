import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("header uses the shared Toolkit language and menu controls", async () => {
  const html = await source("index.html");
  const css = await source("styles.css");
  assert.match(html, /id="languageMenuButton"[^>]+aria-controls="languageMenu"/);
  assert.match(html, /id="menuButton"[^>]+aria-controls="menuDrawer"/);
  assert.match(html, /🇺🇸[\s\S]*English/);
  assert.match(html, /🇪🇸[\s\S]*Español/);
  assert.match(css, /\.language-button,\.menu-button\{width:44px;height:44px/);
  assert.match(css, /border-radius:13px/);
  assert.doesNotMatch(html, /id="notificationsButton"/);
});

test("drawer makes the shared profile and personal work the primary navigation", async () => {
  const html = await source("index.html");
  const app = await source("app.js");
  assert.match(html, /menu-section-label">Your world/);
  assert.match(html, /data-view="profile"[\s\S]*data-view="filters"[\s\S]*data-view="trips"[\s\S]*data-view="distributions"[\s\S]*data-view="training"/);
  assert.match(html, /menu-section-label">Toolkit[\s\S]*data-view="toolkit"/);
  assert.match(html, /Mission, Vision &amp; Goals/);
  assert.match(html, /Your shared W\.A\.T\.A\. identity/);
  assert.match(html, /id="appearancePanel" hidden/);
  assert.match(html, /id="drawerLanguagePanel"[\s\S]*hidden/);
  assert.match(html, /id="signOutButton"/);
  assert.match(html, /<span>W\.A\.T\.A\. Wonderful World<\/span><strong>v1\.5\.0<\/strong>/);
  assert.match(app, /dataAdapter\.signOut\(\)/);
  assert.match(app, /syncCurrentDestination/);
  assert.match(app, /drawerReturnFocus = menuButton/);
  assert.match(app, /#closeMenu/);
});

test("service worker precaches the revised navigation assets", async () => {
  const worker = await source("sw.js");
  assert.match(worker, /wata-wonderful-world-v33-shared-profile-travel/);
  assert.match(worker, /styles\.css\?v=47/);
  assert.match(worker, /app\.js\?v=42/);
  assert.match(worker, /lib\/wata-profile\.js\?v=1\.1\.0/);
});

test("Wonderful World owns the branded shared-identity sign-in surface", async () => {
  const app = await source("app.js");
  const adapter = await source("data-adapter.js");
  const html = await source("index.html");
  assert.match(html, /<title>W\.A\.T\.A\. Wonderful World<\/title>/);
  assert.match(app, /One profile\.<br>Every approved tool\./);
  assert.match(app, /Sign in with Google/);
  assert.match(app, /Sign in with W\.A\.T\.A\./);
  assert.match(app, /Signing in verifies your identity/);
  assert.match(adapter, /SupabaseAuth/);
  assert.match(adapter, /\/api\/shared\/me/);
});

test("shared profile includes the saved personal-travel map", async () => {
  const app = await source("app.js");
  const css = await source("styles.css");
  assert.match(app, /countries\.geojson/);
  assert.match(app, /countries_visited/);
  assert.match(app, /This is your personal travel history/);
  assert.match(app, /data-profile-country/);
  assert.match(css, /\.profile-country-map path\.selected/);
});

test("My Filters is presented as a person-scoped view rather than Registry access", async () => {
  const app = await source("app.js");
  assert.match(app, /Filters connected directly to your verified W\.A\.T\.A\. identity/);
  assert.match(app, /does not provide partner-wide Filter Registry access/);
});

test("Wonderful World hosts the immutable shared profile component behind the platform adapter", async () => {
  const app = await source("app.js");
  const build = await source("scripts/build.sh");
  assert.match(app, /mountWataProfile/);
  assert.match(app, /isWataProfileComplete/);
  assert.match(app, /integration\?\.profile\?\.writable/);
  assert.match(app, /completeOnboarding: state\.profileMode === "onboarding"/);
  assert.match(app, /localStorage\.removeItem\(SNAPSHOT_KEY\)/);
  assert.match(build, /vendor\/shared-profile\/1\.1\.0\/wata-profile\.js/);
  assert.doesNotMatch(app, /community\.cleanwata\.org\/#profile/);
});

test("Wonderful World opens on the member profile and keeps apps inside Toolkit", async () => {
  const app = await source("app.js");
  assert.match(app, /location\.hash\.slice\(1\) \|\| "profile"/);
  assert.match(app, /if \(currentView === "home"\) currentView = "profile"/);
  assert.match(app, /function profileView\(\)/);
  assert.match(app, /function toolkitView\(\)/);
  assert.match(app, /Profile[\s\S]*My filters[\s\S]*Trips[\s\S]*Distributions[\s\S]*Training[\s\S]*Toolkit/);
  assert.doesNotMatch(app, /quickLinks\.innerHTML = bootstrap\.apps/);
});

test("phone safe areas cover portrait and landscape without stacked inset padding", async () => {
  const html = await source("index.html");
  const css = await source("styles.css");
  assert.match(html, /viewport-fit=cover/);
  for (const edge of ["top", "right", "bottom", "left"]) {
    assert.match(css, new RegExp(`--safe-${edge}:env\\(safe-area-inset-${edge},0px\\)`));
  }
  assert.match(css, /body,\.shell\{min-height:100dvh\}/);
  assert.match(css, /\.sidebar\{[\s\S]*height:100dvh;[\s\S]*var\(--safe-top\)[\s\S]*var\(--safe-bottom\)[\s\S]*var\(--safe-left\)/);
  assert.match(css, /\.topbar\{[\s\S]*min-height:calc\(66px \+ var\(--safe-top\)\)[\s\S]*padding-top:calc\(10px \+ var\(--safe-top\)\)[\s\S]*var\(--safe-right\)/);
  assert.match(css, /\.content\{[\s\S]*var\(--safe-right\)[\s\S]*var\(--safe-bottom\)/);
  assert.match(css, /\.menu-drawer\{[\s\S]*var\(--safe-top\)[\s\S]*var\(--safe-right\)[\s\S]*var\(--safe-bottom\)/);
  assert.doesNotMatch(css, /calc\([^)]*var\(--safe-top\)[^)]*var\(--safe-top\)/);
});

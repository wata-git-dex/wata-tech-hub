import { dataAdapter } from "./data-adapter.js";

const SNAPSHOT_KEY = "wata-tech-hub-bootstrap-v2";
const SNAPSHOT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const WATA_REFERENCE_COPY = Object.freeze({
  mission: "Water Access To All brings clean, safe drinking water to communities without reliable access—installing filtration systems while developing the local capacity and leadership to carry the work forward.",
  vision: "A world where every community has lasting access to clean water—and where local youth lead that change, supported by outside partners but never dependent on them.",
  taxId: "99-2348652",
  boilerplate: "Water Access To All (W.A.T.A.) is a registered 501(c)(3) nonprofit bringing clean, safe drinking water to communities without reliable access through filtration, training, and locally led implementation. W.A.T.A. works alongside local leaders and partners to build lasting capacity so communities can carry the work forward."
});

const state = { loading: true, error: null, bootstrap: null, offlineSnapshot: false, saving: false };
let currentView = location.hash.slice(1) || "home";
const app = document.querySelector("#app");
const drawer = document.querySelector("#menuDrawer");
const scrim = document.querySelector("#drawerScrim");
const menuButton = document.querySelector("#menuButton");

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const display = (value, fallback = "Not provided") => value == null || value === "" || (Array.isArray(value) && !value.length) ? fallback : Array.isArray(value) ? value.join(", ") : String(value);

function guideList(appData) {
  if (appData.app_key === "filter_registry") return [
    { format: "PDF", label: "Complete instructions", url: "/guides/WATA_Partner_Portal_Guide.pdf" },
    { format: "PNG", label: "Share-ready one-pager", url: "/guides/WATA_Partner_Portal_Guide_Page_2.png" }
  ];
  return Array.isArray(appData.guides) ? appData.guides : [];
}

function iconFor(appData) {
  if (appData.icon_path) return `<img src="${escapeHtml(appData.icon_path)}" alt="">`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h6l1.8 2H20.5v10h-17z"/><path d="M8 13h8M12 9v8"/></svg>`;
}

function statusLabel(status) {
  return status === "ready" ? "Ready" : "Coming soon";
}

function appCard(appData) {
  const ready = appData.status === "ready" && Boolean(appData.url);
  const guides = guideList(appData);
  return `<article class="app-card ${ready ? "ready" : "soon"}" tabindex="${ready ? "0" : "-1"}" ${ready ? `role="link" data-app-url="${escapeHtml(appData.url)}"` : ""}>
    <div class="card-top"><span class="card-icon">${iconFor(appData)}</span><span class="status ${ready ? "ready" : "soon"}">${statusLabel(appData.status)}</span></div>
    <h3>${escapeHtml(appData.name)}</h3><p>${escapeHtml(appData.description)}</p>
    <details class="instructions"><summary>Instructions <span aria-hidden="true">⌄</span></summary><div>${guides.length ? guides.map(guide => `<a href="${escapeHtml(guide.url)}" target="_blank" rel="noopener noreferrer"><b>${escapeHtml(guide.format)}</b>${escapeHtml(guide.label)}</a>`).join("") : `<span>PDF and PNG guide coming soon</span>`}</div></details>
  </article>`;
}

function tripDate(value) {
  if (!value) return { day: "—", month: "TBD" };
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.valueOf()) ? { day: "—", month: "TBD" } : { day: date.toLocaleDateString(undefined, { day: "2-digit", timeZone: "UTC" }), month: date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }) };
}

function tripRow(trip) {
  const start = tripDate(trip.starts_at);
  const context = [trip.program_name || trip.project_name, trip.country].filter(Boolean).join(" · ");
  const tag = trip.project_hub_url ? "a" : "div";
  const link = trip.project_hub_url ? ` href="${escapeHtml(trip.project_hub_url)}" target="_blank" rel="noopener noreferrer"` : "";
  return `<${tag} class="trip-row"${link}><span class="trip-date"><b>${start.day}</b><small>${start.month}</small></span><span class="trip-copy"><strong>${escapeHtml(trip.name)}</strong><small>${escapeHtml(context || "Details coming soon")}</small></span><span class="trip-role">${escapeHtml(trip.trip_role || "Assigned")}</span></${tag}>`;
}

function homeView() {
  const { apps, trips } = state.bootstrap;
  const ready = apps.filter(item => item.status === "ready");
  const development = apps.filter(item => item.status !== "ready");
  return `<section class="hero"><div class="hero-waves" aria-hidden="true"></div><div><p class="eyebrow">W.A.T.A. Tech Hub</p><h1>Apps &amp; instructions</h1><p>Links and guides available to your account.</p></div></section>
    ${trips.length ? `<section class="trips"><div class="section-head"><div><h2>Upcoming trips</h2><p>Your confirmed assignments.</p></div></div>${trips.map(tripRow).join("")}</section>` : ""}
    <section id="apps"><div class="section-head"><div><h2>Apps</h2><p>${ready.length ? "Open an app or expand its instructions." : "No apps are currently assigned to this account."}</p></div></div>${ready.length ? `<div class="app-grid">${ready.map(appCard).join("")}</div>` : `<div class="empty-state"><strong>No apps assigned</strong><p>Your Airtable App Access record is active, but no app checkboxes are currently enabled.</p></div>`}</section>
    ${development.length ? `<section class="development"><div class="section-head"><div><h2>In development</h2><p>Tools being built or prepared.</p></div></div><div class="app-grid">${development.map(appCard).join("")}</div></section>` : ""}
    ${state.offlineSnapshot ? `<div class="offline-note">Showing your last verified app view. Links may require a connection.</div>` : ""}`;
}

function inputField(name, label, value, options = {}) {
  const type = options.type || "text";
  const control = options.textarea
    ? `<textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea>`
    : `<input name="${escapeHtml(name)}" type="${type}" value="${escapeHtml(value)}">`;
  return `<label class="profile-field ${options.wide ? "wide" : ""}"><span>${escapeHtml(label)}</span>${control}</label>`;
}

function profileView() {
  const profile = state.bootstrap.profile;
  const roles = state.bootstrap.roles.map(role => role.replaceAll("_", " ")).join(" · ") || "Member";
  const initials = display(profile.display_name, profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return `<header class="view-head"><p class="eyebrow">Shared profile</p><h1>Your W.A.T.A. profile</h1><p>This screen is ready for the ecosystem-wide profile service. Until that integration, saved edits remain a local Hub draft.</p></header>
    <form id="profileForm" class="profile-card"><div class="profile-summary"><span class="profile-avatar">${escapeHtml(initials || "W")}</span><div><strong>${escapeHtml(display(profile.display_name, "W.A.T.A. member"))}</strong><small>${escapeHtml(roles)}</small></div></div>
      <div class="profile-grid">
        ${inputField("display_name", "Display name", profile.display_name)}${inputField("email", "Email", profile.email, { type: "email" })}
        ${inputField("phone", "Phone", profile.phone, { type: "tel" })}${inputField("organization", "Organization", profile.organization)}
        ${inputField("country", "Country", profile.country)}${inputField("city", "City", profile.city)}
        ${inputField("language", "Preferred language", profile.language)}${inputField("skills", "Skills", display(profile.skills, ""))}
        ${inputField("interests", "Interests", display(profile.interests, ""))}${inputField("bio", "Short bio", profile.bio, { textarea: true, wide: true })}
      </div>
      <fieldset><legend>Emergency contact</legend><div class="profile-grid">${inputField("emergency_contact_name", "Name", profile.emergency_contact_name)}${inputField("emergency_contact_phone", "Phone", profile.emergency_contact_phone, { type: "tel" })}</div></fieldset>
      <button class="primary-button" type="submit">${state.saving ? "Saving…" : "Save profile draft"}</button><p class="form-note" id="profileMessage">No new profile database is created by this screen.</p>
    </form>`;
}

function aboutView() {
  const cards = [["Mission", "mission"], ["Vision", "vision"], ["501(c)(3) Federal Tax ID (EIN)", "taxId"], ["Organization boilerplate", "boilerplate"]];
  return `<header class="view-head"><p class="eyebrow">Reference</p><h1>About W.A.T.A.</h1><p>Copy-ready language for applications, grants, and partner materials.</p></header><div class="about-banner"><strong>Ready to use</strong><span>Approved mission, vision, nonprofit information, and organization boilerplate.</span></div><div class="copy-grid">${cards.map(([label, key]) => `<article class="copy-card ${key === "boilerplate" ? "wide" : ""}"><span>${label}</span><p>${escapeHtml(WATA_REFERENCE_COPY[key])}</p><button type="button" data-copy-key="${key}">Copy ${key === "taxId" ? "tax ID" : label.toLowerCase()}</button></article>`).join("")}</div>`;
}

function settingsView() {
  return `<header class="view-head"><p class="eyebrow">Tech Hub</p><h1>Settings &amp; help</h1><p>How access, updates, and offline behavior work.</p></header><div class="help-grid">
    <article><span>01</span><h3>Your access</h3><p>Your active Airtable App Access record and individual checkboxes control the apps shown here. Partner access to the Filter Registry is scoped inside the Registry; Partner Portal is not a separate app.</p></article>
    <article><span>02</span><h3>Instructions</h3><p>Expand Instructions on a card or open the menu to reach each app’s current PDF and share-ready PNG.</p></article>
    <article><span>03</span><h3>Offline use</h3><p>The Hub remembers your last verified launcher view for up to seven days. Opening external apps and refreshing access still require a connection.</p></article>
    <article><span>04</span><h3>Shared identity</h3><p>This interface is prepared for the future shared W.A.T.A. account system. It does not create another authentication, roles, profiles, or permissions backend.</p></article>
  </div>`;
}

function loadingView() {
  return `<section class="state-card"><div class="loader"><span></span><span></span><span></span></div><p class="eyebrow">W.A.T.A. Tech Hub</p><h1>Loading your workspace</h1><p>Checking the existing Airtable-powered app directory.</p></section>`;
}

function errorView() {
  const unauthorized = state.error?.status === 401 || state.error?.status === 403;
  return `<section class="state-card error"><p class="eyebrow">${unauthorized ? "Secure access" : "Connection issue"}</p><h1>${unauthorized ? "Verify your W.A.T.A. email" : "The Hub could not load"}</h1><p>${escapeHtml(unauthorized ? "Continue through the existing W.A.T.A. verification screen. No new Tech Hub login system has been created." : state.error?.message || "Try again when you have a connection.")}</p><button class="primary-button" type="button" id="retryButton">${unauthorized ? "Continue to sign in" : "Try again"}</button></section>`;
}

function render() {
  if (state.loading && !state.bootstrap) app.innerHTML = loadingView();
  else if (state.error && !state.bootstrap) app.innerHTML = errorView();
  else app.innerHTML = currentView === "profile" ? profileView() : currentView === "about" ? aboutView() : currentView === "settings" ? settingsView() : homeView();
  syncNavigation();
}

function syncNavigation() {
  const bootstrap = state.bootstrap;
  if (!bootstrap) return;
  const profile = bootstrap.profile;
  const initials = display(profile.display_name, profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  document.querySelector("#menuProfile").innerHTML = `<span class="avatar">${escapeHtml(initials || "W")}</span><span><strong>${escapeHtml(display(profile.display_name, "W.A.T.A. member"))}</strong><small>${escapeHtml(bootstrap.roles.join(" · ") || "Member")}</small></span>`;
  document.querySelector("#quickLinks").innerHTML = bootstrap.apps.map(item => item.status === "ready" && item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><span>${iconFor(item)}</span>${escapeHtml(item.name)}</a>` : `<span class="disabled"><span>${iconFor(item)}</span>${escapeHtml(item.name)}</span>`).join("");
  document.querySelector("#menuGuideList").innerHTML = bootstrap.apps.map(item => { const guides = guideList(item); return `<div><strong>${escapeHtml(item.name)}</strong><span>${guides.length ? guides.map(guide => `<a href="${escapeHtml(guide.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.format)}</a>`).join("") : "Coming soon"}</span></div>`; }).join("");
  updateConnection();
}

function openMenu(open) {
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  menuButton.setAttribute("aria-expanded", String(open));
  scrim.hidden = !open;
}

function setAppearance(kind, value) {
  document.documentElement.dataset[kind] = value;
  localStorage.setItem(kind === "theme" ? "wata-theme" : "wata-accent", value);
  document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === "dark" ? "#070c16" : "#eef3f9";
  document.querySelectorAll(`[data-${kind}-choice]`).forEach(button => button.classList.toggle("active", button.dataset[`${kind}Choice`] === value));
}

function updateConnection() {
  const connected = navigator.onLine && !state.error;
  document.querySelector(".connection-dot")?.classList.toggle("connected", connected);
  const label = document.querySelector("#connectionLabel");
  if (label) label.textContent = navigator.onLine ? (state.error ? "Connection needed" : "Access synced") : "Offline snapshot";
}

function readSnapshot() {
  try { const saved = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "null"); return saved && Date.now() - saved.savedAt < SNAPSHOT_MAX_AGE ? saved.bootstrap : null; } catch { return null; }
}

async function loadBootstrap({ background = false } = {}) {
  if (!background) { state.loading = true; state.error = null; render(); }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const bootstrap = await dataAdapter.getBootstrap({ signal: controller.signal });
    state.bootstrap = bootstrap; state.error = null; state.offlineSnapshot = false;
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: Date.now(), bootstrap }));
  } catch (error) {
    const unauthorized = error.status === 401 || error.status === 403;
    if (!state.bootstrap || unauthorized) { if (unauthorized) localStorage.removeItem(SNAPSHOT_KEY); state.bootstrap = unauthorized ? null : state.bootstrap; state.error = { status: error.status || 503, message: error.name === "AbortError" ? "The access request timed out" : error.message }; }
  } finally { clearTimeout(timeout); state.loading = false; render(); }
}

document.addEventListener("click", async event => {
  if (event.target.closest("#menuButton")) return openMenu(true);
  if (event.target.closest("#closeMenu") || event.target === scrim) return openMenu(false);
  const theme = event.target.closest("[data-theme-choice]"); if (theme) return setAppearance("theme", theme.dataset.themeChoice);
  const accent = event.target.closest("[data-accent-choice]"); if (accent) return setAppearance("accent", accent.dataset.accentChoice);
  if (event.target.closest("#instructionsButton")) { const list = document.querySelector("#menuGuideList"); list.hidden = !list.hidden; return; }
  const details = event.target.closest(".instructions"); if (details) { event.stopPropagation(); return; }
  const copy = event.target.closest("[data-copy-key]"); if (copy) { try { await navigator.clipboard.writeText(WATA_REFERENCE_COPY[copy.dataset.copyKey]); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy again"; }, 1200); } catch { copy.textContent = "Copy unavailable"; } return; }
  const appTarget = event.target.closest("[data-app-url]"); if (appTarget) { window.open(appTarget.dataset.appUrl, "_blank", "noopener,noreferrer"); return; }
  const view = event.target.closest("[data-view]"); if (view) { currentView = view.dataset.view; history.replaceState(null, "", `#${currentView}`); openMenu(false); render(); scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (event.target.closest("#retryButton")) { if (state.error?.status === 401 || state.error?.status === 403) return dataAdapter.signIn(); return loadBootstrap(); }
});

document.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-app-url]")) { event.preventDefault(); event.target.click(); } if (event.key === "Escape") openMenu(false); });

document.addEventListener("submit", async event => {
  if (event.target.id !== "profileForm") return;
  event.preventDefault(); state.saving = true;
  const values = Object.fromEntries(new FormData(event.target));
  const profile = { ...state.bootstrap.profile, ...values, skills: values.skills.split(",").map(value => value.trim()).filter(Boolean), interests: values.interests.split(",").map(value => value.trim()).filter(Boolean) };
  const result = await dataAdapter.updateProfile(profile); state.bootstrap.profile = result.profile; state.saving = false; render();
  const message = document.querySelector("#profileMessage"); if (message) message.textContent = "Saved locally for this interface pass. The shared profile service will replace this adapter later.";
});

addEventListener("online", () => loadBootstrap({ background: Boolean(state.bootstrap) }));
addEventListener("offline", () => { state.offlineSnapshot = Boolean(state.bootstrap); updateConnection(); render(); });
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));

setAppearance("theme", localStorage.getItem("wata-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
setAppearance("accent", localStorage.getItem("wata-accent") || "cyan");
const snapshot = readSnapshot();
if (snapshot) { state.bootstrap = snapshot; state.loading = false; state.offlineSnapshot = !navigator.onLine; render(); }
loadBootstrap({ background: Boolean(snapshot) });

import { dataAdapter } from "./data-adapter.js";
import { languageLocale, normalizeLanguage, translateText } from "./i18n.js";
import { isWataProfileComplete, mountWataProfile, WATA_PROFILE_COMPONENT_VERSION } from "./lib/wata-profile.js?v=1.1.0";

const SNAPSHOT_KEY = "wata-tech-hub-bootstrap-v2";
const PROFILE_PROMPT_KEY = "wata.toolkit.profile-prompt-deferred.v1";
const SNAPSHOT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const WATA_REFERENCE_COPY = Object.freeze({
  mission: "Water Access To All brings clean, safe drinking water to communities without reliable access—installing filtration systems while developing the local capacity and leadership to carry the work forward.",
  vision: "A world where every community has lasting access to clean water—and where local youth lead that change, supported by outside partners but never dependent on them.",
  taxId: "99-2348652",
  boilerplate: "Water Access To All (W.A.T.A.) is a registered 501(c)(3) nonprofit bringing clean, safe drinking water to communities without reliable access through filtration, training, and locally led implementation. W.A.T.A. works alongside local leaders and partners to build lasting capacity so communities can carry the work forward."
});
const WATA_GOALS = Object.freeze([
  "Expand durable access to clean, safe drinking water.",
  "Install filtration in ways that communities can operate and carry forward.",
  "Build local capacity, leadership, and practical knowledge alongside each installation.",
  "Support youth leaders and community partners without creating long-term dependence on outside organizations."
]);
const PROFILE_CHOICES = Object.freeze({
  skills: ["Water filtration", "Water systems", "Field operations", "Community organizing", "Project management", "Grant writing", "Fundraising", "Photography", "Videography", "Design", "Writing & editing", "Storytelling", "Research & evaluation", "Data & mapping", "Technology", "Engineering", "Training & facilitation", "Teaching", "Translation & interpretation", "Music & performance", "First aid", "Logistics", "Partnerships", "Social media"],
  interests: ["Clean water", "Community service", "Conservation", "Public health", "Education", "Travel", "Surfing & ocean sports", "Music", "Photography", "Storytelling", "Technology", "Climate action", "Youth leadership", "Sports & fitness", "Art & design", "Hiking & outdoors", "Languages & culture", "Volunteering"]
});
const PROFILE_HINTS = Object.freeze({
  skills: "Things you know how to do or could bring to W.A.T.A. work in the field or from home.",
  interests: "Things you genuinely enjoy—in W.A.T.A. work and in life."
});
const COUNTRY_CODES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CD CG CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");

const state = { loading: true, error: null, bootstrap: null, offlineSnapshot: false, saving: false, profileMode: "edit" };
let currentView = location.hash.slice(1) || "home";
let currentLanguage = normalizeLanguage(localStorage.getItem("wata-language") || navigator.language);
const app = document.querySelector("#app");
const drawer = document.querySelector("#menuDrawer");
const scrim = document.querySelector("#drawerScrim");
const menuButton = document.querySelector("#menuButton");
const languageMenuButton = document.querySelector("#languageMenuButton");
const languageMenu = document.querySelector("#languageMenu");
let drawerReturnFocus = null;
let profileMount = null;
document.documentElement.lang = currentLanguage;
document.title = currentLanguage === "es" ? "W.A.T.A. Mundo Maravilloso" : "W.A.T.A. Wonderful World";

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const display = (value, fallback = "Not provided") => value == null || value === "" || (Array.isArray(value) && !value.length) ? fallback : Array.isArray(value) ? value.join(", ") : String(value);
const textSources = new WeakMap();
const attributeSources = new WeakMap();
const translatableAttributes = ["aria-label", "title", "placeholder"];

function translateDom(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest("script, style, [data-no-translate]")) continue;
    const source = textSources.get(node) ?? node.nodeValue;
    textSources.set(node, source);
    const match = source.match(/^(\s*)(.*?)(\s*)$/su);
    node.nodeValue = `${match[1]}${translateText(match[2], currentLanguage)}${match[3]}`;
  }
  const elements = root.querySelectorAll ? root.querySelectorAll("*") : [];
  for (const element of elements) {
    if (element.closest("[data-no-translate]")) continue;
    let sources = attributeSources.get(element);
    if (!sources) { sources = new Map(); attributeSources.set(element, sources); }
    for (const attribute of translatableAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      if (!sources.has(attribute)) sources.set(attribute, element.getAttribute(attribute));
      element.setAttribute(attribute, translateText(sources.get(attribute), currentLanguage));
    }
  }
}

function syncLanguageControl() {
  const label = translateText("Choose language", currentLanguage);
  languageMenuButton?.setAttribute("aria-label", label);
  languageMenuButton?.setAttribute("title", label);
  document.querySelectorAll("[data-language]").forEach(option => {
    const active = option.dataset.language === currentLanguage;
    option.classList.toggle("active", active);
    option.setAttribute("aria-pressed", String(active));
  });
  const spanish = currentLanguage === "es";
  const topbarTitle = document.querySelector("#topbarTitle");
  const topbarBrand = document.querySelector("#topbarBrand");
  const topbarProduct = document.querySelector("#topbarProduct");
  if (topbarTitle) topbarTitle.setAttribute("aria-label", spanish ? "Agua para Todas las Personas" : "Water Access to All");
  if (topbarBrand) topbarBrand.textContent = spanish ? "Agua para todos" : "Water Access to All";
  if (topbarProduct) topbarProduct.textContent = spanish ? "W.A.T.A. Mundo Maravilloso" : "W.A.T.A. Wonderful World";
  const drawerLanguageValue = document.querySelector("#drawerLanguageValue");
  if (drawerLanguageValue) drawerLanguageValue.textContent = spanish ? "Español" : "English";
  const appearanceValue = document.querySelector("#appearanceValue");
  if (appearanceValue) appearanceValue.textContent = translateText(document.documentElement.dataset.theme === "light" ? "Light" : "Dark", currentLanguage);
}

function closeLanguageMenu() {
  if (!languageMenu || !languageMenuButton) return;
  languageMenu.hidden = true;
  languageMenuButton.setAttribute("aria-expanded", "false");
}

function applyLanguage(language, persist = true) {
  currentLanguage = normalizeLanguage(language);
  if (persist) localStorage.setItem("wata-language", currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.title = currentLanguage === "es" ? "W.A.T.A. Mundo Maravilloso" : "W.A.T.A. Wonderful World";
  closeLanguageMenu();
  render();
}

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

function statusLabel(appData) {
  if (appData.operational_status === "unreachable") return "Unavailable";
  if (appData.status !== "ready") return appData.lifecycle_status === "planned" ? "Planned" : "Coming soon";
  return ({ alpha: "Alpha", beta: "Beta", production: "Live", external: "External" })[appData.lifecycle_status] || "Ready";
}

function appMetadata(appData) {
  const details = [];
  if (appData.availability_status === "internal") details.push("Internal");
  else if (appData.availability_status === "preview") details.push("Preview");
  if (appData.development_status === "active") details.push("Active development");
  else if (appData.development_status === "maintenance") details.push("Maintenance");
  if (appData.version) details.push(`Version ${appData.version}`);
  if (["degraded", "unreachable"].includes(appData.operational_status)) details.push(`Operational: ${appData.operational_status}`);
  return details.length ? `<p class="app-meta">${details.map(escapeHtml).join(" · ")}</p>` : "";
}

function isAppLaunchable(appData) {
  return appData.status === "ready" && Boolean(appData.url) && appData.availability_status !== "unavailable" && appData.operational_status !== "unreachable" && !["planned", "paused", "retired"].includes(appData.lifecycle_status);
}

function appCard(appData) {
  const ready = isAppLaunchable(appData);
  return `<article class="app-card ${ready ? "ready" : "soon"}" tabindex="${ready ? "0" : "-1"}" ${ready ? `role="link" data-app-key="${escapeHtml(appData.app_key)}" data-app-url="${escapeHtml(appData.url)}"` : ""}>
    <div class="card-top"><span class="card-icon">${iconFor(appData)}</span><span class="status ${ready ? "ready" : "soon"}">${statusLabel(appData)}</span></div>
    <h3>${escapeHtml(appData.name)}</h3><p>${escapeHtml(appData.description)}</p>${appMetadata(appData)}
  </article>`;
}

function tripDate(value) {
  if (!value) return { day: "—", month: "TBD" };
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.valueOf()) ? { day: "—", month: "TBD" } : { day: date.toLocaleDateString(languageLocale(currentLanguage), { day: "2-digit", timeZone: "UTC" }), month: date.toLocaleDateString(languageLocale(currentLanguage), { month: "short", timeZone: "UTC" }) };
}

function tripRow(trip) {
  const start = tripDate(trip.starts_at);
  const context = [trip.program_name || trip.project_name, trip.country].filter(Boolean).join(" · ");
  const tag = trip.project_hub_url ? "a" : "div";
  const link = trip.project_hub_url ? ` href="${escapeHtml(trip.project_hub_url)}" target="_blank" rel="noopener noreferrer"` : "";
  return `<${tag} class="trip-row"${link}><span class="trip-date"><b>${start.day}</b><small>${start.month}</small></span><span class="trip-copy"><strong>${escapeHtml(trip.name)}</strong><small>${escapeHtml(context || "Details coming soon")}</small></span><span class="trip-role">${escapeHtml(trip.trip_role || "Assigned")}</span></${tag}>`;
}

function relationshipLabel(filter) {
  if (filter.relationship_label) return filter.relationship_label;
  return ({
    installed_by: "Installer",
    installer: "Installer",
    ambassador: "Ambassador",
    steward: "Filter steward",
    surveyor: "Surveyor",
    followup_owner: "Follow-up assigned"
  })[filter.relationship_type.toLowerCase()] || filter.relationship_type || "Connected filter";
}

function personalFilterRow(filter) {
  const identity = filter.barcode || filter.label || filter.id;
  const location = [filter.community, filter.country].filter(Boolean).join(" · ") || "Location available in the approved record";
  return `<article class="personal-filter-row"><span class="filter-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.8c3.2 4.4 6.1 7.8 6.1 11.4a6.1 6.1 0 1 1-12.2 0C5.9 10.6 8.8 7.2 12 2.8Z"/><path d="M9.2 15.2a3.2 3.2 0 0 0 3.1 2.4"/></svg></span><span class="filter-copy"><strong>${escapeHtml(identity)}</strong><small>${escapeHtml(location)}</small></span><span class="filter-relationship">${escapeHtml(relationshipLabel(filter))}</span>${filter.status ? `<small class="filter-status">${escapeHtml(filter.status)}</small>` : ""}</article>`;
}

function homeView() {
  const { apps, trips, filters = [] } = state.bootstrap;
  const ready = apps.filter(isAppLaunchable);
  const development = apps.filter(item => !isAppLaunchable(item));
  return `<section class="hero"><div class="hero-waves" aria-hidden="true"></div><div><p class="eyebrow">W.A.T.A. Wonderful World</p><h1>Your profile &amp; toolkit</h1><p>Your approved tools, work, and W.A.T.A. information in one place.</p></div></section>
    ${profileJourneyBanner()}
    ${trips.length ? `<section class="trips"><div class="section-head"><div><h2>Upcoming trips</h2><p>Your confirmed assignments.</p></div></div>${trips.map(tripRow).join("")}</section>` : ""}
    ${filters.length ? `<section class="personal-filters"><div class="section-head"><div><h2>My filters</h2><p>Filters connected directly to your verified W.A.T.A. identity.</p></div></div><div class="personal-filter-list">${filters.map(personalFilterRow).join("")}</div><p class="scope-note">This is your personal filter view. It does not provide partner-wide Filter Registry access.</p></section>` : ""}
    <section id="apps"><div class="section-head"><div><h2>Apps</h2><p>${ready.length ? "Tap an app to open it." : "No apps are currently available to this account."}</p></div></div>${ready.length ? `<div class="app-grid">${ready.map(appCard).join("")}</div>` : `<div class="empty-state"><strong>No apps available</strong><p>Your verified access does not currently include a launchable W.A.T.A. app.</p></div>`}</section>
    ${development.length ? `<section class="development"><div class="section-head"><div><h2>In development</h2><p>Tools being built or prepared.</p></div></div><div class="app-grid">${development.map(appCard).join("")}</div></section>` : ""}
    ${state.offlineSnapshot ? `<div class="offline-note">Showing your last verified app view. Links may require a connection.</div>` : ""}`;
}

function profileJourneyBanner() {
  const profile = state.bootstrap?.profile;
  if (!profile || isWataProfileComplete(profile)) return "";
  const connected = state.bootstrap?.integration?.profile?.writable;
  if (!connected) return `<section class="journey-note pending"><div><p class="eyebrow">One W.A.T.A. account</p><strong>Shared profile setup is being connected.</strong><p>Your verified app access remains unchanged. The Toolkit will not create a separate profile or pretend that an unsaved profile is complete.</p></div></section>`;
  return `<section class="journey-note"><div><p class="eyebrow">One W.A.T.A. account</p><strong>Complete your shared W.A.T.A. profile.</strong><p>Your profile and preferences follow you across participating W.A.T.A. apps.</p></div><button class="primary-button" type="button" data-view="profile" data-profile-mode="onboarding">Continue profile setup</button></section>`;
}

function inputField(name, label, value, options = {}) {
  const type = options.type || "text";
  const control = options.textarea
    ? `<textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea>`
    : `<input name="${escapeHtml(name)}" type="${type}" value="${escapeHtml(value)}">`;
  return `<label class="profile-field ${options.wide ? "wide" : ""}"><span>${escapeHtml(label)}</span>${control}</label>`;
}

function flagEmoji(code) {
  return [...code].map(character => String.fromCodePoint(127397 + character.charCodeAt())).join("");
}

function countryField(value) {
  let canonicalNames;
  let localizedNames;
  try {
    canonicalNames = new Intl.DisplayNames(["en-US"], { type: "region" });
    localizedNames = new Intl.DisplayNames([languageLocale(currentLanguage)], { type: "region" });
  } catch { canonicalNames = localizedNames = { of: code => code }; }
  const countries = [...new Set(COUNTRY_CODES)].map(code => ({ code, name: canonicalNames.of(code) || code, label: localizedNames.of(code) || code })).sort((a, b) => a.label.localeCompare(b.label, languageLocale(currentLanguage)));
  const known = countries.some(country => country.name === value);
  return `<label class="profile-field"><span>Country</span><select name="country"><option value="">Select a country</option>${value && !known ? `<option value="${escapeHtml(value)}" selected>${escapeHtml(value)}</option>` : ""}${countries.map(country => `<option value="${escapeHtml(country.name)}" ${country.name === value ? "selected" : ""}>${flagEmoji(country.code)} ${escapeHtml(country.label)}</option>`).join("")}</select></label>`;
}

function tagPicker(name, label, values) {
  const selected = Array.isArray(values) ? values : [];
  const choices = [...new Set([...PROFILE_CHOICES[name], ...selected])];
  return `<div class="profile-field wide tag-field"><span>${label}</span><small class="field-help">${escapeHtml(PROFILE_HINTS[name])}</small><details class="tag-picker" data-tag-picker="${name}">
    <summary><span><strong>${label}</strong><small data-tag-summary>${selected.length ? escapeHtml(selected.map(value => translateText(value, currentLanguage)).join(" · ")) : "Tap to choose"}</small></span><span class="picker-chevron" aria-hidden="true">⌄</span></summary>
    <div class="tag-options">${choices.map(value => `<button type="button" role="checkbox" data-tag-value="${escapeHtml(value)}" aria-checked="${selected.includes(value)}" class="${selected.includes(value) ? "selected" : ""}">${escapeHtml(value)}</button>`).join("")}</div><div class="tag-adder"><input type="text" maxlength="48" data-tag-input="${name}" placeholder="Add another…" aria-label="Add another ${label.toLowerCase().replace(/s$/, "")}"><button type="button" data-add-tag="${name}">Add</button></div>
    <input type="hidden" name="${name}" value="${escapeHtml(selected.join(","))}">
  </details></div>`;
}

function avatarMarkup(profile, className, fallback) {
  const url = String(profile.avatar_url || "");
  const safe = url.startsWith("data:image/") || url.startsWith("/") || url.startsWith("https://");
  return `<span class="${className}">${safe ? `<img src="${escapeHtml(url)}" alt="">` : escapeHtml(fallback)}</span>`;
}

function profileView() {
  const profile = state.bootstrap.profile;
  const roles = state.bootstrap.roles.map(role => translateText(role.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()), currentLanguage)).join(" · ") || translateText("Member", currentLanguage);
  const initials = display(profile.display_name, profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  if (state.bootstrap.integration?.profile?.writable) return `<header class="view-head"><p class="eyebrow">Shared profile</p><h1>${state.profileMode === "onboarding" ? "Create your W.A.T.A. profile" : "Your W.A.T.A. profile"}</h1><p>One profile for every participating W.A.T.A. app. Roles and app access remain managed separately.</p></header><section class="profile-component-card"><div id="sharedProfileHost" aria-live="polite"></div></section>`;
  return `<header class="view-head"><p class="eyebrow">Shared profile</p><h1>Your W.A.T.A. profile</h1><p>Your identity and profile belong to the W.A.T.A. platform, not to one individual app.</p></header>
    <section class="profile-card"><div class="profile-summary">${avatarMarkup(profile, "profile-avatar", initials || "W")}<div><strong>${escapeHtml(display(profile.display_name, "W.A.T.A. profile"))}</strong><small>${escapeHtml(roles)}</small></div></div>
      <div class="profile-grid profile-core">
        <div class="profile-field"><span>Nationality</span><strong>${escapeHtml(display(profile.country, "Not added"))}</strong></div>
        <div class="profile-field"><span>Professional skills</span><strong>${escapeHtml(skills.length ? skills.join(" · ") : "Not added")}</strong></div>
        <div class="profile-field wide"><span>Personal interests</span><strong>${escapeHtml(interests.length ? interests.join(" · ") : "Not added")}</strong></div>
      </div>
      <div class="profile-integration-note"><strong>Shared editor connection pending</strong><p>The reusable in-app profile editor will open here once its versioned platform interface is available. No Toolkit-only profile store or Community redirect is used.</p></div>
    </section>`;
}

function profileRoleLabel() {
  const profile = state.bootstrap?.profile || {};
  if (profile.role_label) return profile.role_label;
  return state.bootstrap?.roles?.map(role => role.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase())).join(" · ") || "Role pending";
}

function closeProfile({ reason = "cancel" } = {}) {
  if (state.profileMode === "onboarding" && reason !== "saved") {
    try { sessionStorage.setItem(PROFILE_PROMPT_KEY, String(state.bootstrap?.user?.id || state.bootstrap?.user?.email || "member")); } catch {}
  }
  state.profileMode = "edit";
  currentView = "home";
  history.replaceState(null, "", "#home");
  render();
}

function mountSharedProfileSurface() {
  const host = document.querySelector("#sharedProfileHost");
  const bootstrap = state.bootstrap;
  if (!host || !bootstrap?.integration?.profile?.writable) return;
  let pendingAvatar = null;
  profileMount = mountWataProfile(host, {
    language: currentLanguage,
    mode: state.profileMode,
    profile: bootstrap.profile,
    roleLabel: profileRoleLabel(),
    online: () => navigator.onLine,
    adapter: {
      loadProfile: ({ signal }) => dataAdapter.loadProfile(bootstrap, { signal }),
      ...(bootstrap.integration.profile.avatar_writable ? { uploadAvatar: async (file, { signal }) => {
        pendingAvatar = await dataAdapter.uploadAvatar(bootstrap, file, { signal });
        return pendingAvatar;
      } } : {}),
      saveProfile: async (patch, { signal }) => {
        const current = bootstrap.profile || {};
        const avatarRef = pendingAvatar?.avatar_url === patch.avatar_url ? pendingAvatar.avatar_ref : (patch.avatar_url ? current.avatar_ref : null);
        const result = await dataAdapter.updateProfile(bootstrap, { ...patch, avatar_url: avatarRef }, { signal, completeOnboarding: state.profileMode === "onboarding" });
        pendingAvatar = null;
        return result;
      }
    },
    onSaved(profile) {
      bootstrap.profile = { ...bootstrap.profile, ...profile, display_name: profile.display_name || profile.name };
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: Date.now(), bootstrap }));
      try { sessionStorage.removeItem(PROFILE_PROMPT_KEY); } catch {}
      if (state.profileMode === "onboarding") closeProfile({ reason: "saved" });
      else render();
    },
    onClose: closeProfile
  });
}

function missionView() {
  const cards = [["Mission", "mission"], ["Vision", "vision"], ["501(c)(3) Federal Tax ID (EIN)", "taxId"]];
  return `<header class="view-head"><p class="eyebrow">W.A.T.A. reference</p><h1>Mission, vision &amp; goals</h1><p>The clearest version of what W.A.T.A. does, the future we are working toward, and the information most often needed for grants and partner materials.</p></header><div class="about-banner"><strong>Ready to use</strong><span>Copy any approved section directly from the Toolkit.</span></div><div class="copy-grid">${cards.map(([label, key]) => `<article class="copy-card ${key === "taxId" ? "ein-card" : ""}"><span>${label}</span><p>${escapeHtml(WATA_REFERENCE_COPY[key])}</p><button type="button" data-copy-key="${key}">Copy ${key === "taxId" ? "tax ID" : label.toLowerCase()}</button></article>`).join("")}<article class="copy-card wide goals-card"><span>Goals</span><ol>${WATA_GOALS.map(goal => `<li>${escapeHtml(goal)}</li>`).join("")}</ol></article></div>`;
}

function aboutView() {
  return `<header class="view-head"><p class="eyebrow">Water Access to All</p><h1>About W.A.T.A.</h1><p>A concise introduction to why W.A.T.A. exists and how the work is designed to continue.</p></header><div class="story-grid">
    <article><span>Why W.A.T.A. exists</span><h2>Clean water should create possibility.</h2><p>W.A.T.A. works with communities that lack reliable access to clean, safe drinking water. The work is not only about delivering filtration—it is about strengthening the people, knowledge, and leadership that keep clean water moving forward.</p></article>
    <article><span>How W.A.T.A. works</span><h2>Install. Teach. Carry forward.</h2><p>Filtration is paired with training and locally led implementation. Outside partners can bring resources and support, while community leaders build the capacity to operate, adapt, and lead the work themselves.</p></article>
    <article><span>The role of young leaders</span><h2>Local youth drive lasting change.</h2><p>W.A.T.A.’s vision puts young leaders at the center of the future: supported by partners, connected to useful tools, and never designed to remain dependent on outside organizations.</p></article>
    <article><span>Your starting point</span><h2>The Toolkit keeps the work connected.</h2><p>This app brings W.A.T.A.’s tools, instructions, profile, organizational language, and future trip information into one place. If this is the only W.A.T.A. app someone receives, it should still help them understand the mission and find what they need.</p></article>
  </div><article class="copy-card about-boilerplate"><span>Organization boilerplate</span><p>${escapeHtml(WATA_REFERENCE_COPY.boilerplate)}</p><button type="button" data-copy-key="boilerplate">Copy organization boilerplate</button></article>`;
}

function settingsView() {
  return `<header class="view-head"><p class="eyebrow">Toolkit</p><h1>Settings &amp; help</h1><p>How access, updates, and offline behavior work.</p></header><div class="help-grid">
    <article><span>01</span><h3>Your access</h3><p>The Toolkit displays the effective apps returned for your verified identity. Each destination still enforces its own grant and scope; hiding a card is never the security boundary.</p></article>
    <article><span>02</span><h3>Instructions</h3><p>Open Instructions from the menu to reach each app’s current PDF and share-ready PNG.</p></article>
    <article><span>03</span><h3>Offline use</h3><p>The Toolkit remembers your last verified launcher view for up to seven days. Opening external apps and refreshing access still require a connection.</p></article>
    <article><span>04</span><h3>Shared identity</h3><p>Supabase is the target W.A.T.A. identity, profile, grant, and scope authority. The currently deployed Toolkit still uses the transitional Cloudflare Access and legacy bootstrap path until the coordinated migration is accepted.</p></article>
  </div>`;
}

function loadingView() {
  return `<section class="hero loading-hero"><div class="hero-waves" aria-hidden="true"></div><div><p class="eyebrow">W.A.T.A. Wonderful World</p><h1>Your profile &amp; toolkit</h1><p>Preparing your account.</p></div></section><section class="loading-launcher" aria-label="Loading your apps"><div class="section-head"><div><h2>Toolkit</h2><p>Checking your access.</p></div><div class="loader" aria-hidden="true"><span></span><span></span><span></span></div></div><div class="skeleton-grid">${Array.from({ length: 6 }, () => `<span class="skeleton-app"><i></i><b></b></span>`).join("")}</div></section>`;
}

function errorView() {
  const unauthorized = state.error?.status === 401 || state.error?.status === 403;
  const title = unauthorized ? "Welcome back." : "Wonderful World could not connect";
  const message = unauthorized ? "One W.A.T.A. identity connects your shared profile to every tool and record you are authorized to use." : state.error?.message || "Try again when you have a connection.";
  return `<section class="entry-shell ${unauthorized ? "auth-entry" : "connection-entry"}"><div class="entry-visual"><div class="entry-brand"><img src="/assets/tech-hub/icon-192-v6.png" alt=""><span><small>W.A.T.A.</small><strong>Wonderful World</strong></span></div><div class="entry-story"><p class="eyebrow">Your W.A.T.A. starting point</p><h2>One profile.<br>Every approved tool.</h2><p>Create and maintain your shared profile, open your personal toolkit, follow assigned work, and stay connected to the filters and communities you support.</p><ul><li>One shared W.A.T.A. profile</li><li>Only the apps approved for you</li><li>Your verified filters, trips, and assignments</li></ul></div><small class="entry-signature">Water Access To All · Wonderful World</small></div><section class="entry-panel"><p class="eyebrow">${unauthorized ? "Water Access To All" : "Connection issue"}</p><h1>${title}</h1><p class="entry-intro">${escapeHtml(message)}</p>${unauthorized ? `<div class="entry-auth-note"><strong>One account, secure access</strong><p>Google or W.A.T.A. credentials will resolve to the same approved identity when the shared session service is connected. Signing in never grants new permissions.</p></div>` : ""}<button class="primary-button entry-action" type="button" id="retryButton">${unauthorized ? "Continue to secure sign-in" : "Try again"}</button><small class="entry-help">${unauthorized ? "The current verification screen will show the sign-in method available to your approved account." : "Your last verified data remains protected while the connection is unavailable."}</small></section></section>`;
}

function render() {
  profileMount?.destroy();
  profileMount = null;
  const entryMode = Boolean(state.error && !state.bootstrap);
  document.body.classList.toggle("entry-mode", entryMode);
  if (state.loading && !state.bootstrap) app.innerHTML = loadingView();
  else if (entryMode) app.innerHTML = errorView();
  else app.innerHTML = currentView === "profile" ? profileView() : currentView === "mission" ? missionView() : currentView === "about" ? aboutView() : currentView === "settings" ? settingsView() : homeView();
  syncNavigation();
  translateDom(document);
  syncLanguageControl();
  syncCurrentDestination();
  if (currentView === "profile") mountSharedProfileSurface();
}

function beginProfileOnboardingIfNeeded(bootstrap) {
  if (!bootstrap?.integration?.profile?.writable || isWataProfileComplete(bootstrap.profile) || currentView !== "home") return;
  let deferred = false;
  try { deferred = sessionStorage.getItem(PROFILE_PROMPT_KEY) === String(bootstrap.user?.id || bootstrap.user?.email || "member"); } catch {}
  if (deferred) return;
  state.profileMode = "onboarding";
  currentView = "profile";
  history.replaceState(null, "", "#profile");
}

function syncCurrentDestination() {
  document.querySelectorAll('#menuDrawer [data-view]').forEach(control => {
    if (control.dataset.view === currentView) control.setAttribute("aria-current", "page");
    else control.removeAttribute("aria-current");
  });
}

function syncNavigation() {
  const bootstrap = state.bootstrap;
  if (!bootstrap) return;
  const profile = bootstrap.profile;
  const initials = display(profile.display_name, profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const roles = bootstrap.roles.map(role => translateText(role.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()), currentLanguage)).join(" · ") || translateText("Member", currentLanguage);
  document.querySelector("#menuProfile").innerHTML = `${avatarMarkup(profile, "avatar", initials || "W")}<span><strong>${escapeHtml(display(profile.display_name, "W.A.T.A. member"))}</strong><small>${escapeHtml(roles)}</small></span>`;
  document.querySelector("#quickLinks").innerHTML = bootstrap.apps.map(item => isAppLaunchable(item) ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><span>${iconFor(item)}</span>${escapeHtml(item.name)}</a>` : `<span class="disabled"><span>${iconFor(item)}</span>${escapeHtml(item.name)}</span>`).join("");
  document.querySelector("#menuGuideList").innerHTML = bootstrap.apps.map(item => { const guides = guideList(item); return `<div><strong>${escapeHtml(item.name)}</strong><span>${guides.length ? guides.map(guide => `<a href="${escapeHtml(guide.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.format)}</a>`).join("") : "Coming soon"}</span></div>`; }).join("");
  updateConnection();
}

function openMenu(open) {
  const wasOpen = drawer.classList.contains("open");
  if (open) {
    closeLanguageMenu();
    drawerReturnFocus = menuButton;
    document.querySelectorAll(".drawer-submenu").forEach(panel => { panel.hidden = true; });
    document.querySelectorAll('[aria-controls="appearancePanel"], [aria-controls="drawerLanguagePanel"], [aria-controls="menuGuideList"]').forEach(control => control.setAttribute("aria-expanded", "false"));
  }
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  menuButton.setAttribute("aria-expanded", String(open));
  scrim.hidden = !open;
  document.body.classList.toggle("drawer-open", open);
  if (open) requestAnimationFrame(() => document.querySelector("#closeMenu")?.focus());
  else if (wasOpen && drawerReturnFocus?.isConnected) drawerReturnFocus.focus();
}

function setAppearance(kind, value) {
  document.documentElement.dataset[kind] = value;
  localStorage.setItem(kind === "theme" ? "wata-theme" : "wata-accent", value);
  document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === "dark" ? "#08101c" : "#eef3f9";
  document.querySelectorAll(`[data-${kind}-choice]`).forEach(button => button.classList.toggle("active", button.dataset[`${kind}Choice`] === value));
  if (kind === "theme") {
    const appearanceValue = document.querySelector("#appearanceValue");
    if (appearanceValue) appearanceValue.textContent = translateText(value === "light" ? "Light" : "Dark", currentLanguage);
  }
}

function toggleDrawerPanel(buttonId, panelId) {
  const button = document.querySelector(`#${buttonId}`);
  const panel = document.querySelector(`#${panelId}`);
  if (!button || !panel) return;
  const open = panel.hidden;
  for (const other of document.querySelectorAll(".drawer-submenu")) {
    if (other !== panel) other.hidden = true;
  }
  document.querySelectorAll('[aria-controls="appearancePanel"], [aria-controls="drawerLanguagePanel"], [aria-controls="menuGuideList"]').forEach(control => {
    if (control !== button) control.setAttribute("aria-expanded", "false");
  });
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

function updateConnection() {
  const connected = navigator.onLine && !state.error;
  document.querySelector(".connection-dot")?.classList.toggle("connected", connected);
  const label = document.querySelector("#connectionLabel");
  if (label) label.textContent = translateText(navigator.onLine ? (state.error ? "Connection needed" : "Access synced") : "Offline snapshot", currentLanguage);
}

function addCustomTag(input) {
  const value = input.value.trim().replace(/\s+/g, " ");
  if (!value) return;
  const picker = input.closest("[data-tag-picker]");
  const existing = [...picker.querySelectorAll("[data-tag-value]")].find(button => button.dataset.tagValue.toLowerCase() === value.toLowerCase());
  if (existing) {
    if (existing.getAttribute("aria-checked") !== "true") existing.click();
  } else {
    const button = document.createElement("button");
    button.type = "button"; button.setAttribute("role", "checkbox"); button.dataset.tagValue = value; button.setAttribute("aria-checked", "false"); button.textContent = value;
    picker.querySelector(".tag-options").append(button); button.click();
  }
  input.value = "";
}

function readAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return reject(new Error("Choose a PNG, JPEG, or WebP image."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Choose an image smaller than 8 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("That image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That image could not be opened."));
      image.onload = () => {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 384;
        const context = canvas.getContext("2d");
        context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 384, 384);
        resolve(canvas.toDataURL("image/jpeg", .84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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
    beginProfileOnboardingIfNeeded(bootstrap);
    state.bootstrap = bootstrap; state.error = null; state.offlineSnapshot = false;
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ savedAt: Date.now(), bootstrap }));
  } catch (error) {
    const unauthorized = error.status === 401 || error.status === 403;
    if (!state.bootstrap || unauthorized) { if (unauthorized) localStorage.removeItem(SNAPSHOT_KEY); state.bootstrap = unauthorized ? null : state.bootstrap; state.error = { status: error.status || 503, message: error.name === "AbortError" ? "The access request timed out" : error.message }; }
  } finally { clearTimeout(timeout); state.loading = false; render(); }
}

document.addEventListener("click", async event => {
  if (event.target.closest("#languageMenuButton")) {
    const open = languageMenu.hidden;
    languageMenu.hidden = !open;
    languageMenuButton.setAttribute("aria-expanded", String(open));
    if (open) openMenu(false);
    return;
  }
  const language = event.target.closest("[data-language]");
  if (language) return applyLanguage(language.dataset.language);
  if (!event.target.closest(".language-picker")) closeLanguageMenu();
  if (event.target.closest("#menuButton")) return openMenu(true);
  if (event.target.closest("#closeMenu") || event.target === scrim) return openMenu(false);
  const theme = event.target.closest("[data-theme-choice]"); if (theme) return setAppearance("theme", theme.dataset.themeChoice);
  const accent = event.target.closest("[data-accent-choice]"); if (accent) return setAppearance("accent", accent.dataset.accentChoice);
  const tagChoice = event.target.closest("[data-tag-value]"); if (tagChoice) {
    const picker = tagChoice.closest("[data-tag-picker]");
    const input = picker.querySelector('input[type="hidden"]');
    const selected = input.value.split(",").map(value => value.trim()).filter(Boolean);
    const value = tagChoice.dataset.tagValue;
    const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
    input.value = next.join(","); tagChoice.classList.toggle("selected", next.includes(value)); tagChoice.setAttribute("aria-checked", String(next.includes(value)));
    picker.querySelector("[data-tag-summary]").textContent = next.length ? next.join(" · ") : "Tap to choose";
    return;
  }
  const addTag = event.target.closest("[data-add-tag]"); if (addTag) return addCustomTag(addTag.closest("[data-tag-picker]").querySelector("[data-tag-input]"));
  if (event.target.closest("#instructionsButton")) return toggleDrawerPanel("instructionsButton", "menuGuideList");
  if (event.target.closest("#appearanceButton")) return toggleDrawerPanel("appearanceButton", "appearancePanel");
  if (event.target.closest("#drawerLanguageButton")) return toggleDrawerPanel("drawerLanguageButton", "drawerLanguagePanel");
  if (event.target.closest("#signOutButton")) { openMenu(false); profileMount?.destroy(); localStorage.removeItem(SNAPSHOT_KEY); state.bootstrap = null; return dataAdapter.signOut(); }
  const copy = event.target.closest("[data-copy-key]"); if (copy) { try { await navigator.clipboard.writeText(translateText(WATA_REFERENCE_COPY[copy.dataset.copyKey], currentLanguage)); copy.textContent = translateText("Copied", currentLanguage); setTimeout(() => { copy.textContent = translateText("Copy again", currentLanguage); }, 1200); } catch { copy.textContent = translateText("Copy unavailable", currentLanguage); } return; }
  const appTarget = event.target.closest("[data-app-url]"); if (appTarget) { window.open(appTarget.dataset.appUrl, "_blank", "noopener,noreferrer"); return; }
  const view = event.target.closest("[data-view]"); if (view) { currentView = view.dataset.view; state.profileMode = view.dataset.profileMode || "edit"; history.replaceState(null, "", `#${currentView}`); openMenu(false); render(); scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (event.target.closest("#retryButton")) { if (state.error?.status === 401 || state.error?.status === 403) return dataAdapter.signIn(); return loadBootstrap(); }
});

document.addEventListener("keydown", event => { if (event.key === "Enter" && event.target.matches("[data-tag-input]")) { event.preventDefault(); addCustomTag(event.target); return; } if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-app-url]")) { event.preventDefault(); event.target.click(); } if (event.key === "Escape") { closeLanguageMenu(); openMenu(false); } });

addEventListener("online", () => loadBootstrap({ background: Boolean(state.bootstrap) }));
addEventListener("offline", () => { state.offlineSnapshot = Boolean(state.bootstrap); updateConnection(); render(); });
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
document.documentElement.dataset.profileComponentVersion = WATA_PROFILE_COMPONENT_VERSION;

setAppearance("theme", localStorage.getItem("wata-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
setAppearance("accent", localStorage.getItem("wata-accent") || "cyan");
const snapshot = readSnapshot();
if (snapshot) { state.bootstrap = snapshot; state.loading = false; state.offlineSnapshot = !navigator.onLine; render(); }
loadBootstrap({ background: Boolean(snapshot) });

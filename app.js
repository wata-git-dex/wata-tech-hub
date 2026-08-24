import { dataAdapter } from "./data-adapter.js";

const SNAPSHOT_KEY = "wata-tech-hub-bootstrap-v2";
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
  return `<article class="app-card ${ready ? "ready" : "soon"}" tabindex="${ready ? "0" : "-1"}" ${ready ? `role="link" data-app-url="${escapeHtml(appData.url)}"` : ""}>
    <div class="card-top"><span class="card-icon">${iconFor(appData)}</span><span class="status ${ready ? "ready" : "soon"}">${statusLabel(appData.status)}</span></div>
    <h3>${escapeHtml(appData.name)}</h3><p>${escapeHtml(appData.description)}</p>
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
  return `<section class="hero"><div class="hero-waves" aria-hidden="true"></div><div><p class="eyebrow">W.A.T.A. Toolkit</p><h1>Apps &amp; instructions</h1><p>Links and guides available to your account.</p></div></section>
    ${trips.length ? `<section class="trips"><div class="section-head"><div><h2>Upcoming trips</h2><p>Your confirmed assignments.</p></div></div>${trips.map(tripRow).join("")}</section>` : ""}
    <section id="apps"><div class="section-head"><div><h2>Apps</h2><p>${ready.length ? "Tap an app to open it." : "No apps are currently assigned to this account."}</p></div></div>${ready.length ? `<div class="app-grid">${ready.map(appCard).join("")}</div>` : `<div class="empty-state"><strong>No apps assigned</strong><p>Your Airtable App Access record is active, but no app checkboxes are currently enabled.</p></div>`}</section>
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

function flagEmoji(code) {
  return [...code].map(character => String.fromCodePoint(127397 + character.charCodeAt())).join("");
}

function countryField(value) {
  let names;
  try { names = new Intl.DisplayNames([navigator.language || "en"], { type: "region" }); } catch { names = { of: code => code }; }
  const countries = [...new Set(COUNTRY_CODES)].map(code => ({ code, name: names.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));
  const known = countries.some(country => country.name === value);
  return `<label class="profile-field"><span>Country</span><select name="country"><option value="">Select a country</option>${value && !known ? `<option value="${escapeHtml(value)}" selected>${escapeHtml(value)}</option>` : ""}${countries.map(country => `<option value="${escapeHtml(country.name)}" ${country.name === value ? "selected" : ""}>${flagEmoji(country.code)} ${escapeHtml(country.name)}</option>`).join("")}</select></label>`;
}

function tagPicker(name, label, values) {
  const selected = Array.isArray(values) ? values : [];
  const choices = [...new Set([...PROFILE_CHOICES[name], ...selected])];
  return `<div class="profile-field wide tag-field"><span>${label}</span><small class="field-help">${escapeHtml(PROFILE_HINTS[name])}</small><details class="tag-picker" data-tag-picker="${name}">
    <summary><span><strong>${label}</strong><small data-tag-summary>${selected.length ? escapeHtml(selected.join(" · ")) : "Tap to choose"}</small></span><span class="picker-chevron" aria-hidden="true">⌄</span></summary>
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
  const roles = state.bootstrap.roles.map(role => role.replaceAll("_", " ")).join(" · ") || "Member";
  const initials = display(profile.display_name, profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return `<header class="view-head"><p class="eyebrow">Shared profile</p><h1>Your W.A.T.A. profile</h1><p>Choose what fits and add what is missing. The Toolkit still saves a local draft until the shared W.A.T.A. account connection is switched on.</p></header>
    <form id="profileForm" class="profile-card"><div class="profile-summary"><label class="profile-photo">${avatarMarkup(profile, "profile-avatar", initials || "W")}<input id="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" hidden><span>Change photo</span></label><div><strong>${escapeHtml(display(profile.display_name, "W.A.T.A. member"))}</strong><small>${escapeHtml(roles)}</small></div></div><input id="avatarUrl" type="hidden" name="avatar_url" value="${escapeHtml(profile.avatar_url)}">
      <div class="profile-grid profile-core">${inputField("display_name", "Display name", profile.display_name)}${countryField(profile.country)}${tagPicker("skills", "Skills", profile.skills)}${tagPicker("interests", "Interests", profile.interests)}</div>
      <details class="profile-more"><summary>Contact &amp; additional details <span aria-hidden="true">⌄</span></summary><div class="profile-grid">
        ${inputField("email", "Email", profile.email, { type: "email" })}${inputField("phone", "Phone", profile.phone, { type: "tel" })}
        ${inputField("organization", "Organization", profile.organization)}${inputField("city", "City", profile.city)}
        ${inputField("language", "Preferred language", profile.language)}${inputField("bio", "Short bio", profile.bio, { textarea: true, wide: true })}
      </div><fieldset><legend>Emergency contact</legend><div class="profile-grid">${inputField("emergency_contact_name", "Name", profile.emergency_contact_name)}${inputField("emergency_contact_phone", "Phone", profile.emergency_contact_phone, { type: "tel" })}</div></fieldset></details>
      <button class="primary-button profile-save" type="submit">${state.saving ? "Saving…" : "Save profile"}</button><p class="form-note" id="profileMessage">Saved on this device for now; the shared profile service is the next connection.</p>
    </form>`;
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
    <article><span>01</span><h3>Your access</h3><p>Your active Airtable App Access record and individual checkboxes control the apps shown here. Partner access to the Filter Registry is scoped inside the Registry; Partner Portal is not a separate app.</p></article>
    <article><span>02</span><h3>Instructions</h3><p>Open Instructions from the menu to reach each app’s current PDF and share-ready PNG.</p></article>
    <article><span>03</span><h3>Offline use</h3><p>The Toolkit remembers your last verified launcher view for up to seven days. Opening external apps and refreshing access still require a connection.</p></article>
    <article><span>04</span><h3>Shared identity</h3><p>This interface is prepared for the future shared W.A.T.A. account system. It does not create another authentication, roles, profiles, or permissions backend.</p></article>
  </div>`;
}

function loadingView() {
  return `<section class="hero loading-hero"><div class="hero-waves" aria-hidden="true"></div><div><p class="eyebrow">W.A.T.A. Toolkit</p><h1>Apps &amp; instructions</h1><p>Preparing your available tools.</p></div></section><section class="loading-launcher" aria-label="Loading your apps"><div class="section-head"><div><h2>Apps</h2><p>Checking your access.</p></div><div class="loader" aria-hidden="true"><span></span><span></span><span></span></div></div><div class="skeleton-grid">${Array.from({ length: 6 }, () => `<span class="skeleton-app"><i></i><b></b></span>`).join("")}</div></section>`;
}

function errorView() {
  const unauthorized = state.error?.status === 401 || state.error?.status === 403;
  return `<section class="state-card error"><p class="eyebrow">${unauthorized ? "Secure access" : "Connection issue"}</p><h1>${unauthorized ? "Verify your W.A.T.A. email" : "The Toolkit could not load"}</h1><p>${escapeHtml(unauthorized ? "Continue through the existing W.A.T.A. verification screen. No new Toolkit-only login system has been created." : state.error?.message || "Try again when you have a connection.")}</p><button class="primary-button" type="button" id="retryButton">${unauthorized ? "Continue to sign in" : "Try again"}</button></section>`;
}

function render() {
  if (state.loading && !state.bootstrap) app.innerHTML = loadingView();
  else if (state.error && !state.bootstrap) app.innerHTML = errorView();
  else app.innerHTML = currentView === "profile" ? profileView() : currentView === "mission" ? missionView() : currentView === "about" ? aboutView() : currentView === "settings" ? settingsView() : homeView();
  syncNavigation();
}

function syncNavigation() {
  const bootstrap = state.bootstrap;
  if (!bootstrap) return;
  const profile = bootstrap.profile;
  const initials = display(profile.display_name, profile.email).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  document.querySelector("#menuProfile").innerHTML = `${avatarMarkup(profile, "avatar", initials || "W")}<span><strong>${escapeHtml(display(profile.display_name, "W.A.T.A. member"))}</strong><small>${escapeHtml(bootstrap.roles.join(" · ") || "Member")}</small></span>`;
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
  document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === "dark" ? "#08101c" : "#eef3f9";
  document.querySelectorAll(`[data-${kind}-choice]`).forEach(button => button.classList.toggle("active", button.dataset[`${kind}Choice`] === value));
}

function updateConnection() {
  const connected = navigator.onLine && !state.error;
  document.querySelector(".connection-dot")?.classList.toggle("connected", connected);
  const label = document.querySelector("#connectionLabel");
  if (label) label.textContent = navigator.onLine ? (state.error ? "Connection needed" : "Access synced") : "Offline snapshot";
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
  if (event.target.closest("#instructionsButton")) { const list = document.querySelector("#menuGuideList"); list.hidden = !list.hidden; return; }
  const copy = event.target.closest("[data-copy-key]"); if (copy) { try { await navigator.clipboard.writeText(WATA_REFERENCE_COPY[copy.dataset.copyKey]); copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy again"; }, 1200); } catch { copy.textContent = "Copy unavailable"; } return; }
  const appTarget = event.target.closest("[data-app-url]"); if (appTarget) { window.open(appTarget.dataset.appUrl, "_blank", "noopener,noreferrer"); return; }
  const view = event.target.closest("[data-view]"); if (view) { currentView = view.dataset.view; history.replaceState(null, "", `#${currentView}`); openMenu(false); render(); scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (event.target.closest("#retryButton")) { if (state.error?.status === 401 || state.error?.status === 403) return dataAdapter.signIn(); return loadBootstrap(); }
});

document.addEventListener("keydown", event => { if (event.key === "Enter" && event.target.matches("[data-tag-input]")) { event.preventDefault(); addCustomTag(event.target); return; } if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-app-url]")) { event.preventDefault(); event.target.click(); } if (event.key === "Escape") openMenu(false); });

document.addEventListener("change", async event => {
  if (event.target.id !== "avatarInput") return;
  const message = document.querySelector("#profileMessage");
  try {
    const avatarUrl = await readAvatar(event.target.files?.[0]);
    document.querySelector("#avatarUrl").value = avatarUrl;
    const avatar = document.querySelector(".profile-avatar"); avatar.innerHTML = `<img src="${avatarUrl}" alt="Profile photo preview">`;
    if (message) message.textContent = "Photo ready. Save your profile to keep it on this device.";
  } catch (error) { if (message) message.textContent = error.message; }
});

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

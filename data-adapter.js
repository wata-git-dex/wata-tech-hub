const PROFILE_DRAFT_KEY = "wata-tech-hub-profile-draft-v2";

const APP_CATALOG = Object.freeze({
  watadex: { app_key: "watadex", name: "WATAdex", description: "Explore W.A.T.A. water knowledge, WATAMON, and field resources.", icon_path: "/assets/apps/watadex/icon-192.png", status: "ready", access_level: "public" },
  partner_portal: { app_key: "filter_registry", name: "Filter Registry", description: "Review filters, follow-ups, impact, and issues within your approved program scope.", icon_path: "/assets/apps/registry/icon-192.png", status: "ready" },
  filter_registry: { app_key: "filter_registry", name: "Filter Registry", description: "Review filters, follow-ups, impact, and issues within your approved program scope.", icon_path: "/assets/apps/registry/icon-192.png", status: "ready" },
  impact_map: { app_key: "impact_map", name: "Impact Map", description: "Explore W.A.T.A.'s documented global footprint.", icon_path: "/assets/apps/impact-map/icon.svg", status: "ready", access_level: "public" },
  website: { app_key: "website", name: "W.A.T.A. Website", description: "Open the public home of Water Access To All.", icon_path: "/assets/apps/website/icon.svg", status: "ready", access_level: "public" },
  mwater: { app_key: "mwater", name: "mWater Surveyor", description: "Launch the official mWater field app or mobile web experience.", icon_path: "/assets/apps/mwater/icon.png", status: "ready" },
  community: { app_key: "community", name: "Community App", description: "Training, discussion, and the future W.A.T.A. community home.", icon_path: "/assets/apps/community/icon.png", status: "coming_soon" },
  field_kit: { app_key: "field_app", name: "Field App", description: "Offline-first field guidance, checklists, imagery, and approved survey launch points.", icon_path: "/assets/apps/field-app/icon.png", status: "coming_soon" },
  field_app: { app_key: "field_app", name: "Field App", description: "Offline-first field guidance, checklists, imagery, and approved survey launch points.", icon_path: "/assets/apps/field-app/icon.png", status: "coming_soon" }
});

const PROJECT_HUB_FIXTURE = Object.freeze({
  app_key: "project_hub",
  name: "Project Hub",
  description: "Plan programs, trips, assignments, and the work connected to each deployment.",
  url: "",
  icon_path: "",
  status: "coming_soon",
  access_level: "founder"
});

function array(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function string(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeProfile(body, session) {
  const source = body.profile || session.profile || {};
  const displayName = string(source.display_name || source.displayName || session.name);
  const parts = displayName.split(/\s+/).filter(Boolean);
  return {
    display_name: displayName,
    first_name: string(source.first_name || source.firstName || parts[0]),
    last_name: string(source.last_name || source.lastName || parts.slice(1).join(" ")),
    phone: string(source.phone),
    email: string(source.email || session.email || body.user?.email),
    organization: string(source.organization),
    country: string(source.country),
    city: string(source.city),
    language: string(source.language),
    bio: string(source.bio),
    avatar_url: string(source.avatar_url || source.avatarUrl),
    skills: array(source.skills),
    interests: array(source.interests),
    emergency_contact_name: string(source.emergency_contact_name || source.emergencyContactName),
    emergency_contact_phone: string(source.emergency_contact_phone || source.emergencyContactPhone)
  };
}

function normalizeApps(body, roles) {
  const source = Array.isArray(body.apps) ? body.apps : array(body.tools);
  const seen = new Set();
  const apps = [];
  for (const raw of source) {
    const rawKey = string(raw.app_key || raw.id);
    const catalog = APP_CATALOG[rawKey] || {};
    const app = {
      ...raw,
      ...catalog,
      app_key: catalog.app_key || rawKey,
      name: catalog.name || string(raw.name),
      description: catalog.description || string(raw.description),
      url: string(raw.url || catalog.url),
      icon_path: string(raw.icon_path || catalog.icon_path),
      status: catalog.status || string(raw.status || "ready"),
      access_level: string(raw.access_level || catalog.access_level)
    };
    if (!app.app_key || seen.has(app.app_key)) continue;
    seen.add(app.app_key);
    apps.push(app);
  }
  if (roles.includes("founder") && !seen.has("project_hub")) apps.push({ ...PROJECT_HUB_FIXTURE });
  const order = ["watadex", "filter_registry", "impact_map", "website", "mwater", "community", "field_app", "project_hub"];
  return apps.sort((a, b) => order.indexOf(a.app_key) - order.indexOf(b.app_key));
}

export function normalizeBootstrap(body = {}) {
  const session = body.session || {};
  const roles = array(body.roles?.length ? body.roles : session.roles?.length ? session.roles : session.role).map(role => string(role).toLowerCase());
  const profile = normalizeProfile(body, session);
  return {
    user: body.user || { id: string(session.id || session.email), email: profile.email },
    profile,
    roles,
    apps: normalizeApps(body, roles),
    trips: array(body.trips).map(trip => ({
      id: string(trip.id), name: string(trip.name), starts_at: string(trip.starts_at || trip.startsAt),
      ends_at: string(trip.ends_at || trip.endsAt), status: string(trip.status), trip_role: string(trip.trip_role || trip.tripRole),
      project_name: string(trip.project_name || trip.projectName), program_name: string(trip.program_name || trip.programName),
      country: string(trip.country), project_hub_url: string(trip.project_hub_url || trip.projectHubUrl)
    })),
    legacy: body
  };
}

function readDraft() {
  try { return JSON.parse(localStorage.getItem(PROFILE_DRAFT_KEY) || "null"); } catch { return null; }
}

export const dataAdapter = {
  async getSession() {
    const bootstrap = await this.getBootstrap();
    return bootstrap.user?.email ? { user: bootstrap.user } : null;
  },

  async signIn() {
    location.assign("/");
  },

  async signOut() {
    location.assign("/cdn-cgi/access/logout");
  },

  async getBootstrap({ signal } = {}) {
    const response = await fetch("/api/bootstrap", { headers: { accept: "application/json" }, cache: "no-store", signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(body.error || "Tech Hub unavailable"), { status: response.status });
    const normalized = normalizeBootstrap(body);
    const draft = readDraft();
    if (draft && draft.email === normalized.profile.email) normalized.profile = { ...normalized.profile, ...draft.profile };
    return normalized;
  },

  async updateProfile(profile) {
    const currentEmail = string(profile.email);
    localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify({ email: currentEmail, profile }));
    return { profile, temporary: true };
  }
};

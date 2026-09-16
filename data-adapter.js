const APP_CATALOG = Object.freeze({
  watadex: { app_key: "watadex", name: "WATAdex", description: "Explore W.A.T.A. water knowledge, WATAMON, and field resources.", icon_path: "/assets/apps/watadex/icon-192.png", status: "ready", access_level: "public" },
  partner_portal: { app_key: "filter_registry", name: "Filter Registry", description: "Review filters, follow-ups, impact, and issues within your approved program scope.", url: "https://registry.cleanwata.org/", icon_path: "/assets/apps/registry/icon-192.png", status: "ready", lifecycle_status: "beta", development_status: "active", version: "1.3.0" },
  filter_registry: { app_key: "filter_registry", name: "Filter Registry", description: "Review filters, follow-ups, impact, and issues within your approved program scope.", url: "https://registry.cleanwata.org/", icon_path: "/assets/apps/registry/icon-192.png", status: "ready", lifecycle_status: "beta", development_status: "active", version: "1.3.0" },
  impact_map: { app_key: "impact_map", name: "Impact Map", description: "Explore W.A.T.A.'s documented global footprint.", icon_path: "/assets/apps/impact-map/icon.svg", status: "ready", access_level: "public" },
  website: { app_key: "website", name: "W.A.T.A. Website", description: "Open the public home of Water Access To All.", icon_path: "/assets/apps/website/icon.svg", status: "ready", access_level: "public" },
  mwater: { app_key: "mwater", name: "mWater Surveyor", description: "Launch the official mWater field app or mobile web experience.", icon_path: "/assets/apps/mwater/icon.png", status: "ready" },
  community: { app_key: "community", name: "W.A.T.A. Community", description: "Connect, learn, coordinate, and share across the W.A.T.A. community.", url: "https://community.cleanwata.org/", icon_path: "/assets/apps/community/icon.png", status: "ready", lifecycle_status: "beta", development_status: "active", version: "1.3.12" },
  field_kit: { app_key: "field_app", name: "Field App", description: "Offline-first field guidance, checklists, imagery, and approved survey launch points.", url: "https://wata-field-app.pages.dev/", icon_path: "/assets/apps/field-app/icon.png", status: "ready", lifecycle_status: "alpha", development_status: "active", version: "0.20.0" },
  field_app: { app_key: "field_app", name: "Field App", description: "Offline-first field guidance, checklists, imagery, and approved survey launch points.", url: "https://wata-field-app.pages.dev/", icon_path: "/assets/apps/field-app/icon.png", status: "ready", lifecycle_status: "alpha", development_status: "active", version: "0.20.0" },
  project_hub: { app_key: "project_hub", name: "Project Hub", description: "Plan programs, trips, assignments, and the work connected to each deployment.", url: "https://projects.cleanwata.org/", status: "ready", lifecycle_status: "beta", availability_status: "preview", development_status: "active", version: "1.0.0" },
  grant_hub: { app_key: "grant_hub", name: "Grant Hub", description: "Review W.A.T.A. grants and the projects connected to them.", url: "https://wata-grant-hub.pages.dev/", status: "ready", lifecycle_status: "alpha", availability_status: "internal", development_status: "active", version: "0.1.0" },
  training_hub: { app_key: "training_hub", name: "Training Hub", description: "Complete W.A.T.A. orientation, WASH learning, and approved field training.", url: "", icon_path: "", status: "coming_soon", lifecycle_status: "planned", availability_status: "unavailable", development_status: "planned" },
  command_center: { app_key: "command_center", name: "Command Center", description: "The founder workspace for cross-app views, actions, alerts, and health.", url: "https://wata-command-center.pages.dev/", status: "ready", lifecycle_status: "alpha", availability_status: "preview", development_status: "active", version: "0.2.4" }
});

function array(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function string(value) {
  return value == null ? "" : String(value).trim();
}

function localEndpoint(value) {
  const path = string(value);
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "";
  try {
    const url = new URL(path, "https://toolkit.cleanwata.org");
    return url.origin === "https://toolkit.cleanwata.org" ? `${url.pathname}${url.search}` : "";
  } catch { return ""; }
}

function normalizeProfile(body, session) {
  const source = body.profile || session.profile || {};
  const displayName = string(source.display_name || source.displayName || session.name);
  const parts = displayName.split(/\s+/).filter(Boolean);
  return {
    id: string(source.id),
    name: displayName,
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
    avatar_ref: string(source.avatar_ref || source.avatarRef),
    skills: array(source.skills),
    interests: array(source.interests),
    current_location: string(source.current_location || source.currentLocation || source.city),
    contact_email: string(source.contact_email || source.contactEmail || source.email || session.email || body.user?.email),
    whatsapp_number: string(source.whatsapp_number || source.whatsappNumber || source.phone),
    show_email: source.show_email === true,
    show_whatsapp: source.show_whatsapp === true,
    role_label: string(source.role_label || source.roleLabel),
    profile_completed_at: source.profile_completed_at || source.profileCompletedAt || null,
    emergency_contact_name: string(source.emergency_contact_name || source.emergencyContactName),
    emergency_contact_phone: string(source.emergency_contact_phone || source.emergencyContactPhone)
  };
}

function normalizeIntegration(body) {
  const declared = body.integrations || {};
  const profile = declared.profile || body.profile_api || {};
  const preferences = declared.preferences || body.preferences_api || {};
  const profileLoadUrl = localEndpoint(profile.load_url || profile.read_url);
  const profileSaveUrl = localEndpoint(profile.save_url || profile.update_url);
  const avatarUploadUrl = localEndpoint(profile.avatar_upload_url || profile.avatar_url);
  const preferencesSaveUrl = localEndpoint(preferences.save_url || preferences.update_url);
  return {
    profile: {
      status: string(profile.status || (profileLoadUrl ? "available" : "pending")),
      load_url: profileLoadUrl,
      save_url: profileSaveUrl,
      avatar_upload_url: avatarUploadUrl,
      writable: profile.writable === true && Boolean(profileSaveUrl),
      avatar_writable: profile.avatar_writable === true && Boolean(avatarUploadUrl)
    },
    preferences: {
      status: string(preferences.status || (preferencesSaveUrl ? "available" : "pending")),
      save_url: preferencesSaveUrl,
      writable: preferences.writable === true && Boolean(preferencesSaveUrl)
    }
  };
}

async function requestJson(url, { method = "GET", body, signal } = {}) {
  if (!url) throw Object.assign(new Error("This shared W.A.T.A. service is not connected yet."), { status: 503 });
  const response = await fetch(url, {
    method,
    headers: body === undefined ? { accept: "application/json" } : { accept: "application/json", "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error || "The shared W.A.T.A. service is unavailable."), { status: response.status });
  return payload.data || payload;
}

function normalizeApps(body) {
  const source = Array.isArray(body.apps) ? body.apps : array(body.tools);
  const seen = new Set();
  const apps = [];
  for (const raw of source) {
    const rawKey = string(raw.app_key || raw.id);
    const catalog = APP_CATALOG[rawKey] || {};
    const appKey = catalog.app_key || rawKey;
    const url = string(raw.launch_url || raw.url || catalog.url);
    const lifecycleStatus = string(raw.lifecycle_status || catalog.lifecycle_status);
    const availabilityStatus = string(raw.availability_status || catalog.availability_status);
    const blocked = raw.enabled === false || availabilityStatus === "unavailable" || ["paused", "retired"].includes(lifecycleStatus);
    const app = {
      ...catalog,
      ...raw,
      app_key: appKey,
      name: rawKey === "partner_portal" ? catalog.name : string(raw.name || catalog.name),
      description: string(raw.description || catalog.description),
      url,
      launch_url: url,
      icon_path: string(raw.icon_path || catalog.icon_path),
      status: string(raw.status || catalog.status || (url && !blocked ? "ready" : "coming_soon")),
      lifecycle_status: lifecycleStatus,
      availability_status: availabilityStatus,
      development_status: string(raw.development_status || catalog.development_status),
      operational_status: string(raw.operational_status || catalog.operational_status),
      version: string(raw.current_version || raw.version || catalog.current_version || catalog.version),
      source_revision: string(raw.source_revision || catalog.source_revision),
      access_level: string(raw.access_level || raw.permission || catalog.access_level),
      sort_order: Number.isFinite(Number(raw.sort_order)) ? Number(raw.sort_order) : undefined
    };
    if (!app.app_key || seen.has(app.app_key) || raw.enabled === false) continue;
    if (blocked) app.status = "coming_soon";
    seen.add(app.app_key);
    apps.push(app);
  }
  const order = ["watadex", "filter_registry", "impact_map", "website", "mwater", "community", "field_app", "project_hub", "grant_hub", "training_hub", "command_center"];
  const orderIndex = app => app.sort_order ?? (order.includes(app.app_key) ? order.indexOf(app.app_key) : order.length);
  return apps.sort((a, b) => orderIndex(a) - orderIndex(b));
}

function normalizePersonalFilters(body) {
  const source = Array.isArray(body.my_filters) ? body.my_filters : Array.isArray(body.filters) ? body.filters : [];
  return source.map(raw => ({
    id: string(raw.filter_id || raw.id || raw.asset_id),
    barcode: string(raw.barcode || raw.qr_code || raw.filter_code),
    label: string(raw.label || raw.filter_name),
    community: string(raw.community_name || raw.community),
    country: string(raw.country),
    status: string(raw.status || raw.lifecycle_status),
    relationship_type: string(raw.relationship_type || raw.relationship || raw.role),
    relationship_label: string(raw.relationship_label)
  })).filter(filter => filter.id || filter.barcode);
}

export function normalizeBootstrap(body = {}) {
  const session = body.session || {};
  const roles = array(body.roles?.length ? body.roles : session.roles?.length ? session.roles : session.role).map(role => string(role).toLowerCase());
  const profile = normalizeProfile(body, session);
  return {
    user: body.user || { id: string(session.id || session.email), email: profile.email },
    profile,
    roles,
    apps: normalizeApps(body),
    filters: normalizePersonalFilters(body),
    trips: array(body.trips).map(trip => ({
      id: string(trip.id), name: string(trip.name), starts_at: string(trip.starts_at || trip.startsAt),
      ends_at: string(trip.ends_at || trip.endsAt), status: string(trip.status), trip_role: string(trip.trip_role || trip.tripRole),
      project_name: string(trip.project_name || trip.projectName), program_name: string(trip.program_name || trip.programName),
      country: string(trip.country), project_hub_url: string(trip.project_hub_url || trip.projectHubUrl)
    })),
    catalog: {
      source: Array.isArray(body.apps) ? "shared" : "legacy",
      refreshed_at: string(body.catalog?.refreshed_at || body.catalog_refreshed_at || body.generated_at)
    },
    preferences: body.preferences || {},
    integration: normalizeIntegration(body),
    legacy: body
  };
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
    if (!response.ok) throw Object.assign(new Error(body.error || "Toolkit unavailable"), { status: response.status });
    return normalizeBootstrap(body);
  },

  async loadProfile(bootstrap, { signal } = {}) {
    const payload = await requestJson(bootstrap?.integration?.profile?.load_url, { signal });
    return { profile: normalizeBootstrap({ user: bootstrap.user, profile: payload.profile || payload }).profile };
  },

  async updateProfile(bootstrap, patch, { signal, completeOnboarding = false } = {}) {
    if (!bootstrap?.integration?.profile?.writable) throw Object.assign(new Error("Shared profile editing is not connected in the Toolkit yet."), { status: 503 });
    const payload = await requestJson(bootstrap.integration.profile.save_url, { method: "PATCH", body: { ...patch, complete_onboarding: completeOnboarding }, signal });
    return { profile: normalizeBootstrap({ user: bootstrap.user, profile: payload.profile || payload }).profile };
  },

  async uploadAvatar(bootstrap, file, { signal } = {}) {
    const integration = bootstrap?.integration?.profile;
    if (!integration?.avatar_writable) throw Object.assign(new Error("Profile photo uploads are not connected in the Toolkit yet."), { status: 503 });
    const form = new FormData();
    form.append("file", file, file.name);
    const response = await fetch(integration.avatar_upload_url, { method: "POST", body: form, cache: "no-store", signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload.error || "The profile photo could not be uploaded."), { status: response.status });
    return payload.data || payload;
  }
};

const LEGACY_BACKEND = "https://wata-partner-portals.cleanwataorg.workers.dev";
const SHARED_PROFILE_BACKEND = "https://wata-community-api.cleanwataorg.workers.dev";
const CARD_CATALOG = {
  watadex: {
    name: "WATAdex",
    description: "Explore W.A.T.A. water knowledge, WATAMON, and field resources.",
    url: "https://wata-git-dex.github.io/watadex/",
    audience: "Public"
  },
  partner_portal: {
    name: "Filter Registry",
    description: "Review filters, follow-ups, impact, and issues within your approved program scope.",
    url: "https://registry.cleanwata.org/",
    audience: "Approved portal users",
    guides: [
      {
        format: "PDF",
        label: "Complete instructions",
        url: "/guides/WATA_Partner_Portal_Guide.pdf"
      },
      {
        format: "PNG",
        label: "Quick-start one-pager",
        url: "/guides/WATA_Partner_Portal_Guide_Page_2.png"
      }
    ]
  },
  community: {
    name: "W.A.T.A. Community",
    description: "Connect, learn, coordinate, and share across the W.A.T.A. community.",
    url: "https://community.cleanwata.org/",
    lifecycle_status: "beta",
    development_status: "active",
    version: "1.3.12",
    audience: "All active members"
  },
  impact_map: {
    name: "Impact Map",
    description: "Explore W.A.T.A.'s documented global footprint.",
    url: "https://map.cleanwata.org/",
    audience: "All active members"
  },
  website: {
    name: "W.A.T.A. Website",
    description: "Open the public home of Water Access to All.",
    url: "https://www.cleanwata.org/",
    audience: "Everyone"
  },
  field_kit: {
    name: "Field App",
    description: "Offline-first field guidance, checklists, imagery, and approved survey launch points.",
    url: "https://wata-field-app.pages.dev/",
    lifecycle_status: "alpha",
    development_status: "active",
    version: "0.20.0",
    audience: "Field & team"
  },
  field_app: {
    name: "Field App",
    description: "Offline-first field guidance, checklists, imagery, and approved survey launch points.",
    url: "https://wata-field-app.pages.dev/",
    lifecycle_status: "alpha",
    development_status: "active",
    version: "0.20.0",
    audience: "Field & team"
  },
  filter_registry: {
    name: "Filter Registry",
    description: "Review filters, follow-ups, impact, and issues within your approved program scope.",
    url: "https://registry.cleanwata.org/",
    lifecycle_status: "beta",
    development_status: "active",
    version: "1.3.0",
    audience: "Approved portal users"
  },
  project_hub: {
    name: "Project Hub",
    description: "Plan programs, trips, assignments, and the work connected to each deployment.",
    url: "https://projects.cleanwata.org/",
    lifecycle_status: "beta",
    development_status: "active",
    version: "1.0.0",
    audience: "Approved project members"
  },
  grant_hub: {
    name: "Grant Hub",
    description: "Review W.A.T.A. grants and the projects connected to them.",
    url: "https://wata-grant-hub.pages.dev/",
    lifecycle_status: "alpha",
    availability_status: "internal",
    development_status: "active",
    version: "0.1.0",
    audience: "Approved grant team"
  },
  command_center: {
    name: "Command Center",
    description: "The founder workspace for cross-app views, actions, alerts, and health.",
    url: "https://wata-command-center.pages.dev/",
    lifecycle_status: "alpha",
    availability_status: "preview",
    development_status: "active",
    version: "0.2.4",
    audience: "Founder"
  },
  mwater: {
    name: "mWater Surveyor",
    description: "Launch the official mWater field app or mobile web experience.",
    url: "https://app.mwater.co/#/",
    audience: "Field & team"
  }
};

async function applyHubCatalog(response) {
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return response;
  const payload = await response.json();
  if (!Array.isArray(payload.tools)) return response;
  payload.tools = payload.tools.map(tool => {
    const card = CARD_CATALOG[tool.id];
    if (!card) return tool;
    return { ...tool, ...card, status: card.status || (card.url ? "ready" : "coming_soon") };
  });
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "private, no-store");
  return new Response(JSON.stringify(payload), { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "app.cleanwata.org" || (url.hostname === "toolkit.cleanwata.org" && (url.pathname === "/" || url.pathname === "/index.html"))) {
      url.hostname = "wata.cleanwata.org";
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname.startsWith("/api/shared/")) {
      const sharedPath = url.pathname.replace(/^\/api\/shared/, "/v1");
      const backendUrl = new URL(sharedPath + url.search, SHARED_PROFILE_BACKEND);
      const headers = new Headers(request.headers);
      headers.delete("origin");
      headers.delete("host");
      const response = await fetch(new Request(backendUrl, { method: request.method, headers, body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body, redirect: "manual" }));
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete("access-control-allow-origin");
      responseHeaders.set("cache-control", "private, no-store");
      return new Response(response.body, { status: response.status, headers: responseHeaders });
    }
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = new URL(url.pathname + url.search, LEGACY_BACKEND);
      const backendRequest = new Request(backendUrl, request);
      backendRequest.headers.set("x-wata-product", "hub");
      const response = env.PORTAL ? await env.PORTAL.fetch(backendRequest) : await fetch(backendRequest);
      return url.pathname === "/api/bootstrap" ? applyHubCatalog(response) : response;
    }
    return env.ASSETS.fetch(request);
  }
};

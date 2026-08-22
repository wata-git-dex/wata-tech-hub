const LEGACY_BACKEND = "https://wata-partner-portals.cleanwataorg.workers.dev";
const CARD_CATALOG = {
  watadex: {
    name: "WATAdex",
    description: "Explore W.A.T.A. water knowledge, WATAMON, and field resources.",
    url: "https://wata-git-dex.github.io/watadex/",
    audience: "Field & team"
  },
  partner_portal: {
    name: "Partner Portal",
    description: "Filter reporting, follow-ups, impact, and issues for approved partners.",
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
    name: "Community App",
    description: "Training, discussion, and the future W.A.T.A. community home.",
    url: "",
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
    url: "",
    audience: "Field & team"
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
    return { ...tool, ...card, status: card.url ? "ready" : "coming_soon" };
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

const SESSION_KEY = "wata.identity.session.v1";
const RETURN_ROUTE_KEY = "wata.wonderful-world.auth-return.v1";

export class SupabaseAuth {
  constructor({ supabaseUrl, supabasePublishableKey }) {
    this.url = String(supabaseUrl || "").replace(/\/$/, "");
    this.key = String(supabasePublishableKey || "");
    this.session = this.#readSession();
  }

  get configured() { return Boolean(this.url && this.key); }
  get accessToken() { return this.session?.access_token || ""; }
  get subject() { return tokenClaim(this.accessToken, "sub"); }
  get email() { return tokenClaim(this.accessToken, "email"); }

  signInWithGoogle(redirectTo = `${location.origin}${location.pathname}`) {
    if (!this.configured) throw new Error("W.A.T.A. sign-in is not configured.");
    try { sessionStorage.setItem(RETURN_ROUTE_KEY, /^#[a-z-]+$/i.test(location.hash) ? location.hash : "#profile"); } catch {}
    const params = new URLSearchParams({ provider: "google", redirect_to: redirectTo });
    location.assign(`${this.url}/auth/v1/authorize?${params}`);
  }

  async signInWithWata(identifier, password) {
    const login = String(identifier || "").trim();
    if (!login) throw new Error("Enter your approved email or phone number.");
    if (!password) throw new Error("Enter your W.A.T.A. password.");
    const body = login.includes("@")
      ? { email: login.toLowerCase(), password }
      : { phone: normalizePhone(login), password };
    const session = await this.#request("/auth/v1/token?grant_type=password", { method: "POST", body });
    this.#storeSession(session);
    return session;
  }

  consumeOAuthCallback(hash = location.hash) {
    if (!hash?.startsWith("#")) return null;
    const params = new URLSearchParams(hash.slice(1));
    if (params.get("error")) throw new Error(params.get("error_description") || params.get("error"));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return null;
    this.#storeSession({ access_token: accessToken, refresh_token: refreshToken, token_type: params.get("token_type") || "bearer", expires_in: Number(params.get("expires_in") || 3600) });
    let returnRoute = "#profile";
    try { returnRoute = sessionStorage.getItem(RETURN_ROUTE_KEY) || returnRoute; sessionStorage.removeItem(RETURN_ROUTE_KEY); } catch {}
    history.replaceState(null, "", `${location.pathname}${location.search}${returnRoute}`);
    return this.session;
  }

  async restore() {
    if (!this.session) return null;
    if ((this.session.expires_at || 0) > Math.floor(Date.now() / 1000) + 60) return this.session;
    if (!this.session.refresh_token) return this.signOut();
    try {
      const refreshed = await this.#request("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: this.session.refresh_token } });
      this.#storeSession(refreshed);
      return refreshed;
    } catch { return this.signOut(); }
  }

  signOut() {
    if (this.accessToken) fetch(`${this.url}/auth/v1/logout`, { method: "POST", headers: this.#headers(true) }).catch(() => {});
    this.session = null;
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  async #request(path, { method = "GET", body } = {}) {
    const response = await fetch(`${this.url}${path}`, { method, headers: this.#headers(false), body: body ? JSON.stringify(body) : undefined });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.msg || payload.message || payload.error_description || payload.error || "Authentication failed.");
    return payload;
  }

  #headers(authenticated) {
    const headers = { apikey: this.key, "Content-Type": "application/json" };
    if (authenticated && this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
    return headers;
  }

  #storeSession(session) {
    this.session = { ...session, expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600) };
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
  }

  #readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
}

function tokenClaim(token, claim) {
  try {
    const payload = String(token || "").split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return String(JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")))[claim] || "");
  } catch { return ""; }
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!raw.startsWith("+") || digits.length < 8 || digits.length > 15) throw new Error("Use +, country code, and your full phone number.");
  return `+${digits}`;
}

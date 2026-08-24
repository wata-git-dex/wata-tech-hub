import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBootstrap } from "../data-adapter.js";

test("normalizes the legacy Partner Portal key into one Filter Registry app", () => {
  const result = normalizeBootstrap({
    session: { email: "partner@example.org", name: "Partner Person", role: "partner" },
    tools: [
      { id: "partner_portal", name: "Partner Portal", url: "https://registry.cleanwata.org/", status: "ready" },
      { id: "watadex", url: "https://watadex.example/", status: "ready" }
    ]
  });
  assert.equal(result.apps.length, 2);
  assert.equal(result.apps[1].app_key, "filter_registry");
  assert.equal(result.apps[1].name, "Filter Registry");
  assert.equal(result.apps.filter(app => app.name === "Partner Portal").length, 0);
  assert.equal(result.apps[0].access_level, "public");
});

test("adds the confirmed Project Hub roadmap card only for Founder", () => {
  const founder = normalizeBootstrap({ session: { role: "founder" }, tools: [{ id: "website", url: "https://www.cleanwata.org/" }] });
  const volunteer = normalizeBootstrap({ session: { role: "volunteer" }, tools: [{ id: "website", url: "https://www.cleanwata.org/" }] });
  assert.ok(founder.apps.some(app => app.app_key === "project_hub" && app.status === "coming_soon"));
  assert.ok(!volunteer.apps.some(app => app.app_key === "project_hub"));
});

test("accepts the future bootstrap shape without replacing its profile or trips", () => {
  const result = normalizeBootstrap({
    user: { id: "u1", email: "cyrus@example.org" },
    profile: { display_name: "Cyrus", organization: "W.A.T.A.", emergency_contact_name: "Example" },
    roles: ["founder"],
    apps: [{ app_key: "impact_map", url: "https://map.cleanwata.org/", status: "ready" }],
    trips: [{ id: "t1", name: "Water Trip", starts_at: "2026-10-10", country: "Colombia", trip_role: "Lead" }]
  });
  assert.equal(result.user.id, "u1");
  assert.equal(result.profile.organization, "W.A.T.A.");
  assert.equal(result.profile.emergency_contact_name, "Example");
  assert.equal(result.trips[0].country, "Colombia");
});

test("preserves a legitimate empty app assignment for the UI empty state", () => {
  const result = normalizeBootstrap({ user: { id: "u2", email: "new@example.org" }, roles: ["volunteer"], apps: [] });
  assert.equal(result.profile.email, "new@example.org");
  assert.deepEqual(result.apps, []);
});

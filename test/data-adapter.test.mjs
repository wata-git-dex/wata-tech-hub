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

test("does not infer app grants from a Founder role", () => {
  const founder = normalizeBootstrap({ session: { role: "founder" }, tools: [{ id: "website", url: "https://www.cleanwata.org/" }] });
  const volunteer = normalizeBootstrap({ session: { role: "volunteer" }, tools: [{ id: "website", url: "https://www.cleanwata.org/" }] });
  assert.deepEqual(founder.apps.map(app => app.app_key), ["website"]);
  assert.deepEqual(volunteer.apps.map(app => app.app_key), ["website"]);
});

test("normalizes current live app metadata without granting unassigned apps", () => {
  const result = normalizeBootstrap({ session: { role: "member" }, tools: [{ id: "community" }, { id: "field_kit" }, { id: "filter_registry" }] });
  assert.deepEqual(result.apps.map(app => app.app_key), ["filter_registry", "community", "field_app"]);
  assert.ok(result.apps.every(app => app.status === "ready" && app.url));
  assert.equal(result.apps.find(app => app.app_key === "community").name, "W.A.T.A. Community");
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

test("preserves canonical onboarding state without inferring completion", () => {
  const pending = normalizeBootstrap({ user: { id: "u3", email: "new@example.org" }, profile: { name: "New Member" }, apps: [] });
  const complete = normalizeBootstrap({ user: { id: "u3", email: "new@example.org" }, profile: { name: "New Member", profile_completed_at: "2026-09-15T08:00:00Z" }, apps: [] });
  assert.equal(pending.profile.profile_completed_at, null);
  assert.equal(complete.profile.profile_completed_at, "2026-09-15T08:00:00Z");
});

test("profile writes stay disabled until the platform declares same-origin endpoints", () => {
  const pending = normalizeBootstrap({ user: { id: "u4" }, integrations: { profile: { writable: true, save_url: "https://example.org/profile" } } });
  const connected = normalizeBootstrap({ user: { id: "u4" }, integrations: { profile: { status: "available", writable: true, save_url: "/api/profile", load_url: "/api/profile", avatar_writable: true, avatar_upload_url: "/api/profile/avatar" } } });
  assert.equal(pending.integration.profile.writable, false);
  assert.equal(connected.integration.profile.writable, true);
  assert.equal(connected.integration.profile.save_url, "/api/profile");
  assert.equal(connected.integration.profile.avatar_writable, true);
});

test("normalizes only approved personal-filter relationship fields", () => {
  const result = normalizeBootstrap({
    user: { id: "member-1" },
    my_filters: [{
      filter_id: "filter-1",
      barcode: "WATA-001",
      community_name: "Example Community",
      country: "Guatemala",
      relationship_type: "ambassador",
      lifecycle_status: "Active",
      household_name: "Private household",
      internal_notes: "Private note"
    }]
  });
  assert.deepEqual(result.filters, [{
    id: "filter-1",
    barcode: "WATA-001",
    label: "",
    community: "Example Community",
    country: "Guatemala",
    status: "Active",
    relationship_type: "ambassador",
    relationship_label: ""
  }]);
  assert.equal("household_name" in result.filters[0], false);
  assert.equal("internal_notes" in result.filters[0], false);
});

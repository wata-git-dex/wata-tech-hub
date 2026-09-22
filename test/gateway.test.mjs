import test from "node:test";
import assert from "node:assert/strict";
import gateway from "../gateway.js";

test("redirects the former app hostname to the canonical W.A.T.A. Wonderful World hostname", async () => {
  const response = await gateway.fetch(new Request("https://app.cleanwata.org/profile?from=bookmark"), {
    ASSETS: { fetch: () => { throw new Error("assets should not be reached"); } }
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://wata.cleanwata.org/profile?from=bookmark");
});

test("forwards old Toolkit bookmarks to Wonderful World", async () => {
  const response = await gateway.fetch(new Request("https://toolkit.cleanwata.org/"), {
    ASSETS: { fetch: request => new Response(new URL(request.url).hostname) }
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://wata.cleanwata.org/");
});

test("keeps legacy Toolkit assets available while bookmarks migrate", async () => {
  const response = await gateway.fetch(new Request("https://toolkit.cleanwata.org/manifest.webmanifest"), {
    ASSETS: { fetch: () => new Response("manifest") }
  });
  assert.equal(response.status, 200);
});

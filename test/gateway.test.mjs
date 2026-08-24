import test from "node:test";
import assert from "node:assert/strict";
import gateway from "../gateway.js";

test("redirects the former W.A.T.A. hostname to the canonical Toolkit hostname", async () => {
  const response = await gateway.fetch(new Request("https://wata.cleanwata.org/profile?from=bookmark"), {
    ASSETS: { fetch: () => { throw new Error("assets should not be reached"); } }
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://toolkit.cleanwata.org/profile?from=bookmark");
});

test("keeps the app hostname available for installed-PWA compatibility", async () => {
  const response = await gateway.fetch(new Request("https://app.cleanwata.org/"), {
    ASSETS: { fetch: request => new Response(new URL(request.url).hostname) }
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "app.cleanwata.org");
});

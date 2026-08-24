import test from "node:test";
import assert from "node:assert/strict";
import gateway from "../gateway.js";

test("redirects the former Tech Hub hostname to the canonical app hostname", async () => {
  const response = await gateway.fetch(new Request("https://wata.cleanwata.org/profile?from=bookmark"), {
    ASSETS: { fetch: () => { throw new Error("assets should not be reached"); } }
  });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://app.cleanwata.org/profile?from=bookmark");
});

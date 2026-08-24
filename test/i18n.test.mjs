import test from "node:test";
import assert from "node:assert/strict";
import { languageLocale, normalizeLanguage, translateText } from "../i18n.js";

test("normalizes the shared W.A.T.A. language preference", () => {
  assert.equal(normalizeLanguage("es-MX"), "es");
  assert.equal(normalizeLanguage("en-US"), "en");
  assert.equal(normalizeLanguage("vi"), "en");
});

test("translates Toolkit interface and mission copy into Spanish", () => {
  assert.equal(translateText("Apps & instructions", "es"), "Aplicaciones e instrucciones");
  assert.match(translateText("Water Access To All brings clean, safe drinking water to communities without reliable access—installing filtration systems while developing the local capacity and leadership to carry the work forward.", "es"), /agua potable limpia y segura/);
  assert.equal(translateText("WATAdex", "es"), "WATAdex");
  assert.equal(translateText("Unrecognized profile value", "es"), "Unrecognized profile value");
});

test("uses locale identifiers appropriate for each language", () => {
  assert.equal(languageLocale("es"), "es-419");
  assert.equal(languageLocale("en"), "en-US");
});

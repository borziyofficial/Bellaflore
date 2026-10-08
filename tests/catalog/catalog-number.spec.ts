import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveCatalogNumber } from "../../lib/catalogDb/catalogNumber.ts";

test("stored article stays ahead of the creation-order fallback", () => {
  assert.equal(resolveCatalogNumber("BF-255", "BF-230"), "BF-255");
  assert.equal(resolveCatalogNumber(" BF-006 ", "BF-001"), "BF-006");
});

test("fallback is used only when no article is stored", () => {
  assert.equal(resolveCatalogNumber("", "BF-231"), "BF-231");
  assert.equal(resolveCatalogNumber(null, "BF-231"), "BF-231");
  assert.equal(resolveCatalogNumber("   ", undefined), "");
});

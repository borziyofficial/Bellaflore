import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CatalogArticleFormatError,
  catalogArticleKey,
  normalizeCatalogArticle,
} from "../../lib/catalog/catalogArticle.ts";

test("a blank article stays automatic", () => {
  assert.equal(normalizeCatalogArticle("  "), null);
  assert.equal(normalizeCatalogArticle(null), null);
});

test("manual articles normalize to the stored BF form", () => {
  assert.equal(normalizeCatalogArticle("2"), "BF-002");
  assert.equal(normalizeCatalogArticle("bf-7"), "BF-007");
  assert.equal(normalizeCatalogArticle("BF-005"), "BF-005");
});

test("an invalid article is rejected", () => {
  assert.throws(() => normalizeCatalogArticle("роза"), CatalogArticleFormatError);
  assert.throws(() => normalizeCatalogArticle("0"), CatalogArticleFormatError);
});

test("occupied comparison treats BF-2 and BF-002 as the same article", () => {
  assert.equal(catalogArticleKey("BF-2"), catalogArticleKey("bf-002"));
});

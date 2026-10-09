import assert from "node:assert/strict";
import { test } from "node:test";
import { compareCatalogArticles } from "../../lib/catalogArticleOrder.ts";

const publishedOrder = [
  "BF-006",
  "BF-009",
  "BF-010",
  "BF-011",
  "BF-229",
  "BF-230",
  "BF-231",
  "BF-387",
];

test("default catalog order follows the numeric BF article", () => {
  const shuffled = [
    "BF-230",
    "BF-006",
    "BF-387",
    "BF-010",
    "BF-231",
    "BF-011",
    "BF-229",
    "BF-009",
  ];

  assert.deepEqual([...shuffled].sort(compareCatalogArticles), publishedOrder);

  for (let index = 1; index < publishedOrder.length; index += 1) {
    assert.ok(
      compareCatalogArticles(publishedOrder[index - 1], publishedOrder[index]) < 0,
    );
  }
});

test("article order is numeric, so BF-11 stays ahead of BF-100", () => {
  assert.ok(compareCatalogArticles("BF-11", "BF-100") < 0);
  assert.ok(compareCatalogArticles("BF-100", "BF-11") > 0);
  assert.equal(["BF-100", "BF-11"].sort()[0], "BF-100");
});

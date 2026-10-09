import assert from "node:assert/strict";
import { test } from "node:test";
import { canFallbackProductImageUpload } from "../../components/adminCatalogManager/adminImageUploadPolicy.ts";
import {
  isAdminFormDirty,
  markPrimaryAdminImage,
  moveAdminImages,
} from "../../components/adminCatalogManager/adminProductStudioEdits.ts";
import type { AdminProductImageDraft } from "../../components/adminCatalogManager/adminCatalogTypes.ts";

function image(id: string, sortOrder: number, isPrimary = false): AdminProductImageDraft {
  return {
    id,
    originalUrl: `https://example.com/${id}.webp`,
    processedUrl: `https://example.com/${id}.webp`,
    thumbnailUrl: `https://example.com/${id}.webp`,
    filename: `${id}.webp`,
    mimeType: "image/webp",
    width: 100,
    height: 100,
    size: 10,
    sortOrder,
    isPrimary,
    processingStatus: "original",
    processingError: null,
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
  };
}

test("moving a photo reorders it and leaves the other photos in place", () => {
  const moved = moveAdminImages(
    [image("a", 0, true), image("b", 1), image("c", 2)],
    "c",
    -1,
  );

  assert.deepEqual(
    moved?.map((item) => item.id),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    moved?.map((item) => item.sortOrder),
    [0, 1, 2],
  );
});

test("moving the first photo earlier does not change the gallery", () => {
  assert.equal(moveAdminImages([image("a", 0), image("b", 1)], "a", -1), null);
});

test("marking a cover keeps exactly one primary photo", () => {
  const next = markPrimaryAdminImage(
    [image("a", 0, true), image("b", 1)],
    "b",
  );

  assert.deepEqual(
    next.map((item) => [item.id, item.isPrimary]),
    [
      ["a", false],
      ["b", true],
    ],
  );
});

test("a failed direct upload can fall back only for a photo the server route can accept", () => {
  assert.equal(canFallbackProductImageUpload(201), true);
  assert.equal(canFallbackProductImageUpload(4 * 1024 * 1024), true);
  assert.equal(canFallbackProductImageUpload(4 * 1024 * 1024 + 1), false);
  assert.equal(canFallbackProductImageUpload(0), false);
});

test("an unsaved edit is detected and a saved form is clean", () => {
  const saved = JSON.stringify({ title: "Белая Маттиола", price: "5900" });
  const edited = JSON.stringify({ title: "Белая Маттиола 2", price: "5900" });

  assert.equal(isAdminFormDirty(edited, saved), true);
  assert.equal(isAdminFormDirty(saved, saved), false);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compactStorefrontGalleryImages,
  DEFAULT_STOREFRONT_CARE,
  DEFAULT_STOREFRONT_DELIVERY_HINT,
  resolveStorefrontCare,
  resolveStorefrontDeliveryHint,
} from "../../lib/catalog/storefrontListPayload.ts";

test("gallery that only repeats the primary image collapses to an empty list", () => {
  const primary = "https://cdn.example/primary.jpg";
  assert.deepEqual(
    compactStorefrontGalleryImages(
      [
        {
          id: "1",
          src: primary,
          alt: "A",
          width: 1080,
          height: 1350,
        },
        {
          id: "2",
          src: `${primary} `,
          alt: "A duplicate",
          width: 1080,
          height: 1350,
        },
      ],
      primary,
    ),
    [],
  );
});

test("extra unique gallery photos are kept after dedupe", () => {
  const primary = "https://cdn.example/primary.jpg";
  const extra = "https://cdn.example/extra.jpg";
  assert.deepEqual(
    compactStorefrontGalleryImages(
      [
        {
          id: "1",
          src: primary,
          alt: "A",
          width: 1080,
          height: 1350,
        },
        {
          id: "2",
          src: extra,
          alt: "B",
          width: 1080,
          height: 1350,
        },
        {
          id: "3",
          src: extra,
          alt: "B again",
          width: 1080,
          height: 1350,
        },
      ],
      primary,
    ),
    [
      {
        id: "1",
        src: primary,
        alt: "A",
        width: 1080,
        height: 1350,
      },
      {
        id: "2",
        src: extra,
        alt: "B",
        width: 1080,
        height: 1350,
      },
    ],
  );
});

test("empty care and delivery hints resolve to the shared storefront defaults", () => {
  assert.equal(resolveStorefrontCare(""), DEFAULT_STOREFRONT_CARE);
  assert.equal(resolveStorefrontCare("  "), DEFAULT_STOREFRONT_CARE);
  assert.equal(
    resolveStorefrontDeliveryHint(undefined),
    DEFAULT_STOREFRONT_DELIVERY_HINT,
  );
  assert.equal(resolveStorefrontCare("Свой уход"), "Свой уход");
});

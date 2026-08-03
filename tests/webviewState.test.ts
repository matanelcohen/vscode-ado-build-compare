import assert from "node:assert/strict";
import test from "node:test";
import {
  comparisonSkinDescriptors,
  comparisonSkins,
  defaultComparisonSkin,
  readComparisonSkin,
  readComparisonTab,
} from "../src/models/webviewState";
import {
  defaultAppearancePreferences,
  readAppearancePreferences,
} from "../src/models/appearance";

test("restores a valid comparison tab", () => {
  assert.equal(readComparisonTab({ selectedTab: "share" }), "share");
});

test("falls back to compare for missing or invalid state", () => {
  assert.equal(readComparisonTab(undefined), "compare");
  assert.equal(readComparisonTab({ selectedTab: "unknown" }), "compare");
});

test("restores a valid skin", () => {
  assert.equal(readComparisonSkin({ skin: "workbench" }), "workbench");
  assert.equal(readComparisonSkin({ skin: "report" }), "report");
});

test("falls back to the classic skin for missing or invalid state", () => {
  assert.equal(readComparisonSkin(undefined), defaultComparisonSkin);
  assert.equal(readComparisonSkin({ skin: "neon" }), "classic");
  assert.equal(readComparisonSkin({ selectedTab: "share" }), "classic");
});

test("every skin has a descriptor with a unique id", () => {
  assert.equal(comparisonSkinDescriptors.length, comparisonSkins.length);
  for (const skin of comparisonSkins) {
    const descriptor = comparisonSkinDescriptors.find(
      (candidate) => candidate.id === skin
    );
    assert.ok(descriptor, `missing descriptor for ${skin}`);
    assert.ok(descriptor.label.length > 0);
    assert.ok(descriptor.description.length > 0);
  }
});

test("restores valid appearance preferences", () => {
  assert.deepEqual(
    readAppearancePreferences({
      appearance: {
        colorTheme: "emerald",
        density: "compact",
        contentWidth: "full",
      },
    }),
    {
      colorTheme: "emerald",
      density: "compact",
      contentWidth: "full",
    }
  );
});

test("appearance preferences safely fall back for invalid state", () => {
  assert.deepEqual(
    readAppearancePreferences({
      appearance: {
        colorTheme: "neon",
        density: "tiny",
        contentWidth: 42,
      },
    }),
    defaultAppearancePreferences
  );
});

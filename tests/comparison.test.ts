import assert from "node:assert/strict";
import test from "node:test";
import {
  isPathRelevant,
  isPathWithinScope,
  mapWithConcurrency,
  normalizePath,
  parsePathFilters,
  summarizeFileHotspots,
  uniqueFiles,
  uniqueIdentities,
} from "../src/utils/comparison";
import { buildCommitRangeCriteria } from "../src/utils/adoComparison";

test("queries commits introduced between the base and target versions", () => {
  const criteria = buildCommitRangeCriteria("base-sha", "target-sha");
  assert.equal(criteria.itemVersion?.version, "base-sha");
  assert.equal(criteria.compareVersion?.version, "target-sha");
});

test("normalizes comma-separated path filters", () => {
  assert.deepEqual(parsePathFilters(" src/app/, /infra\\pipelines, ,/"), [
    "/src/app",
    "/infra/pipelines",
    "/",
  ]);
  assert.equal(normalizePath("src/app///"), "/src/app");
});

test("matches path boundaries instead of partial folder names", () => {
  const filters = ["/src/app"];
  assert.equal(isPathRelevant("/src/app/index.ts", filters), true);
  assert.equal(isPathRelevant("/src/app", filters), true);
  assert.equal(isPathRelevant("/packages/gaia/app.ts", ["/gaia"]), true);
  assert.equal(isPathRelevant("/packages/gaia-chat/app.ts", ["/gaia"]), true);
  assert.equal(isPathRelevant("/packages/gaiachat/app.ts", ["/gaia"]), false);
  assert.equal(isPathRelevant("/src/application/index.ts", filters), false);
  assert.equal(isPathRelevant("/any/path", []), true);
  assert.equal(isPathRelevant("/any/path", ["/"]), true);
});

test("filters a selected changed area without matching sibling prefixes", () => {
  assert.equal(isPathWithinScope("/packages/gaia/app.ts", "/packages/gaia"), true);
  assert.equal(isPathWithinScope("/packages/gaia", "/packages/gaia"), true);
  assert.equal(
    isPathWithinScope("/packages/gaia-chat/app.ts", "/packages/gaia"),
    false
  );
  assert.equal(
    isPathWithinScope("/packages/GAIA/app.ts", "/packages/gaia"),
    true
  );
});

test("deduplicates files and identities deterministically", () => {
  assert.deepEqual(
    uniqueFiles([
      { path: "/b.ts", changeType: "Edit" },
      { path: "/a.ts", changeType: "Add" },
      { path: "/a.ts", changeType: "Edit" },
    ]),
    [
      { path: "/a.ts", changeType: "Add, Edit" },
      { path: "/b.ts", changeType: "Edit" },
    ]
  );
  assert.deepEqual(
    uniqueIdentities([
      { displayName: "B", email: "b@example.com" },
      { displayName: "A", email: "A@example.com" },
      { displayName: "A duplicate", email: "a@example.com" },
    ]).map((identity) => identity.displayName),
    ["A", "B"]
  );
});

test("summarizes the busiest changed areas", () => {
  assert.deepEqual(
    summarizeFileHotspots([
      { path: "/packages/gaia/a.ts", changeType: "Edit" },
      { path: "/packages/gaia/b.ts", changeType: "Add" },
      { path: "/packages/gaia-chat/c.ts", changeType: "Edit" },
      { path: "/packages/gaia-chat/d.ts", changeType: "Edit" },
      { path: "/infra/main.bicep", changeType: "Edit" },
    ]),
    [
      { path: "/packages/gaia", count: 2 },
      { path: "/packages/gaia-chat", count: 2 },
      { path: "/infra/main.bicep", count: 1 },
    ]
  );
});

test("maps values with bounded concurrency while preserving order", async () => {
  let active = 0;
  let maximumActive = 0;
  const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });

  assert.deepEqual(result, [2, 4, 6, 8]);
  assert.equal(maximumActive, 2);
});

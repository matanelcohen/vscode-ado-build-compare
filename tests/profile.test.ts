import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidOrganizationUrl,
  normalizeProfileState,
  PipelineProfile,
  upsertProfile,
} from "../src/models/profile";

function profile(id: string, name: string): PipelineProfile {
  return {
    id,
    name,
    config: {
      organizationUrl: "https://dev.azure.com/example",
      projectName: "Product",
      pipelineDefinitionId: 42,
      targetStageName: "Production",
      repositoryId: "repository-id",
      relevantPathFilter: "/src",
    },
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
  };
}

test("accepts Azure DevOps organization URLs without allowing token exfiltration", () => {
  assert.equal(
    isValidOrganizationUrl("https://dev.azure.com/example"),
    true
  );
  assert.equal(
    isValidOrganizationUrl("https://example.visualstudio.com"),
    true
  );
  assert.equal(isValidOrganizationUrl("https://example.com/ado"), false);
  assert.equal(
    isValidOrganizationUrl("https://dev.azure.com/example/extra"),
    false
  );
  assert.equal(isValidOrganizationUrl("http://dev.azure.com/example"), false);
});

test("normalizes persisted profiles and repairs an invalid active ID", () => {
  const first = profile("first", "First");
  const normalized = normalizeProfileState({
    activeProfileId: "missing",
    profiles: [first, { id: "broken" }],
  });
  assert.equal(normalized.activeProfileId, "first");
  assert.deepEqual(normalized.profiles, [first]);
});

test("upserts, sorts, and activates a profile", () => {
  const next = upsertProfile(
    {
      activeProfileId: "z",
      profiles: [profile("z", "Zulu"), profile("a", "Old name")],
    },
    profile("a", "Alpha")
  );
  assert.equal(next.activeProfileId, "a");
  assert.deepEqual(
    next.profiles.map((item) => item.name),
    ["Alpha", "Zulu"]
  );
});

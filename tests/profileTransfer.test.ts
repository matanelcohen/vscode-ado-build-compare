import assert from "node:assert/strict";
import test from "node:test";
import type { PipelineProfile } from "../src/models/profile";
import {
  createProfileExport,
  parseProfileImport,
} from "../src/utils/profileTransfer";

const profile: PipelineProfile = {
  id: "private-id",
  name: "Production",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  config: {
    organizationUrl: "https://dev.azure.com/example",
    projectName: "Store",
    pipelineDefinitionId: 42,
    targetStageName: "Production",
    repositoryId: "repo",
  },
  automation: {
    enabled: true,
    intervalMinutes: 15,
    mentionUpns: ["ada@example.com"],
  },
};

test("exports non-secret profiles with automation disabled", () => {
  const exported = createProfileExport(
    [profile],
    "2026-02-01T00:00:00.000Z"
  );
  assert.equal(exported.profiles[0]?.automation?.enabled, false);
  assert.equal("id" in (exported.profiles[0] ?? {}), false);
});

test("imports valid profiles with fresh local identity", () => {
  const exported = createProfileExport([profile]);
  exported.profiles[0].automation!.enabled = true;
  const imported = parseProfileImport(
    exported,
    () => "new-id",
    "2026-03-01T00:00:00.000Z"
  );
  assert.equal(imported[0]?.id, "new-id");
  assert.equal(imported[0]?.name, "Production");
  assert.equal(imported[0]?.automation.enabled, false);
});

test("rejects unknown profile formats", () => {
  assert.throws(() => parseProfileImport({ profiles: [] }, () => "id"));
});

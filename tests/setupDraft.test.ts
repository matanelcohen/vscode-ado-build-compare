import assert from "node:assert/strict";
import test from "node:test";
import {
  createSetupDraft,
  draftToProfile,
  parseMentionUpns,
  suggestProfileName,
  validateSetupDraft,
} from "../src/models/setupDraft";
import type { PipelineProfile } from "../src/models/profile";

function completeDraft() {
  return {
    ...createSetupDraft(null),
    name: "Production",
    organizationUrl: "https://dev.azure.com/example/",
    projectName: "Product",
    repositoryId: "repository-id",
    repositoryName: "product-web",
    pipelineDefinitionId: 42,
    pipelineName: "product-web-ci",
    targetStageName: "Production",
    relevantPathFilter: " /src ",
  };
}

test("reports a validation error for every missing setup field", () => {
  const errors = validateSetupDraft(createSetupDraft(null));
  assert.deepEqual(Object.keys(errors).sort(), [
    "name",
    "organizationUrl",
    "pipelineDefinitionId",
    "projectName",
    "repositoryId",
    "targetStageName",
  ]);
});

test("rejects organization URLs that are not Azure DevOps", () => {
  const errors = validateSetupDraft({
    ...completeDraft(),
    organizationUrl: "https://example.com/ado",
  });
  assert.ok(errors.organizationUrl);
});

test("requires an automation interval of at least five minutes", () => {
  const errors = validateSetupDraft({
    ...completeDraft(),
    automationEnabled: true,
    automationIntervalMinutes: 2,
  });
  assert.ok(errors.automationIntervalMinutes);
  assert.equal(
    validateSetupDraft({
      ...completeDraft(),
      automationEnabled: true,
      automationIntervalMinutes: 5,
    }).automationIntervalMinutes,
    undefined
  );
});

test("converts a valid draft into a normalized profile", () => {
  const profile = draftToProfile(completeDraft(), {
    createId: () => "generated-id",
    now: "2026-08-02T10:00:00.000Z",
  });
  assert.equal(profile.id, "generated-id");
  assert.equal(profile.config.organizationUrl, "https://dev.azure.com/example");
  assert.equal(profile.config.relevantPathFilter, "/src");
  assert.equal(profile.createdAt, "2026-08-02T10:00:00.000Z");
  assert.equal(profile.automation?.enabled, false);
});

test("preserves identity and creation time when editing an existing profile", () => {
  const existing: PipelineProfile = {
    id: "existing-id",
    name: "Old name",
    config: {
      organizationUrl: "https://dev.azure.com/example",
      projectName: "Product",
      pipelineDefinitionId: 42,
      targetStageName: "Staging",
      repositoryId: "repository-id",
      relevantPathFilter: "",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const draft = createSetupDraft(existing);
  const profile = draftToProfile(
    { ...draft, targetStageName: "Production", name: "New name" },
    { existing, createId: () => "unused", now: "2026-08-02T10:00:00.000Z" }
  );
  assert.equal(profile.id, "existing-id");
  assert.equal(profile.createdAt, "2026-01-01T00:00:00.000Z");
  assert.equal(profile.updatedAt, "2026-08-02T10:00:00.000Z");
  assert.equal(profile.config.targetStageName, "Production");
  assert.equal(profile.name, "New name");
});

test("refuses to build a profile from an invalid draft", () => {
  assert.throws(() =>
    draftToProfile(
      { ...completeDraft(), targetStageName: " " },
      { createId: () => "generated-id" }
    )
  );
});

test("suggests a readable profile name and parses mention lists", () => {
  assert.equal(
    suggestProfileName(completeDraft()),
    "Product · product-web-ci · Production"
  );
  assert.deepEqual(parseMentionUpns(" a@b.com , , c@d.com "), [
    "a@b.com",
    "c@d.com",
  ]);
});

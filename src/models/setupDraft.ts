import type { AdcPipelineViewerConfig } from "../api-sdk";
import { isValidOrganizationUrl, PipelineProfile } from "./profile";

export interface SetupDraft {
  profileId: string | null;
  name: string;
  organizationUrl: string;
  projectName: string;
  repositoryId: string;
  repositoryName: string;
  pipelineDefinitionId: number | null;
  pipelineName: string;
  targetStageName: string;
  relevantPathFilter: string;
  automationEnabled: boolean;
  automationIntervalMinutes: number;
  automationMentionUpns: string;
}

export type SetupDraftErrors = Partial<Record<keyof SetupDraft, string>>;

export const defaultAutomationIntervalMinutes = 15;

export function createSetupDraft(
  profile?: PipelineProfile | null
): SetupDraft {
  if (!profile) {
    return {
      profileId: null,
      name: "",
      organizationUrl: "",
      projectName: "",
      repositoryId: "",
      repositoryName: "",
      pipelineDefinitionId: null,
      pipelineName: "",
      targetStageName: "",
      relevantPathFilter: "",
      automationEnabled: false,
      automationIntervalMinutes: defaultAutomationIntervalMinutes,
      automationMentionUpns: "",
    };
  }
  return {
    profileId: profile.id,
    name: profile.name,
    organizationUrl: profile.config.organizationUrl,
    projectName: profile.config.projectName,
    repositoryId: profile.config.repositoryId,
    repositoryName: profile.config.repositoryId,
    pipelineDefinitionId: profile.config.pipelineDefinitionId,
    pipelineName: "",
    targetStageName: profile.config.targetStageName,
    relevantPathFilter: profile.config.relevantPathFilter ?? "",
    automationEnabled: profile.automation?.enabled ?? false,
    automationIntervalMinutes:
      profile.automation?.intervalMinutes ?? defaultAutomationIntervalMinutes,
    automationMentionUpns: (profile.automation?.mentionUpns ?? []).join(", "),
  };
}

export function suggestProfileName(draft: SetupDraft): string {
  return [
    draft.projectName.trim(),
    draft.pipelineName.trim() ||
      (draft.pipelineDefinitionId
        ? `Pipeline ${draft.pipelineDefinitionId}`
        : ""),
    draft.targetStageName.trim(),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function validateSetupDraft(draft: SetupDraft): SetupDraftErrors {
  const errors: SetupDraftErrors = {};
  if (!isValidOrganizationUrl(draft.organizationUrl)) {
    errors.organizationUrl =
      "Use https://dev.azure.com/organization or https://organization.visualstudio.com.";
  }
  if (!draft.projectName.trim()) {
    errors.projectName = "Select an Azure DevOps project.";
  }
  if (!draft.repositoryId.trim()) {
    errors.repositoryId = "Select the repository built by this pipeline.";
  }
  if (
    !draft.pipelineDefinitionId ||
    !Number.isInteger(draft.pipelineDefinitionId) ||
    draft.pipelineDefinitionId <= 0
  ) {
    errors.pipelineDefinitionId = "Select a build or deployment pipeline.";
  }
  if (!draft.targetStageName.trim()) {
    errors.targetStageName = "Select or enter the deployment stage to track.";
  }
  if (!draft.name.trim()) {
    errors.name = "Enter a profile name.";
  }
  if (
    draft.automationEnabled &&
    (!Number.isInteger(draft.automationIntervalMinutes) ||
      draft.automationIntervalMinutes < 5)
  ) {
    errors.automationIntervalMinutes =
      "Enter a whole number of minutes of at least 5.";
  }
  return errors;
}

export function parseMentionUpns(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function draftToProfile(
  draft: SetupDraft,
  options: {
    existing?: PipelineProfile | null;
    createId: () => string;
    now?: string;
  }
): PipelineProfile {
  const errors = validateSetupDraft(draft);
  const firstError = Object.values(errors)[0];
  if (firstError) {
    throw new Error(firstError);
  }
  const timestamp = options.now ?? new Date().toISOString();
  const config: AdcPipelineViewerConfig = {
    organizationUrl: normalizeOrganizationUrlValue(draft.organizationUrl),
    projectName: draft.projectName.trim(),
    pipelineDefinitionId: draft.pipelineDefinitionId ?? 0,
    targetStageName: draft.targetStageName.trim(),
    repositoryId: draft.repositoryId.trim(),
    relevantPathFilter: draft.relevantPathFilter.trim(),
  };
  return {
    id: options.existing?.id ?? draft.profileId ?? options.createId(),
    name: draft.name.trim(),
    config,
    createdAt: options.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    automation: {
      enabled: draft.automationEnabled,
      intervalMinutes: draft.automationEnabled
        ? draft.automationIntervalMinutes
        : Math.max(5, draft.automationIntervalMinutes),
      mentionUpns: parseMentionUpns(draft.automationMentionUpns),
    },
  };
}

export function normalizeOrganizationUrlValue(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

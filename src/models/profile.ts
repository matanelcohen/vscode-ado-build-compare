import type { AdcPipelineViewerConfig } from "../api-sdk";

export interface PipelineProfile {
  id: string;
  name: string;
  config: AdcPipelineViewerConfig;
  createdAt: string;
  updatedAt: string;
  automation?: {
    enabled: boolean;
    intervalMinutes: number;
    mentionUpns: string[];
  };
}

export interface ProfileState {
  activeProfileId: string | null;
  profiles: PipelineProfile[];
}

export interface ProfileSnapshot {
  activeProfile: PipelineProfile | null;
  profiles: PipelineProfile[];
}

export function isValidOrganizationUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return false;
    }
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (url.hostname.toLocaleLowerCase() === "dev.azure.com") {
      return pathParts.length === 1;
    }
    return (
      /^[a-z0-9-]+\.visualstudio\.com$/i.test(url.hostname) &&
      pathParts.length === 0
    );
  } catch {
    return false;
  }
}

export function isValidPipelineConfig(
  value: unknown
): value is AdcPipelineViewerConfig {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AdcPipelineViewerConfig>;
  return (
    typeof candidate.organizationUrl === "string" &&
    isValidOrganizationUrl(candidate.organizationUrl) &&
    typeof candidate.projectName === "string" &&
    candidate.projectName.trim().length > 0 &&
    typeof candidate.pipelineDefinitionId === "number" &&
    Number.isInteger(candidate.pipelineDefinitionId) &&
    candidate.pipelineDefinitionId > 0 &&
    typeof candidate.targetStageName === "string" &&
    candidate.targetStageName.trim().length > 0 &&
    typeof candidate.repositoryId === "string" &&
    candidate.repositoryId.trim().length > 0
  );
}

export function normalizeProfileState(value: unknown): ProfileState {
  if (!value || typeof value !== "object") {
    return { activeProfileId: null, profiles: [] };
  }
  const candidate = value as Partial<ProfileState>;
  const profiles = Array.isArray(candidate.profiles)
    ? candidate.profiles.filter(isValidProfile)
    : [];
  const activeProfileId = profiles.some(
    (profile) => profile.id === candidate.activeProfileId
  )
    ? candidate.activeProfileId ?? null
    : profiles[0]?.id ?? null;
  return { activeProfileId, profiles };
}

export function upsertProfile(
  state: ProfileState,
  profile: PipelineProfile
): ProfileState {
  const profiles = state.profiles.filter((item) => item.id !== profile.id);
  profiles.push(profile);
  profiles.sort((left, right) => left.name.localeCompare(right.name));
  return { activeProfileId: profile.id, profiles };
}

function isValidProfile(value: unknown): value is PipelineProfile {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<PipelineProfile>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    isValidAutomation(candidate.automation) &&
    isValidPipelineConfig(candidate.config)
  );
}

function isValidAutomation(
  value: PipelineProfile["automation"] | unknown
): boolean {
  if (value === undefined) {
    return true;
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<
    NonNullable<PipelineProfile["automation"]>
  >;
  return (
    typeof candidate.enabled === "boolean" &&
    typeof candidate.intervalMinutes === "number" &&
    Number.isInteger(candidate.intervalMinutes) &&
    candidate.intervalMinutes >= 5 &&
    Array.isArray(candidate.mentionUpns) &&
    candidate.mentionUpns.every((upn) => typeof upn === "string")
  );
}

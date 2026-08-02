import {
  normalizeProfileState,
  PipelineProfile,
} from "../models/profile";

export interface ProfileExport {
  schemaVersion: 1;
  exportedAt: string;
  profiles: Array<
    Pick<PipelineProfile, "name" | "config"> & {
      automation?: PipelineProfile["automation"];
    }
  >;
}

export function createProfileExport(
  profiles: PipelineProfile[],
  exportedAt = new Date().toISOString()
): ProfileExport {
  return {
    schemaVersion: 1,
    exportedAt,
    profiles: profiles.map((profile) => ({
      name: profile.name,
      config: profile.config,
      ...(profile.automation
        ? {
            automation: {
              ...profile.automation,
              enabled: false,
            },
          }
        : {}),
    })),
  };
}

export function parseProfileImport(
  value: unknown,
  createId: () => string,
  now = new Date().toISOString()
): PipelineProfile[] {
  if (!value || typeof value !== "object") {
    throw new Error("The selected file is not a ReleaseLens profile export.");
  }
  const source = value as {
    schemaVersion?: unknown;
    profiles?: unknown;
  };
  if (source.schemaVersion !== 1 || !Array.isArray(source.profiles)) {
    throw new Error("Unsupported ReleaseLens profile file format.");
  }
  if (source.profiles.length === 0) {
    throw new Error("The profile file does not contain any profiles.");
  }
  const candidates = source.profiles.map((profile) => {
    if (!profile || typeof profile !== "object") {
      throw new Error("The profile file contains an invalid entry.");
    }
    const imported = profile as Record<string, unknown>;
    const automation =
      imported.automation && typeof imported.automation === "object"
        ? imported.automation
        : {};
    return {
      ...profile,
      automation: {
        ...automation,
        enabled: false,
      },
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
  });
  const normalized = normalizeProfileState({
    profiles: candidates,
    activeProfileId: candidates[0]?.id ?? null,
  });
  if (normalized.profiles.length !== candidates.length) {
    throw new Error(
      "The profile file contains invalid or unsupported entries."
    );
  }
  return normalized.profiles;
}

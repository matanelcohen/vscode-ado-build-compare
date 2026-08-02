import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import type { AdcPipelineViewerConfig } from "../api-sdk";
import {
  normalizeProfileState,
  PipelineProfile,
  ProfileSnapshot,
  ProfileState,
  upsertProfile,
} from "../models/profile";

const profileStateKey = "buildCompareTools.pipelineProfiles.v1";
const migrationStateKey = "buildCompareTools.pipelineProfiles.migrated";

export class ProfileStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async initialize(
    legacyConfig: AdcPipelineViewerConfig | null
  ): Promise<void> {
    if (this.context.workspaceState.get<boolean>(migrationStateKey)) {
      return;
    }
    if (legacyConfig) {
      const existing = this.read().profiles.find(
        (profile) =>
          JSON.stringify(profile.config) === JSON.stringify(legacyConfig)
      );
      if (existing) {
        await this.context.workspaceState.update(migrationStateKey, true);
        return;
      }
      const now = new Date().toISOString();
      const activate = !this.getSnapshot().activeProfile;
      await this.upsert(
        {
          id: randomUUID(),
          name: `Legacy · ${legacyConfig.projectName} · ${legacyConfig.targetStageName}`,
          config: legacyConfig,
          createdAt: now,
          updatedAt: now,
        },
        activate
      );
    }
    await this.context.workspaceState.update(migrationStateKey, true);
  }

  getSnapshot(): ProfileSnapshot {
    const state = this.read();
    return {
      activeProfile:
        state.profiles.find(
          (profile) => profile.id === state.activeProfileId
        ) ?? null,
      profiles: state.profiles,
    };
  }

  getProfile(profileId: string): PipelineProfile | null {
    return (
      this.read().profiles.find((profile) => profile.id === profileId) ?? null
    );
  }

  async upsert(
    profile: PipelineProfile,
    activate = true
  ): Promise<void> {
    const current = this.read();
    const next = upsertProfile(current, profile);
    await this.save({
      ...next,
      activeProfileId: activate
        ? profile.id
        : current.activeProfileId ?? profile.id,
    });
  }

  async setActive(profileId: string): Promise<void> {
    const state = this.read();
    if (!state.profiles.some((profile) => profile.id === profileId)) {
      throw new Error("The selected pipeline profile no longer exists.");
    }
    await this.save({ ...state, activeProfileId: profileId });
  }

  async delete(profileId: string): Promise<void> {
    const state = this.read();
    const profiles = state.profiles.filter(
      (profile) => profile.id !== profileId
    );
    await this.save({
      profiles,
      activeProfileId:
        state.activeProfileId === profileId
          ? profiles[0]?.id ?? null
          : state.activeProfileId,
    });
  }

  private read(): ProfileState {
    return normalizeProfileState(
      this.context.globalState.get<unknown>(profileStateKey)
    );
  }

  private async save(state: ProfileState): Promise<void> {
    await this.context.globalState.update(profileStateKey, state);
  }
}

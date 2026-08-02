import * as vscode from "vscode";
import { PipelineProfile } from "../models/profile";
import { ProfileStore } from "./ProfileStore";

interface ProfileQuickPickItem extends vscode.QuickPickItem {
  profile: PipelineProfile;
}

export async function pickActiveProfile(
  store: ProfileStore,
  onNoProfiles?: () => Promise<PipelineProfile | null>
): Promise<PipelineProfile | null> {
  const snapshot = store.getSnapshot();
  if (snapshot.profiles.length === 0) {
    return onNoProfiles ? onNoProfiles() : null;
  }
  const items: ProfileQuickPickItem[] = snapshot.profiles.map((profile) => ({
      label: profile.name,
      ...(profile.id === snapshot.activeProfile?.id
        ? { description: "Active" }
        : {}),
      detail: `${profile.config.projectName} · Pipeline ${profile.config.pipelineDefinitionId} · ${profile.config.targetStageName}`,
      profile,
    }));
  const picked = await vscode.window.showQuickPick<ProfileQuickPickItem>(
    items,
    {
      title: "Switch pipeline profile",
      placeHolder: "Choose the pipeline and environment to compare",
      ignoreFocusOut: true,
    }
  );
  if (!picked) {
    return null;
  }
  await store.setActive(picked.profile.id);
  return picked.profile;
}

export async function deletePipelineProfile(
  store: ProfileStore
): Promise<void> {
  const snapshot = store.getSnapshot();
  if (snapshot.profiles.length === 0) {
    vscode.window.showInformationMessage("There are no pipeline profiles.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    snapshot.profiles.map((profile) => ({
      label: profile.name,
      detail: `${profile.config.projectName} · ${profile.config.targetStageName}`,
      profile,
    })),
    {
      title: "Delete pipeline profile",
      placeHolder: "Select a profile to delete",
      ignoreFocusOut: true,
    }
  );
  if (!picked) {
    return;
  }
  const confirmed = await vscode.window.showWarningMessage(
    `Delete pipeline profile "${picked.profile.name}"?`,
    { modal: true },
    "Delete"
  );
  if (confirmed === "Delete") {
    await store.delete(picked.profile.id);
  }
}

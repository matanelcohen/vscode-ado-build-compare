import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import { PipelineProfile } from "../models/profile";
import {
  createSetupDraft,
  draftToProfile,
  SetupDraft,
} from "../models/setupDraft";
import {
  createDiscoveryConnection,
  listPipelines,
  listProjects,
  listRepositories,
  listStageNames,
} from "./AdoDiscoveryService";
import { ProfileStore } from "./ProfileStore";
import { getWebviewContent } from "./webviewHtml";

export interface SetupPanelOptions {
  /** Profile to edit. When omitted a new profile is created. */
  profileId?: string | null;
  /** Focus the profile list instead of a single profile. */
  mode?: "create" | "edit";
}

interface SetupPanelState {
  panel: vscode.WebviewPanel;
  savedProfile: PipelineProfile | null;
  resolvers: ((profile: PipelineProfile | null) => void)[];
}

let activeSetup: SetupPanelState | undefined;

export function openSetupPanel(
  context: vscode.ExtensionContext,
  store: ProfileStore,
  options: SetupPanelOptions = {},
  onProfilesChanged?: () => Promise<void> | void
): Promise<PipelineProfile | null> {
  if (activeSetup) {
    activeSetup.panel.reveal(vscode.ViewColumn.Active);
    activeSetup.panel.webview.postMessage({
      command: "setup:reset",
      payload: buildInitPayload(store, options),
    });
    return new Promise((resolve) => {
      activeSetup?.resolvers.push(resolve);
    });
  }

  const panel = vscode.window.createWebviewPanel(
    "releaseLensSetup",
    options.mode === "edit"
      ? "ReleaseLens · Edit Pipeline Profile"
      : "ReleaseLens · Guided Setup",
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "out")],
      retainContextWhenHidden: true,
    }
  );
  panel.webview.html = getWebviewContent(
    panel.webview,
    context.extensionUri,
    "setup"
  );

  const state: SetupPanelState = { panel, savedProfile: null, resolvers: [] };
  activeSetup = state;

  const disposables: vscode.Disposable[] = [];
  disposables.push(
    vscode.window.onDidChangeActiveColorTheme((theme) => {
      panel.webview.postMessage({
        command: "themeChanged",
        theme: `vscode-${vscode.ColorThemeKind[theme.kind].toLowerCase()}`,
      });
    })
  );

  panel.webview.onDidReceiveMessage(
    async (message) => {
      const respond = (result: unknown, error?: string) => {
        panel.webview.postMessage({
          command: `${message.command}Response`,
          requestId: message.requestId,
          ...(error ? { error } : { result }),
        });
      };
      try {
        switch (message.command) {
          case "setup:init": {
            respond(buildInitPayload(store, options));
            return;
          }
          case "getTheme": {
            panel.webview.postMessage({
              command: "themeChanged",
              theme: `vscode-${vscode.ColorThemeKind[
                vscode.window.activeColorTheme.kind
              ].toLowerCase()}`,
            });
            return;
          }
          case "setup:listProjects": {
            const connection = await createDiscoveryConnection(
              message.organizationUrl
            );
            respond(await listProjects(connection));
            return;
          }
          case "setup:listRepositories": {
            const connection = await createDiscoveryConnection(
              message.organizationUrl
            );
            respond(await listRepositories(connection, message.project));
            return;
          }
          case "setup:listPipelines": {
            const connection = await createDiscoveryConnection(
              message.organizationUrl
            );
            respond(
              await listPipelines(
                connection,
                message.project,
                message.repositoryId
              )
            );
            return;
          }
          case "setup:listStages": {
            const connection = await createDiscoveryConnection(
              message.organizationUrl
            );
            respond(
              await listStageNames(
                connection,
                message.project,
                Number(message.definitionId)
              )
            );
            return;
          }
          case "setup:save": {
            const draft = message.draft as SetupDraft;
            const existing = draft.profileId
              ? store.getProfile(draft.profileId)
              : null;
            const profile = draftToProfile(draft, {
              existing,
              createId: () => randomUUID(),
            });
            await store.upsert(
              profile,
              message.activate ?? (existing === null)
            );
            state.savedProfile = profile;
            await onProfilesChanged?.();
            respond({
              profile,
              snapshot: store.getSnapshot(),
            });
            return;
          }
          case "setup:delete": {
            const profile = store.getProfile(message.profileId);
            if (!profile) {
              throw new Error("The selected pipeline profile no longer exists.");
            }
            const confirmed = await vscode.window.showWarningMessage(
              `Delete pipeline profile "${profile.name}"?`,
              { modal: true },
              "Delete"
            );
            if (confirmed !== "Delete") {
              respond({ deleted: false, snapshot: store.getSnapshot() });
              return;
            }
            await store.delete(profile.id);
            await onProfilesChanged?.();
            respond({ deleted: true, snapshot: store.getSnapshot() });
            return;
          }
          case "setup:activate": {
            await store.setActive(message.profileId);
            await onProfilesChanged?.();
            respond({ snapshot: store.getSnapshot() });
            return;
          }
          case "setup:close": {
            panel.dispose();
            return;
          }
        }
      } catch (error: unknown) {
        respond(
          null,
          error instanceof Error ? error.message : String(error)
        );
      }
    },
    undefined,
    disposables
  );

  panel.onDidDispose(
    () => {
      activeSetup = undefined;
      while (disposables.length) {
        disposables.pop()?.dispose();
      }
      for (const resolve of state.resolvers) {
        resolve(state.savedProfile);
      }
      state.resolvers.length = 0;
    },
    null,
    context.subscriptions
  );

  return new Promise((resolve) => {
    state.resolvers.push(resolve);
  });
}

function buildInitPayload(store: ProfileStore, options: SetupPanelOptions) {
  const snapshot = store.getSnapshot();
  const profileId =
    options.profileId ??
    (options.mode === "edit" ? snapshot.activeProfile?.id ?? null : null);
  const profile = profileId ? store.getProfile(profileId) : null;
  return {
    draft: createSetupDraft(profile),
    profiles: snapshot.profiles,
    activeProfileId: snapshot.activeProfile?.id ?? null,
    mode: options.mode ?? (profile ? "edit" : "create"),
  };
}

import * as vscode from "vscode";
import axios from "axios";
import { randomUUID } from "node:crypto";
import { AdcPipelineViewerConfig } from "./api-sdk";
import { AdoService } from "./services/AdoService";
import { TeamsShareRequest } from "./models/comparison";
import { buildTeamsWorkflowPayload } from "./teams/adaptiveCard";
import { ProfileStore } from "./services/ProfileStore";
import {
  deletePipelineProfile,
  pickActiveProfile,
} from "./services/OnboardingService";
import { openSetupPanel, SetupPanelOptions } from "./services/SetupPanel";
import { getWebviewContent } from "./services/webviewHtml";
import { ComparisonHistoryStore } from "./services/ComparisonHistoryStore";
import {
  ExportFormat,
  formatComparisonExport,
} from "./utils/exportFormatting";
import {
  buildAiSummaryPrompt,
  generateDeterministicSummary,
} from "./utils/riskAnalysis";
import { DashboardTreeProvider } from "./services/DashboardTreeProvider";
import { createDemoComparison } from "./demo/demoComparison";
import {
  createProfileExport,
  parseProfileImport,
} from "./utils/profileTransfer";

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let webviewReady = false;
let pendingComparison: unknown;
const teamsWebhookSecretKey = "buildCompareTools.teamsWorkflowWebhook";
const teamsDestinationStateKey = "buildCompareTools.teamsDestinationName";
const automationStateKey = "buildCompareTools.automationState.v1";
const walkthroughShownStateKey = "releaselens.walkthroughShown.v1";

function getLegacyExtensionConfig(): AdcPipelineViewerConfig | null {
  const config = vscode.workspace.getConfiguration("buildCompareTools");
  const organizationUrl = config.get<string>("organizationUrl");
  const projectName = config.get<string>("projectName");
  const pipelineDefinitionId = config.get<number>("pipelineDefinitionId");
  const targetStageName = config.get<string>("targetStageName");
  const repositoryId = config.get<string>("repositoryId");
  const relevantPathFilter = config.get<string>("relevantPathFilter");

  if (
    !organizationUrl ||
    !projectName ||
    !pipelineDefinitionId ||
    !targetStageName ||
    !repositoryId
  ) {
    return null;
  }

  return {
    organizationUrl,
    projectName,
    pipelineDefinitionId,
    targetStageName,
    repositoryId,
    relevantPathFilter: relevantPathFilter ?? "",
  };
}

async function createAdoService(
  store: ProfileStore,
  profileId: string
): Promise<AdoService> {
  const profile = store.getProfile(profileId);
  if (!profile) {
    throw new Error("The requested pipeline profile no longer exists.");
  }
  const session = await vscode.authentication.getSession(
    "microsoft",
    ["499b84ac-1321-427f-aa17-267ca6975798/.default"],
    { createIfNone: true }
  );
  if (!session.accessToken) {
    throw new Error("Microsoft authentication did not return an access token.");
  }
  return new AdoService(
    profile.config.organizationUrl,
    session.accessToken,
    profile.config
  );
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

async function getTeamsConfiguration(
  context: vscode.ExtensionContext
): Promise<{ configured: boolean; destinationName?: string }> {
  const webhook = await context.secrets.get(teamsWebhookSecretKey);
  const destinationName = context.globalState.get<string>(
    teamsDestinationStateKey
  );
  return {
    configured: Boolean(webhook),
    ...(destinationName ? { destinationName } : {}),
  };
}

async function configureTeamsWebhook(
  context: vscode.ExtensionContext
): Promise<{ configured: boolean; destinationName?: string }> {
  const webhookUrl = await vscode.window.showInputBox({
    title: "Configure Teams Workflow",
    prompt:
      "Paste the URL from the Teams 'When a Teams webhook request is received' workflow trigger.",
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) =>
      isHttpsUrl(value.trim()) ? undefined : "Enter a valid HTTPS URL.",
  });
  if (!webhookUrl) {
    return getTeamsConfiguration(context);
  }

  const destinationName = await vscode.window.showInputBox({
    title: "Name this Teams destination",
    prompt: "Use a friendly channel or workflow name.",
    value:
      context.globalState.get<string>(teamsDestinationStateKey) ??
      "Release updates",
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "Enter a destination name.",
  });
  if (!destinationName) {
    return getTeamsConfiguration(context);
  }

  await context.secrets.store(teamsWebhookSecretKey, webhookUrl.trim());
  await context.globalState.update(
    teamsDestinationStateKey,
    destinationName.trim()
  );
  return { configured: true, destinationName: destinationName.trim() };
}

async function sendTeamsWorkflow(
  context: vscode.ExtensionContext,
  request: TeamsShareRequest
): Promise<void> {
  const webhook = await context.secrets.get(teamsWebhookSecretKey);
  if (!webhook) {
    throw new Error("Configure a Teams Workflow before sending.");
  }
  await axios.post(webhook, buildTeamsWorkflowPayload(request), {
    timeout: 30000,
    maxBodyLength: 28000,
    headers: { "Content-Type": "application/json" },
    validateStatus: (status) => status >= 200 && status < 300,
  });
}

export function activate(context: vscode.ExtensionContext) {
  const profileStore = new ProfileStore(context);
  const comparisonHistory = new ComparisonHistoryStore(context);
  const profileInitialization = profileStore.initialize(
    getLegacyExtensionConfig()
  );
  const dashboardProvider = new DashboardTreeProvider(
    profileStore,
    comparisonHistory,
    async () =>
      Boolean(await context.secrets.get(teamsWebhookSecretKey))
  );
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.command = "fe-ninja-tools.showPipelines";
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "build-compare-view",
      dashboardProvider
    ),
    statusBar
  );
  const refreshChrome = async () => {
    await profileInitialization;
    const snapshot = profileStore.getSnapshot();
    await vscode.commands.executeCommand(
      "setContext",
      "buildCompareTools.hasProfile",
      Boolean(snapshot.activeProfile)
    );
    await vscode.commands.executeCommand(
      "setContext",
      "buildCompareTools.hasMultipleProfiles",
      snapshot.profiles.length > 1
    );
    if (snapshot.activeProfile) {
      statusBar.text = `$(compare-changes) ${snapshot.activeProfile.name}`;
      statusBar.tooltip = `Release Lens · ${snapshot.activeProfile.config.targetStageName}`;
      statusBar.show();
    } else {
      statusBar.hide();
    }
    dashboardProvider.refresh();
  };
  const openSetup = (options: SetupPanelOptions = {}) =>
    openSetupPanel(context, profileStore, options, async () => {
      currentPanel?.webview.postMessage({ command: "profilesChanged" });
      await refreshChrome();
    });
  void refreshChrome();
  void profileInitialization.then(async () => {
    if (
      !context.globalState.get<boolean>(walkthroughShownStateKey) &&
      !profileStore.getSnapshot().activeProfile
    ) {
      await context.globalState.update(walkthroughShownStateKey, true);
      await vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "matancohenmsft.fe-ninja-tools#releaselens.getStarted",
        false
      );
    }
  });
  let automationRunning = false;
  const runAutomations = async () => {
    if (automationRunning) {
      return;
    }
    automationRunning = true;
    try {
      await profileInitialization;
      const checkpoints =
        context.globalState.get<
          Record<string, { checkedAt: number; targetBuildId?: number }>
        >(automationStateKey) ?? {};
      for (const profile of profileStore.getSnapshot().profiles) {
        const automation = profile.automation;
        if (
          !automation?.enabled ||
          !Number.isInteger(automation.intervalMinutes) ||
          automation.intervalMinutes < 5
        ) {
          continue;
        }
        const checkpoint = checkpoints[profile.id];
        const due =
          !checkpoint ||
          Date.now() - checkpoint.checkedAt >=
            automation.intervalMinutes * 60_000;
        if (!due) {
          continue;
        }
        checkpoints[profile.id] = {
          checkedAt: Date.now(),
          ...(checkpoint?.targetBuildId
            ? { targetBuildId: checkpoint.targetBuildId }
            : {}),
        };
        await context.globalState.update(automationStateKey, checkpoints);
        try {
          const service = await createAdoService(profileStore, profile.id);
          const base = await service.findLatestDeployedRun();
          if (!base?.finishTime) {
            continue;
          }
          const builds = await service.fetchLastNBuilds(20);
          const baseTime = new Date(base.finishTime).getTime();
          const target = builds
            .filter((build) => {
              const time = build.finishTime ?? build.startTime;
              return (
                build.id !== base.id &&
                Boolean(build.sourceVersion) &&
                Boolean(time) &&
                build.status === "2" &&
                build.result === "2" &&
                new Date(time ?? 0).getTime() > baseTime
              );
            })
            .sort(
              (left, right) =>
                new Date(right.finishTime ?? right.startTime ?? 0).getTime() -
                new Date(left.finishTime ?? left.startTime ?? 0).getTime()
            )[0];
          if (!target || target.id === checkpoint?.targetBuildId) {
            continue;
          }
          const result = await service.fetchCommitRangeData(base, target);
          const summary = generateDeterministicSummary(result);
          await sendTeamsWorkflow(context, {
            title: `${profile.name}: build ${target.buildNumber}`,
            comparison: result,
            summary,
            mentions: automation.mentionUpns.map((upn) => ({
              displayName: upn.split("@")[0] ?? upn,
              userId: upn,
            })),
          });
          await comparisonHistory.add(profile.id, result);
          checkpoints[profile.id] = {
            checkedAt: Date.now(),
            targetBuildId: target.id,
          };
          await context.globalState.update(automationStateKey, checkpoints);
        } catch (error: unknown) {
          vscode.window.setStatusBarMessage(
            `Build Compare automation failed for ${profile.name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            10000
          );
        }
      }
      await context.globalState.update(automationStateKey, checkpoints);
    } finally {
      automationRunning = false;
    }
  };
  const initialAutomationTimer = setTimeout(() => {
    void runAutomations();
  }, 15000);
  const automationTimer = setInterval(() => {
    void runAutomations();
  }, 60000);
  context.subscriptions.push({
    dispose: () => {
      clearTimeout(initialAutomationTimer);
      clearInterval(automationTimer);
    },
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "fe-ninja-tools.setupProfile",
      async () => {
        await profileInitialization;
        const profile = await openSetup({ mode: "create" });
        if (profile) {
          vscode.window.showInformationMessage(
            `Pipeline profile "${profile.name}" is ready.`
          );
        }
      }
    ),
    vscode.commands.registerCommand(
      "fe-ninja-tools.switchProfile",
      async () => {
        await profileInitialization;
        const profile = await pickActiveProfile(profileStore, () =>
          openSetup({ mode: "create" })
        );
        if (profile) {
          currentPanel?.webview.postMessage({ command: "profilesChanged" });
          await refreshChrome();
        }
      }
    ),
    vscode.commands.registerCommand(
      "fe-ninja-tools.deleteProfile",
      async () => {
        await profileInitialization;
        const before = new Set(
          profileStore.getSnapshot().profiles.map((profile) => profile.id)
        );
        await deletePipelineProfile(profileStore);
        const after = new Set(
          profileStore.getSnapshot().profiles.map((profile) => profile.id)
        );
        for (const profileId of before) {
          if (!after.has(profileId)) {
            await comparisonHistory.clear(profileId);
          }
        }
        currentPanel?.webview.postMessage({ command: "profilesChanged" });
        await refreshChrome();
      }
    ),
    vscode.commands.registerCommand(
      "fe-ninja-tools.editProfile",
      async () => {
        await profileInitialization;
        await openSetup({ mode: "edit" });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("fe-ninja-tools.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "buildCompareTools"
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "fe-ninja-tools.configureTeams",
      async () => {
        const result = await configureTeamsWebhook(context);
        if (result.configured) {
          await refreshChrome();
          vscode.window.showInformationMessage(
            `Teams destination "${result.destinationName ?? "configured workflow"}" is ready.`
          );

        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("fe-ninja-tools.refresh", async () => {
      currentPanel?.webview.postMessage({ command: "profilesChanged" });
      await refreshChrome();
    }),
    vscode.commands.registerCommand(
      "fe-ninja-tools.openHistoryEntry",
      async (result) => {
        pendingComparison = result;
        await vscode.commands.executeCommand("fe-ninja-tools.showPipelines");
        if (webviewReady) {
          currentPanel?.webview.postMessage({
            command: "loadComparison",
            result: pendingComparison,
          });
          pendingComparison = undefined;
        }
      }
    ),
    vscode.commands.registerCommand("fe-ninja-tools.openDemo", async () => {
      pendingComparison = createDemoComparison();
      await vscode.commands.executeCommand("fe-ninja-tools.showPipelines");
      if (webviewReady) {
        currentPanel?.webview.postMessage({
          command: "loadComparison",
          result: pendingComparison,
        });
        pendingComparison = undefined;
      }
    }),
    vscode.commands.registerCommand("fe-ninja-tools.sendFeedback", async () => {
      const url = vscode.Uri.parse(
        "https://github.com/matanelcohen/vscode-ado-build-compare/issues/new?template=feedback.yml&title=%5BFeedback%5D%20"
      );
      await vscode.env.openExternal(url);
    }),
    vscode.commands.registerCommand("fe-ninja-tools.openPrivacy", async () => {
      await vscode.env.openExternal(
        vscode.Uri.parse(
          "https://github.com/matanelcohen/vscode-ado-build-compare/blob/main/PRIVACY.md"
        )
      );
    }),
    vscode.commands.registerCommand(
      "fe-ninja-tools.copyDiagnostics",
      async () => {
        const snapshot = profileStore.getSnapshot();
        const diagnostics = {
          product: "Release Lens for Azure DevOps",
          extensionVersion:
            vscode.extensions.getExtension(
              "matancohenmsft.fe-ninja-tools"
            )?.packageJSON.version ?? "development",
          vscodeVersion: vscode.version,
          platform: process.platform,
          architecture: process.arch,
          profileCount: snapshot.profiles.length,
          hasActiveProfile: Boolean(snapshot.activeProfile),
          teamsConfigured: Boolean(
            await context.secrets.get(teamsWebhookSecretKey)
          ),
        };
        await vscode.env.clipboard.writeText(
          JSON.stringify(diagnostics, null, 2)
        );
        vscode.window.showInformationMessage(
          "Safe Release Lens diagnostics copied."
        );
      }
    ),
    vscode.commands.registerCommand(
      "fe-ninja-tools.manageProfiles",
      async () => {
        const choice = await vscode.window.showQuickPick(
          [
            {
              label: "$(export) Export profiles",
              description: "Share non-secret pipeline setup with your team",
              action: "export",
            },
            {
              label: "$(import) Import profiles",
              description: "Add profiles from a Release Lens JSON file",
              action: "import",
            },
          ],
          {
            title: "Share Release Lens team setup",
            placeHolder: "Choose an action",
          }
        );
        if (!choice) {
          return;
        }
        if (choice.action === "export") {
          const snapshot = profileStore.getSnapshot();
          if (snapshot.profiles.length === 0) {
            vscode.window.showInformationMessage(
              "Create a pipeline profile before exporting."
            );
            return;
          }
          const target = await vscode.window.showSaveDialog({
            title: "Export Release Lens profiles",
            defaultUri: vscode.Uri.file("releaselens-profiles.json"),
            filters: { JSON: ["json"] },
          });
          if (target) {
            await vscode.workspace.fs.writeFile(
              target,
              new TextEncoder().encode(
                JSON.stringify(createProfileExport(snapshot.profiles), null, 2)
              )
            );
          }
          return;
        }

        const sources = await vscode.window.showOpenDialog({
          title: "Import Release Lens profiles",
          canSelectMany: false,
          filters: { JSON: ["json"] },
        });
        const source = sources?.[0];
        if (!source) {
          return;
        }
        const parsed: unknown = JSON.parse(
          new TextDecoder().decode(await vscode.workspace.fs.readFile(source))
        );
        const imported = parseProfileImport(parsed, randomUUID);
        for (const profile of imported) {
          await profileStore.upsert(profile, false);
        }
        if (imported[0]) {
          await profileStore.setActive(imported[0].id);
        }
        await refreshChrome();
        currentPanel?.webview.postMessage({ command: "profilesChanged" });
        vscode.window.showInformationMessage(
          `Imported ${imported.length} Release Lens profile${
            imported.length === 1 ? "" : "s"
          }.`
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("fe-ninja-tools.showPipelines", () => {
      const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        currentPanel.reveal(column);
        return;
      }

      currentPanel = vscode.window.createWebviewPanel(
        "gaiaToolsReport",
        "Release Lens · Release Intelligence",
        column || vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "out"),
          ],
          retainContextWhenHidden: true,
        }
      );
      webviewReady = false;

      currentPanel.webview.html = getWebviewContent(
        currentPanel.webview,
        context.extensionUri
      );

      const panelDisposables: vscode.Disposable[] = [];

      const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(
        (theme) => {
          currentPanel?.webview.postMessage({
            command: "themeChanged",
            theme: `vscode-${vscode.ColorThemeKind[theme.kind].toLowerCase()}`,
          });
        }
      );
      panelDisposables.push(themeChangeListener);
      currentPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "webviewReady": {
              webviewReady = true;
              if (pendingComparison) {
                currentPanel?.webview.postMessage({
                  command: "loadComparison",
                  result: pendingComparison,
                });
                pendingComparison = undefined;
              }
              return;
            }
            case "openSettings": {
              await vscode.commands.executeCommand(
                "workbench.action.openSettings",
                "buildCompareTools"
              );
              return;
            }
            case "getAuthAndConfig": {
              try {
                await profileInitialization;
                const snapshot = profileStore.getSnapshot();

                const session = await vscode.authentication.getSession(
                  "microsoft",
                  ["499b84ac-1321-427f-aa17-267ca6975798/.default"],
                  { createIfNone: false }
                );

                currentPanel?.webview.postMessage({
                  command: "authAndConfigResponse",
                  authenticated: Boolean(session?.accessToken),
                  config: snapshot.activeProfile?.config ?? null,
                  profile: snapshot.activeProfile,
                  profiles: snapshot.profiles,
                  needsOnboarding: !snapshot.activeProfile,
                });
              } catch (error) {
                vscode.window.showErrorMessage(
                  "Failed to get authentication token."
                );
                currentPanel?.webview.postMessage({
                  command: "authAndConfigResponse",
                  config: null,
                  error: "Failed to get token",
                });
              }
              return;
            }
            case "runSmartOnboarding": {
                try {
                  await profileInitialization;
                  await openSetup({ mode: "create" });
                  currentPanel?.webview.postMessage({
                    command: "runSmartOnboardingResponse",
                    requestId: message.requestId,
                    result: profileStore.getSnapshot(),
                  });
                  await refreshChrome();
                } catch (error: any) {
                  currentPanel?.webview.postMessage({
                    command: "runSmartOnboardingResponse",
                    requestId: message.requestId,
                    error: error.message || "Could not complete setup.",
                  });
                }
                return;
            }
            case "switchPipelineProfile": {
                try {
                  await profileInitialization;
                  await pickActiveProfile(profileStore, () =>
                    openSetup({ mode: "create" })
                  );
                  currentPanel?.webview.postMessage({
                    command: "switchPipelineProfileResponse",
                    requestId: message.requestId,
                    result: profileStore.getSnapshot(),
                  });
                  await refreshChrome();
                } catch (error: any) {
                  currentPanel?.webview.postMessage({
                    command: "switchPipelineProfileResponse",
                    requestId: message.requestId,
                    error: error.message || "Could not switch profiles.",
                  });
                }
                return;
            }
            case "deletePipelineProfile": {
                try {
                  await profileInitialization;
                  const before = new Set(
                    profileStore
                      .getSnapshot()
                      .profiles.map((profile) => profile.id)
                  );
                  await deletePipelineProfile(profileStore);
                  const after = new Set(
                    profileStore
                      .getSnapshot()
                      .profiles.map((profile) => profile.id)
                  );
                  for (const profileId of before) {
                    if (!after.has(profileId)) {
                      await comparisonHistory.clear(profileId);
                    }
                  }
                  currentPanel?.webview.postMessage({
                    command: "deletePipelineProfileResponse",
                    requestId: message.requestId,
                    result: profileStore.getSnapshot(),
                  });
                  await refreshChrome();
                } catch (error: any) {
                  currentPanel?.webview.postMessage({
                    command: "deletePipelineProfileResponse",
                    requestId: message.requestId,
                    error: error.message || "Could not delete the profile.",
                  });
              }
              return;
            }
            case "editPipelineProfile": {
              try {
                await profileInitialization;
                await openSetup({
                  mode: "edit",
                  ...(message.profileId
                    ? { profileId: message.profileId as string }
                    : {}),
                });
                currentPanel?.webview.postMessage({
                  command: "editPipelineProfileResponse",
                  requestId: message.requestId,
                  result: profileStore.getSnapshot(),
                });
                await refreshChrome();
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "editPipelineProfileResponse",
                  requestId: message.requestId,
                  error: error.message || "Could not edit the profile.",
                });
              }
              return;
            }
            case "getTheme": {
              const currentTheme = vscode.window.activeColorTheme;
              currentPanel?.webview.postMessage({
                command: "themeChanged",
                theme: `vscode-${vscode.ColorThemeKind[
                  currentTheme.kind
                ].toLowerCase()}`,
              });
              return;
            }
            case "findLatestDeployedRun": {
              try {
                const adoService = await createAdoService(
                  profileStore,
                  message.profileId
                );
                const result = await adoService.findLatestDeployedRun();
                currentPanel?.webview.postMessage({
                  command: "findLatestDeployedRunResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "findLatestDeployedRunResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "fetchLastNBuilds": {
              try {
                const { count } = message;
                const adoService = await createAdoService(
                  profileStore,
                  message.profileId
                );
                const result = await adoService.fetchLastNBuilds(count);
                currentPanel?.webview.postMessage({
                  command: "fetchLastNBuildsResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "fetchLastNBuildsResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "fetchCommitRangeData": {
              try {
                const { olderRun, selectedBuild } = message;
                const adoService = await createAdoService(
                  profileStore,
                  message.profileId
                );
                const result = await adoService.fetchCommitRangeData(
                  olderRun,
                  selectedBuild
                );
                await comparisonHistory.add(message.profileId, result);
                dashboardProvider.refresh();
                currentPanel?.webview.postMessage({
                  command: "fetchCommitRangeDataResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "fetchCommitRangeDataResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "getComparisonHistory": {
              currentPanel?.webview.postMessage({
                command: "getComparisonHistoryResponse",
                requestId: message.requestId,
                result: comparisonHistory.get(message.profileId),
              });
              return;
            }
            case "getGitReferences": {
              try {
                const adoService = await createAdoService(
                  profileStore,
                  message.profileId
                );
                currentPanel?.webview.postMessage({
                  command: "getGitReferencesResponse",
                  requestId: message.requestId,
                  result: await adoService.getGitReferences(),
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "getGitReferencesResponse",
                  requestId: message.requestId,
                  error: error.message || "Could not load Git references.",
                });
              }
              return;
            }
            case "compareGitReferences": {
              try {
                const adoService = await createAdoService(
                  profileStore,
                  message.profileId
                );
                const baseRun = {
                  id: -1,
                  buildNumber: `${message.base.kind}: ${message.base.displayName}`,
                  sourceVersion: message.base.commitId,
                };
                const targetRun = {
                  id: -2,
                  buildNumber: `${message.target.kind}: ${message.target.displayName}`,
                  sourceVersion: message.target.commitId,
                };
                const result = await adoService.fetchCommitRangeData(
                  baseRun,
                  targetRun
                );
                await comparisonHistory.add(message.profileId, result);
                dashboardProvider.refresh();
                currentPanel?.webview.postMessage({
                  command: "compareGitReferencesResponse",
                  requestId: message.requestId,
                  result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "compareGitReferencesResponse",
                  requestId: message.requestId,
                  error: error.message || "Could not compare Git references.",
                });
              }
              return;
            }
            case "compareProfileEnvironments": {
              try {
                const baseProfile = profileStore.getProfile(
                  message.baseProfileId
                );
                const targetProfile = profileStore.getProfile(
                  message.targetProfileId
                );
                if (!baseProfile || !targetProfile) {
                  throw new Error("One of the selected profiles no longer exists.");
                }
                const baseConfig = baseProfile.config;
                const targetConfig = targetProfile.config;
                if (
                  baseConfig.organizationUrl !== targetConfig.organizationUrl ||
                  baseConfig.projectName !== targetConfig.projectName ||
                  baseConfig.repositoryId !== targetConfig.repositoryId
                ) {
                  throw new Error(
                    "Environment drift requires profiles for the same organization, project, and repository."
                  );
                }
                const [baseService, targetService] = await Promise.all([
                  createAdoService(profileStore, baseProfile.id),
                  createAdoService(profileStore, targetProfile.id),
                ]);
                const [baseRun, targetRun] = await Promise.all([
                  baseService.findLatestDeployedRun(),
                  targetService.findLatestDeployedRun(),
                ]);
                if (!baseRun || !targetRun) {
                  throw new Error(
                    "A successful deployment was not found for both environments."
                  );
                }
                const result = await targetService.fetchCommitRangeData(
                  baseRun,
                  targetRun
                );
                await comparisonHistory.add(targetProfile.id, result);
                dashboardProvider.refresh();
                currentPanel?.webview.postMessage({
                  command: "compareProfileEnvironmentsResponse",
                  requestId: message.requestId,
                  result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "compareProfileEnvironmentsResponse",
                  requestId: message.requestId,
                  error:
                    error.message || "Could not compare profile environments.",
                });
              }
              return;
            }
            case "clearComparisonHistory": {
              await comparisonHistory.clear(message.profileId);
              dashboardProvider.refresh();
              currentPanel?.webview.postMessage({
                command: "clearComparisonHistoryResponse",
                requestId: message.requestId,
                result: null,
              });
              return;
            }
            case "exportComparison": {
              try {
                const format = message.format as ExportFormat;
                if (format !== "markdown" && format !== "json") {
                  throw new Error("Unsupported export format.");
                }
                const content = formatComparisonExport(
                  message.result,
                  format,
                  message.summary
                );
                const extension = format === "markdown" ? "md" : "json";
                const target = await vscode.window.showSaveDialog({
                  title: "Export deployment comparison",
                  filters:
                    format === "markdown"
                      ? { Markdown: ["md"] }
                      : { JSON: ["json"] },
                  defaultUri: vscode.Uri.file(
                    `deployment-comparison-${Date.now()}.${extension}`
                  ),
                });
                if (target) {
                  await vscode.workspace.fs.writeFile(
                    target,
                    new TextEncoder().encode(content)
                  );
                }
                currentPanel?.webview.postMessage({
                  command: "exportComparisonResponse",
                  requestId: message.requestId,
                  result: target?.toString() ?? null,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "exportComparisonResponse",
                  requestId: message.requestId,
                  error: error.message || "Could not export the comparison.",
                });
              }
              return;
            }
            case "createComparisonWorkItem": {
              try {
                const confirmation = await vscode.window.showWarningMessage(
                  `Create a ${message.workItemType} in Azure DevOps?`,
                  { modal: true },
                  "Create"
                );
                if (confirmation !== "Create") {
                  throw new Error("Work item creation was cancelled.");
                }
                const adoService = await createAdoService(
                  profileStore,
                  message.profileId
                );
                const result = await adoService.createComparisonWorkItem(
                  message.result,
                  message.title,
                  message.workItemType,
                  message.summary
                );
                currentPanel?.webview.postMessage({
                  command: "createComparisonWorkItemResponse",
                  requestId: message.requestId,
                  result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "createComparisonWorkItemResponse",
                  requestId: message.requestId,
                  error: error.message || "Could not create the work item.",
                });
              }
              return;
            }
            case "generateAiSummary": {
              try {
                const summary = await vscode.window.withProgress(
                  {
                    location: vscode.ProgressLocation.Notification,
                    title: "Generating deployment summary with Copilot...",
                    cancellable: true,
                  },
                  async (_progress, token) => {
                    const models = await vscode.lm.selectChatModels({
                      vendor: "copilot",
                    });
                    const model = models[0];
                    if (!model) {
                      throw new Error(
                        "No Copilot language model is available. Enable GitHub Copilot Chat and sign in."
                      );
                    }
                    const response = await model.sendRequest(
                      [
                        vscode.LanguageModelChatMessage.User(
                          buildAiSummaryPrompt(message.result)
                        ),
                      ],
                      {},
                      token
                    );
                    let text = "";
                    for await (const fragment of response.text) {
                      if (token.isCancellationRequested) {
                        throw new vscode.CancellationError();
                      }
                      text += fragment;
                    }
                    return text.trim();
                  }
                );
                currentPanel?.webview.postMessage({
                  command: "generateAiSummaryResponse",
                  requestId: message.requestId,
                  result: summary,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "generateAiSummaryResponse",
                  requestId: message.requestId,
                  error:
                    error instanceof vscode.CancellationError
                      ? "Summary generation was cancelled."
                      : error.message || "Could not generate the summary.",
                });
              }
              return;
            }
            case "getTeamsConfiguration": {
              try {
                const result = await getTeamsConfiguration(context);
                currentPanel?.webview.postMessage({
                  command: "getTeamsConfigurationResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "getTeamsConfigurationResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "configureTeamsWebhook": {
              try {
                const result = await configureTeamsWebhook(context);
                currentPanel?.webview.postMessage({
                  command: "configureTeamsWebhookResponse",
                  requestId: message.requestId,
                  result,
                });
                if (result.configured) {
                  await refreshChrome();
                }
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "configureTeamsWebhookResponse",
                  requestId: message.requestId,
                  error: error.message || "Could not configure Teams.",
                });
              }
              return;
            }
            case "sendTeamsComparison": {
              try {
                const request = message.request as TeamsShareRequest;
                await sendTeamsWorkflow(context, request);
                currentPanel?.webview.postMessage({
                  command: "sendTeamsComparisonResponse",
                  requestId: message.requestId,
                  result: null,
                });
              } catch (error: any) {
                const detail = axios.isAxiosError(error)
                  ? `Teams Workflow returned ${
                      error.response?.status ?? error.code ?? "an error"
                    }.`
                  : error.message || "Could not send the Teams message.";
                currentPanel?.webview.postMessage({
                  command: "sendTeamsComparisonResponse",
                  requestId: message.requestId,
                  error: detail,
                });
              }
              return;
            }
          }
        },
        undefined,
        panelDisposables
      );

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
          webviewReady = false;
          themeChangeListener.dispose();
          while (panelDisposables.length) {
            const d = panelDisposables.pop();
            if (d) {
              d.dispose();
            }
          }
        },
        null,
        context.subscriptions
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tools.navigate",
      (route: string = "/compare") => {
        const targetRoute = route || "/compare";

        if (!currentPanel) {
          vscode.commands
            .executeCommand("fe-ninja-tools.showPipelines")
            .then(() => {
              setTimeout(() => {
                if (currentPanel) {
                  currentPanel.webview.postMessage({
                    type: "navigate",
                    payload: targetRoute,
                  });
                }
              }, 500);
            });
        } else {
          currentPanel.webview.postMessage({
            type: "navigate",
            payload: targetRoute,
          });
          currentPanel.reveal();
        }
      }
    )
  );
}

export function deactivate() {
  return;
}

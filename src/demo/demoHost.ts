import type { ComparisonResult } from "../models/comparison";
import type { ComparisonHistoryEntry } from "../models/history";
import type { PipelineRun } from "../api-sdk";
import {
  formatComparisonExport,
  type ExportFormat,
} from "../utils/exportFormatting";
import { createDemoComparison } from "./demoComparison";
import {
  createDemoHistory,
  demoActiveProfileId,
  demoAiSummary,
  demoBuilds,
  demoDeployedRun,
  demoGitReferences,
  demoProfiles,
} from "./demoWorkspace";

export interface DemoVsCodeApi {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

const RESPONSE_DELAY_MS = 220;

function deliver(message: any): void {
  window.dispatchEvent(new MessageEvent("message", { data: message }));
}

function comparisonFor(
  baseBuild?: PipelineRun,
  targetBuild?: PipelineRun
): ComparisonResult {
  const comparison = createDemoComparison();
  return {
    ...comparison,
    baseBuild: baseBuild ?? comparison.baseBuild,
    targetBuild: targetBuild ?? comparison.targetBuild,
  };
}

function downloadFile(name: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Emulates the extension host message protocol so the exact same webview code
 * can run as a static browser demo backed by sample data.
 */
export function createDemoVsCodeApi(): DemoVsCodeApi {
  let state: any = {};
  let history: ComparisonHistoryEntry[] = createDemoHistory();
  let teamsConfigured = false;
  let workItemCounter = 90210;
  let autoLoaded = false;

  const respond = (requestId: string | undefined, result: unknown): void => {
    if (!requestId) {
      return;
    }
    window.setTimeout(
      () => deliver({ requestId, result }),
      RESPONSE_DELAY_MS
    );
  };

  const handle = (message: any): void => {
    const { command, requestId } = message ?? {};
    switch (command) {
      case "webviewReady":
      case "openSettings":
      case "setup:close":
        return;
      case "getTheme":
        deliver({
          command: "themeChanged",
          theme: document.body.classList.contains("demo-light")
            ? "vscode-light"
            : "vscode-dark",
        });
        return;
      case "getAuthAndConfig":
        window.setTimeout(
          () =>
            deliver({
              command: "authAndConfigResponse",
              config: demoProfiles[0]?.config ?? null,
              profile: demoProfiles[0] ?? null,
              profiles: demoProfiles,
              needsOnboarding: false,
            }),
          RESPONSE_DELAY_MS
        );
        return;
      case "findLatestDeployedRun":
        respond(requestId, demoDeployedRun);
        return;
      case "fetchLastNBuilds":
        respond(requestId, demoBuilds);
        if (!autoLoaded) {
          // Present the sample comparison once the workspace finished loading,
          // mirroring the extension's "Explore Sample Release" command.
          autoLoaded = true;
          window.setTimeout(loadDemoComparison, RESPONSE_DELAY_MS * 2);
        }
        return;
      case "fetchCommitRangeData": {
        const comparison = comparisonFor(
          message.olderRun,
          message.selectedBuild
        );
        history = [
          {
            id: `demo-history-${history.length + 1}`,
            profileId: message.profileId ?? demoActiveProfileId,
            createdAt: new Date().toISOString(),
            summary: `${comparison.baseBuild.buildNumber} → ${comparison.targetBuild.buildNumber} · ${comparison.risk.level} risk · ${comparison.commits.length} commits`,
            result: comparison,
          },
          ...history,
        ];
        respond(requestId, comparison);
        return;
      }
      case "compareGitReferences":
      case "compareProfileEnvironments":
        respond(requestId, comparisonFor());
        return;
      case "getGitReferences":
        respond(requestId, demoGitReferences);
        return;
      case "getComparisonHistory":
        respond(requestId, history);
        return;
      case "clearComparisonHistory":
        history = [];
        respond(requestId, undefined);
        return;
      case "getTeamsConfiguration":
        respond(requestId, {
          configured: teamsConfigured,
          ...(teamsConfigured ? { destinationName: "Demo release channel" } : {}),
        });
        return;
      case "configureTeamsWebhook":
        teamsConfigured = true;
        respond(requestId, {
          configured: true,
          destinationName: "Demo release channel",
        });
        return;
      case "sendTeamsComparison":
        respond(requestId, undefined);
        return;
      case "generateAiSummary":
        respond(requestId, demoAiSummary);
        return;
      case "exportComparison": {
        const format: ExportFormat =
          message.format === "json" ? "json" : "markdown";
        const contents = formatComparisonExport(
          message.result,
          format,
          message.summary
        );
        downloadFile(
          `release-lens-demo.${format === "json" ? "json" : "md"}`,
          contents,
          format === "json" ? "application/json" : "text/markdown"
        );
        respond(requestId, `release-lens-demo.${format}`);
        return;
      }
      case "createComparisonWorkItem":
        respond(requestId, {
          id: ++workItemCounter,
          url: "https://dev.azure.com/example/Commerce/_workitems/edit/90211",
        });
        return;
      case "runSmartOnboarding":
      case "switchPipelineProfile":
      case "editPipelineProfile":
      case "deletePipelineProfile":
        respond(requestId, {
          activeProfile: demoProfiles[0] ?? null,
          profiles: demoProfiles,
        });
        return;
      default:
        if (requestId) {
          window.setTimeout(
            () =>
              deliver({
                requestId,
                error:
                  "This action is not available in the browser demo. Install the extension to use it.",
              }),
            RESPONSE_DELAY_MS
          );
        }
    }
  };

  return {
    postMessage: handle,
    getState: () => state,
    setState: (next: any) => {
      state = next;
    },
  };
}

/** Pushes the sample comparison into the webview, mirroring the demo command. */
export function loadDemoComparison(): void {
  deliver({ command: "loadComparison", result: createDemoComparison() });
}

/** Notifies the webview that the demo page switched between light and dark. */
export function notifyDemoTheme(theme: "vscode-light" | "vscode-dark"): void {
  deliver({ command: "themeChanged", theme });
}

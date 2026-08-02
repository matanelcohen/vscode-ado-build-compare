import type {
  ComparisonResult,
  GitReference,
  TeamsShareRequest,
} from "./models/comparison";
import type { ProfileSnapshot } from "./models/profile";
import type { ComparisonHistoryEntry } from "./models/history";
import type { ExportFormat } from "./utils/exportFormatting";

// Keep PipelineRun as it's a simplified interface for the webview
export interface PipelineRun {
  id: number;
  buildNumber: string;
  sourceVersion?: string | undefined;
  finishTime?: string | undefined;
  commitMessage?: string | undefined;
  status?: string | undefined;
  result?: string | undefined;
  startTime?: string | undefined;
  queueTime?: string | undefined;
  url?: string | undefined;
  _links?: any;
  definition?: {
    id: number;
    name: string;
    url: string;
  } | undefined;
  project?: {
    id: string;
    name: string;
  } | undefined;
  requestedBy?: {
    displayName: string;
    id: string;
    uniqueName: string;
  } | undefined;
  reason?: string | undefined;
  sourceBranch?: string | undefined;
  sourceRepositoryId?: string | undefined;
  templateParameters?: any;
  triggerInfo?: any;
  uri?: string | undefined;
  buildNumberRevision?: number | undefined;
  deleted?: boolean | undefined;
  retainedByRelease?: boolean | undefined;
  triggeredByBuild?: Record<string, unknown> | undefined;
}

export interface AdcPipelineViewerConfig {
  organizationUrl: string;
  projectName: string;
  pipelineDefinitionId: number;
  targetStageName: string;
  repositoryId: string;
  relevantPathFilter?: string;
}

export interface TeamsConfigurationStatus {
  configured: boolean;
  destinationName?: string;
}

// VSCode API instance for communication with extension host
let vscode: { postMessage: (message: any) => void } | null = null;

// Function to set the vscode API instance
export function setVSCodeApi(vsCodeApi: { postMessage: (message: any) => void }) {
  vscode = vsCodeApi;
}

let requestCounter = 0;
const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>();

// Listen for responses from extension host
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const message = event.data;

    if (message.requestId && pendingRequests.has(message.requestId)) {
      const pending = pendingRequests.get(message.requestId);
      if (pending) {
        const { resolve, reject } = pending;
        pendingRequests.delete(message.requestId);

        if (message.error) {
          reject(new Error(message.error));
        } else {
          resolve(message.result);
        }
      }
    }
  });
}

function makeRequest<T>(
  command: string,
  data: any,
  timeoutMs = 30000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!vscode) {
      reject(new Error('VSCode API not available'));
      return;
    }

    const requestId = `${command}_${++requestCounter}`;
    pendingRequests.set(requestId, { resolve, reject });

    const message = {
      command,
      requestId,
      ...data
    };

    vscode.postMessage(message);

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for ${command}`));
      }
    }, timeoutMs);
  });
}

export async function findLatestDeployedRun(
  profileId: string
): Promise<PipelineRun | null> {
  return makeRequest<PipelineRun | null>('findLatestDeployedRun', {
    profileId
  });
}

export async function fetchLastNBuilds(
  count: number,
  profileId: string
): Promise<PipelineRun[]> {
  return makeRequest<PipelineRun[]>('fetchLastNBuilds', {
    count,
    profileId
  });
}

export async function fetchCommitRangeData(
  olderRun: PipelineRun,
  selectedBuild: PipelineRun,
  profileId: string
): Promise<ComparisonResult> {
  return makeRequest<ComparisonResult>(
    "fetchCommitRangeData",
    {
      olderRun,
      selectedBuild,
      profileId,
    },
    120000
  );
}

export async function getTeamsConfiguration(): Promise<TeamsConfigurationStatus> {
  return makeRequest<TeamsConfigurationStatus>("getTeamsConfiguration", {});
}

export async function configureTeamsWebhook(): Promise<TeamsConfigurationStatus> {
  return makeRequest<TeamsConfigurationStatus>(
    "configureTeamsWebhook",
    {},
    300000
  );
}

export async function sendTeamsComparison(
  request: TeamsShareRequest
): Promise<void> {
  return makeRequest<void>("sendTeamsComparison", { request });
}

export async function runSmartOnboarding(): Promise<ProfileSnapshot> {
  return makeRequest<ProfileSnapshot>("runSmartOnboarding", {}, 600000);
}

export async function switchPipelineProfile(): Promise<ProfileSnapshot> {
  return makeRequest<ProfileSnapshot>("switchPipelineProfile", {}, 300000);
}

export async function deletePipelineProfile(): Promise<ProfileSnapshot> {
  return makeRequest<ProfileSnapshot>("deletePipelineProfile", {}, 300000);
}

export async function editPipelineProfile(): Promise<ProfileSnapshot> {
  return makeRequest<ProfileSnapshot>("editPipelineProfile", {}, 300000);
}

export async function getComparisonHistory(
  profileId: string
): Promise<ComparisonHistoryEntry[]> {
  return makeRequest<ComparisonHistoryEntry[]>("getComparisonHistory", {
    profileId,
  });
}

export async function clearComparisonHistory(
  profileId: string
): Promise<void> {
  return makeRequest<void>("clearComparisonHistory", { profileId });
}

export async function exportComparison(
  result: ComparisonResult,
  format: ExportFormat,
  summary?: string
): Promise<string | null> {
  return makeRequest<string | null>(
    "exportComparison",
    { result, format, summary },
    300000
  );
}

export async function createComparisonWorkItem(
  profileId: string,
  result: ComparisonResult,
  title: string,
  workItemType: string,
  summary: string
): Promise<{ id: number; url?: string }> {
  return makeRequest<{ id: number; url?: string }>(
    "createComparisonWorkItem",
    { profileId, result, title, workItemType, summary },
    120000
  );
}

export async function generateAiSummary(
  result: ComparisonResult
): Promise<string> {
  return makeRequest<string>("generateAiSummary", { result }, 300000);
}

export async function getGitReferences(
  profileId: string
): Promise<GitReference[]> {
  return makeRequest<GitReference[]>("getGitReferences", { profileId }, 60000);
}

export async function compareGitReferences(
  profileId: string,
  base: GitReference,
  target: GitReference
): Promise<ComparisonResult> {
  return makeRequest<ComparisonResult>(
    "compareGitReferences",
    { profileId, base, target },
    120000
  );
}

export async function compareProfileEnvironments(
  baseProfileId: string,
  targetProfileId: string
): Promise<ComparisonResult> {
  return makeRequest<ComparisonResult>(
    "compareProfileEnvironments",
    { baseProfileId, targetProfileId },
    180000
  );
}

import { PipelineRun } from "./interfaces/pipeline";
import { GitPullRequest } from "./interfaces/ado";

export interface AdcPipelineViewerConfig {
  organizationUrl: string;
  projectName: string;
  pipelineDefinitionId: number;
  targetStageName: string;
  repositoryId: string;
  relevantPathFilter?: string;
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

function makeRequest<T>(command: string, data: any): Promise<T> {
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

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for ${command}`));
      }
    }, 30000);
  });
}

export async function findLatestDeployedRun(
  accessToken: string,
  config: AdcPipelineViewerConfig
): Promise<PipelineRun | null> {
  return makeRequest<PipelineRun | null>('findLatestDeployedRun', {
    accessToken,
    config
  });
}

export async function fetchLastNBuilds(
  accessToken: string,
  count: number,
  config: AdcPipelineViewerConfig
): Promise<PipelineRun[]> {
  return makeRequest<PipelineRun[]>('fetchLastNBuilds', {
    accessToken,
    count,
    config
  });
}

export async function fetchCommitRangeData(
  accessToken: string,
  olderRun: PipelineRun,
  selectedBuild: PipelineRun,
  config: AdcPipelineViewerConfig
): Promise<{
  committerMap: { [committer: string]: string[] };
  error?: string;
}> {
  return makeRequest<{
    committerMap: { [committer: string]: string[] };
    error?: string;
  }>('fetchCommitRangeData', {
    accessToken,
    olderRun,
    selectedBuild,
    config
  });
}

export async function getActivePullRequestForBranch(
  accessToken: string,
  branchName: string,
  config: AdcPipelineViewerConfig
): Promise<GitPullRequest | null> {
  return makeRequest<GitPullRequest | null>('getActivePullRequestForBranch', {
    accessToken,
    branchName,
    config
  });
}

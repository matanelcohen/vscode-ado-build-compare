export interface PipelineRun {
  id: number;
  buildNumber: string;
  sourceVersion: string | undefined;
  finishTime: string | null | undefined;
  commitMessage?: string | undefined;
  status: string | undefined;
  result: string | undefined;
  startTime?: string;
  queueTime?: string;
  url?: string;
  _links?: Record<string, { href: string }>;
  definition?: {
    id: number;
    name: string;
    url: string;
  };
  project?: {
    id: string;
    name: string;
  };
  requestedBy?: {
    displayName: string;
    id: string;
    uniqueName: string;
  };
  reason?: string;
  sourceBranch?: string;
  sourceRepositoryId?: string;
  templateParameters?: Record<string, unknown>;
  triggerInfo?: Record<string, unknown>;
  uri?: string;
  buildNumberRevision?: number;
  deleted?: boolean;
  retainedByRelease?: boolean;
  triggeredByBuild?: Record<string, unknown>;
}

export interface TimelineRecord {
  id: string;
  parentId?: string;
  type: string;
  name: string;
  startTime?: string;
  finishTime?: string;
  currentOperation?: string;
  percentComplete?: number;
  state: string;
  result?: string;
  resultCode?: string;
  changeId?: number;
  lastModified?: string;
  workerName?: string;
  order?: number;
  details?: {
    id: string;
    changeId: number;
    url: string;
  };
  errorCount?: number;
  warningCount?: number;
  url?: string;
  log?: {
    id: number;
    type: string;
    url: string;
  };
  task?: {
    id: string;
    name: string;
    version: string;
  };
  attempt?: number;
  identifier?: string;
}

export interface Timeline {
  records: TimelineRecord[];
  lastChangedBy?: string;
  lastChangedOn?: string;
  id?: string;
  changeId?: number;
  url?: string;
}

export interface GetPipelineRunsResponse {
  value: PipelineRun[];
  count: number;
}

export interface PipelineRunRequestParams {
  definitionId?: number;
  buildNumber?: string;
  minTime?: string;
  maxTime?: string;
  requestedFor?: string;
  reasonFilter?: string;
  statusFilter?: string;
  resultFilter?: string;
  tagFilters?: string[];
  propertyFilters?: string[];
  top?: number;
  continuationToken?: string;
  maxBuildsPerDefinition?: number;
  deletedFilter?: string;
  queryOrder?: string;
  branchName?: string;
  buildIds?: number[];
  repositoryId?: string;
  repositoryType?: string;
}

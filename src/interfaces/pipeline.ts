export interface PipelineRun {
  id: number;
  buildNumber: string;
  queueTime: string;
  finishTime?: string;
  result?: string;
  status?: string;
  sourceVersion?: string;
  commitMessage?: string; // Add commit message field
  _links: { web: { href: string } };
}

export interface TimelineRecord {
  id: string;
  type: string;
  name: string;
  state: string;
  result: string;
}

export interface Timeline {
  records: TimelineRecord[];
}

import type { ComparisonResult } from "./comparison";

export interface ComparisonHistoryEntry {
  id: string;
  profileId: string;
  createdAt: string;
  summary: string;
  result: ComparisonResult;
}

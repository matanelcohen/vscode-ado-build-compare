import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import { ComparisonResult } from "../models/comparison";
import { ComparisonHistoryEntry } from "../models/history";
import { generateDeterministicSummary } from "../utils/riskAnalysis";

const historyStateKey = "buildCompareTools.comparisonHistory.v1";
const maximumEntries = 10;

export class ComparisonHistoryStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  get(profileId: string): ComparisonHistoryEntry[] {
    return this.read()
      .filter((entry) => entry.profileId === profileId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async add(
    profileId: string,
    result: ComparisonResult
  ): Promise<ComparisonHistoryEntry> {
    const entry: ComparisonHistoryEntry = {
      id: randomUUID(),
      profileId,
      createdAt: new Date().toISOString(),
      summary: generateDeterministicSummary(result),
      result: compactResult(result),
    };
    const otherProfiles = this.read().filter(
      (item) => item.profileId !== profileId
    );
    const profileEntries = [entry, ...this.get(profileId)].slice(
      0,
      maximumEntries
    );
    await this.context.globalState.update(historyStateKey, [
      ...profileEntries,
      ...otherProfiles,
    ]);
    return entry;
  }

  async clear(profileId: string): Promise<void> {
    await this.context.globalState.update(
      historyStateKey,
      this.read().filter((entry) => entry.profileId !== profileId)
    );
  }

  private read(): ComparisonHistoryEntry[] {
    const value = this.context.globalState.get<unknown>(historyStateKey);
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(isHistoryEntry);
  }
}

function compactResult(result: ComparisonResult): ComparisonResult {
  const truncated =
    result.commits.length > 200 || result.files.length > 500;
  return {
    ...result,
    commits: result.commits.slice(0, 200).map((commit) => ({
      ...commit,
      files: commit.files.slice(0, 100),
    })),
    directCommits: result.directCommits.slice(0, 200).map((commit) => ({
      ...commit,
      files: commit.files.slice(0, 100),
    })),
    files: result.files.slice(0, 500),
    warnings: truncated
      ? [
          ...result.warnings,
          "This saved history snapshot was truncated. Run the comparison again for complete details.",
        ]
      : result.warnings,
  };
}

function isHistoryEntry(value: unknown): value is ComparisonHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<ComparisonHistoryEntry>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.profileId === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.summary === "string" &&
    Boolean(candidate.result)
  );
}

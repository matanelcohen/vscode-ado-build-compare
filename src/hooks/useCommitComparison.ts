import * as React from "react";
import { PipelineRun } from "../api-sdk";
import { fetchCommitRangeData } from "../api-sdk";
import { ComparisonResult } from "../models/comparison";

export function useCommitComparison(): {
  result: ComparisonResult | null;
  loading: boolean;
  error: string | null;
  compareCommits: (
    olderRun: PipelineRun,
    selectedBuild: PipelineRun,
    profileId: string
  ) => Promise<void>;
  resetComparison: () => void;
  loadComparison: (comparison: ComparisonResult) => void;
} {
  const [result, setResult] = React.useState<ComparisonResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const generation = React.useRef(0);

  const compareCommits = React.useCallback(
    async (
      olderRun: PipelineRun,
      selectedBuild: PipelineRun,
      profileId: string
    ) => {
      const requestGeneration = ++generation.current;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const comparison = await fetchCommitRangeData(
          olderRun,
          selectedBuild,
          profileId
        );
        if (generation.current === requestGeneration) {
          setResult(comparison);
        }
      } catch (err: unknown) {
        if (generation.current === requestGeneration) {
          setError(
            `Could not compare these builds: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      } finally {
        if (generation.current === requestGeneration) {
          setLoading(false);
        }
      }
    },
    []
  );

  const resetComparison = React.useCallback(() => {
    generation.current += 1;
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  const loadComparison = React.useCallback((comparison: ComparisonResult) => {
    generation.current += 1;
    setResult(comparison);
    setError(null);
    setLoading(false);
  }, []);

  return {
    result,
    loading,
    error,
    compareCommits,
    resetComparison,
    loadComparison,
  };
}

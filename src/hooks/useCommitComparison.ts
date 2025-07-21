import * as React from "react";
import { PipelineRun } from "../interfaces/pipeline";
import { fetchCommitRangeData, AdcPipelineViewerConfig } from "../api";

export function useCommitComparison(): {
  committerMap: { [committer: string]: string[] } | null;
  loading: boolean;
  error: string | null;
  compareCommits: (
    accessToken: string,
    olderRun: PipelineRun,
    selectedBuild: PipelineRun,
    config: AdcPipelineViewerConfig
  ) => Promise<void>;
  resetComparison: () => void;
} {
  const [committerMap, setCommitterMap] = React.useState<{
    [committer: string]: string[];
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const compareCommits = React.useCallback(
    async (
      accessToken: string,
      olderRun: PipelineRun,
      selectedBuild: PipelineRun,
      config: AdcPipelineViewerConfig
    ) => {
      setLoading(true);
      setError(null);
      setCommitterMap(null);
      try {
        const { committerMap: map, error: apiError } =
          await fetchCommitRangeData(
            accessToken,
            olderRun,
            selectedBuild,
            config
          );
        if (apiError) {
          setError(apiError);
        } else {
          setCommitterMap(map);
        }
      } catch (err: any) {
        setError(`Error fetching commit data: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const resetComparison = React.useCallback(() => {
    setCommitterMap(null);
    setError(null);
    setLoading(false);
  }, []);

  return { committerMap, loading, error, compareCommits, resetComparison };
}

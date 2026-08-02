import * as React from "react";
import { PipelineRun } from "../api-sdk";
import {
  findLatestDeployedRun,
  fetchLastNBuilds,
  AdcPipelineViewerConfig,
} from "../api-sdk";

export function useBuildData(
  profileId: string | null,
  config: AdcPipelineViewerConfig | null
): {
  olderRun: PipelineRun | null;
  builds: PipelineRun[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [olderRun, setOlderRun] = React.useState<PipelineRun | null>(null);
  const [builds, setBuilds] = React.useState<PipelineRun[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const refresh = React.useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  React.useEffect(() => {
    if (!profileId || !config) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setOlderRun(null);
    setBuilds([]);
    let cancelled = false;

    (async () => {
      try {
        const latest = await findLatestDeployedRun(profileId);

        if (!latest) {
          if (!cancelled) {
            setError(
              `No successful deployment found for pipeline ${config.pipelineDefinitionId} with target stage "${config.targetStageName}". Check if there are any completed successful deployments.`
            );
          }
          return;
        }

        if (!latest.finishTime) {
          if (!cancelled) {
            setError(
              `Found deployment (ID: ${latest.id}) but it lacks a finish time. This deployment may still be running or have incomplete data.`
            );
          }
          return;
        }
        if (cancelled) {
          return;
        }
        setOlderRun(latest);

        const buildList = await fetchLastNBuilds(30, profileId);

        const availableBuilds = buildList.filter(
          (build) => build.id !== latest.id && Boolean(build.sourceVersion)
        );

        if (!cancelled) {
          setBuilds(availableBuilds);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            `Could not load pipeline data: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, config, refreshKey]);

  return { olderRun, builds, loading, error, refresh };
}

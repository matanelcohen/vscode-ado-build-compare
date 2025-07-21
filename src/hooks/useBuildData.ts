// src/hooks/useBuildData.ts
import * as React from "react";
import { PipelineRun } from "../interfaces/pipeline";
import {
  findLatestDeployedRun,
  fetchLastNBuilds,
  AdcPipelineViewerConfig,
} from "../api";

export function useBuildData(
  accessToken: string | null,
  config: AdcPipelineViewerConfig | null
): {
  olderRun: PipelineRun | null;
  builds: PipelineRun[];
  loading: boolean;
  error: string | null;
} {
  const [olderRun, setOlderRun] = React.useState<PipelineRun | null>(null);
  const [builds, setBuilds] = React.useState<PipelineRun[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken || !config) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setOlderRun(null);
    setBuilds([]);

    (async () => {
      try {
        console.log("Searching for latest deployed run with config:", config);
        const latest = await findLatestDeployedRun(accessToken, config);
        console.log("Found latest run:", latest);

        if (!latest) {
          setError(
            `No successful deployment found for pipeline ${config.pipelineDefinitionId} with target stage "${config.targetStageName}". Check if there are any completed successful deployments.`
          );
          setLoading(false);
          return;
        }

        if (!latest.finishTime) {
          setError(
            `Found deployment (ID: ${latest.id}) but it lacks a finish time. This deployment may still be running or have incomplete data.`
          );
          setLoading(false);
          return;
        }
        setOlderRun(latest);

        const buildList = await fetchLastNBuilds(accessToken, 30, config);

        // Filter builds: must be different from latest, have a finishTime, and be newer
        const newerBuilds = buildList.filter((b) => {
          return (
            b.id !== latest.id
            // b.finishTime && // Ensure the build has a finish time
            // new Date(b.finishTime) > latestFinishDate // Compare dates
          );
        });

        setBuilds(newerBuilds);
      } catch (err: any) {
        setError(`Error fetching build data: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, config]);

  return { olderRun, builds, loading, error };
}

import * as React from "react";
import { PipelineRun } from "../api-sdk";
import { useAuthAndConfig } from "./useAccessToken";
import { useBuildData } from "./useBuildData";
import { useCommitComparison } from "./useCommitComparison";
import { generatePlainTextResults } from "../utils/generatePlainTextResults";
import { generateDeterministicSummary } from "../utils/riskAnalysis";
import {
  ComparisonSkin,
  ComparisonTab,
  readComparisonSkin,
  readComparisonTab,
} from "../models/webviewState";
import { ComparisonResult } from "../models/comparison";
import { PipelineProfile } from "../models/profile";

export interface ComparisonWorkspace {
  /** Active profile and connection state. */
  config: ReturnType<typeof useAuthAndConfig>["config"];
  profile: PipelineProfile | null;
  profiles: PipelineProfile[];
  needsOnboarding: boolean;
  reloadConfiguration: () => void;

  /** Build data. */
  olderRun: PipelineRun | null;
  comparisonBuilds: PipelineRun[];
  targetBuilds: PipelineRun[];
  baseBuild: PipelineRun | null;
  selectedBuild: PipelineRun | null;
  selectedBuildId: number | null;
  refresh: () => void;

  /** Comparison result. */
  result: ComparisonResult | null;
  releaseSummary: string;
  setReleaseSummary: (summary: string) => void;
  loadComparison: (result: ComparisonResult) => void;
  historyRefreshKey: number;

  /** Status flags. */
  isLoading: boolean;
  authLoading: boolean;
  comparisonLoading: boolean;
  currentError: string | null;
  comparisonError: string | null;
  isComparisonActive: boolean;
  hasResults: boolean;
  copyStatus: string;

  /** Navigation. */
  selectedTab: ComparisonTab;
  selectTab: (tab: ComparisonTab) => void;
  skin: ComparisonSkin;
  selectSkin: (skin: ComparisonSkin) => void;

  /** Actions. */
  selectBuild: (buildId: number) => void;
  selectBaseBuild: (buildId: number) => void;
  compare: () => Promise<void>;
  reset: () => void;
  copyResults: () => Promise<void>;
  openSettings: () => void;
}

/**
 * Owns every piece of state the comparison webview needs so that each skin can
 * stay a purely presentational layout over the same data and actions.
 */
export function useComparisonWorkspace(vscode: any): ComparisonWorkspace {
  const {
    config,
    error: authError,
    loading: authLoading,
    profile,
    profiles,
    needsOnboarding,
    reload: reloadConfiguration,
  } = useAuthAndConfig(vscode);

  const {
    olderRun,
    builds,
    loading: buildLoading,
    error: buildError,
    refresh,
  } = useBuildData(profile?.id ?? null, config);

  const {
    result,
    loading: comparisonLoading,
    error: comparisonError,
    compareCommits,
    resetComparison,
    loadComparison,
  } = useCommitComparison();

  const [selectedBuildId, setSelectedBuildId] = React.useState<number | null>(
    null
  );
  const [baseBuildId, setBaseBuildId] = React.useState<number | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string>("");
  const [releaseSummary, setReleaseSummary] = React.useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = React.useState(0);
  const persistedState = vscode.getState?.();
  const [selectedTab, setSelectedTab] = React.useState<ComparisonTab>(() =>
    readComparisonTab(persistedState)
  );
  const [skin, setSkin] = React.useState<ComparisonSkin>(() =>
    readComparisonSkin(persistedState)
  );

  const persist = React.useCallback(
    (patch: { selectedTab?: ComparisonTab; skin?: ComparisonSkin }) => {
      const current = vscode.getState?.() ?? {};
      vscode.setState?.({ ...current, ...patch });
    },
    [vscode]
  );

  const selectTab = React.useCallback(
    (tab: ComparisonTab) => {
      setSelectedTab(tab);
      persist({ selectedTab: tab });
    },
    [persist]
  );

  const selectSkin = React.useCallback(
    (next: ComparisonSkin) => {
      setSkin(next);
      persist({ skin: next });
    },
    [persist]
  );

  const comparisonBuilds = React.useMemo(() => {
    const byId = new Map<number, PipelineRun>();
    if (olderRun) {
      byId.set(olderRun.id, olderRun);
    }
    for (const build of builds) {
      byId.set(build.id, build);
    }
    return [...byId.values()];
  }, [olderRun, builds]);

  const selectedBuild = React.useMemo(
    () =>
      comparisonBuilds.find((build) => build.id === selectedBuildId) ?? null,
    [comparisonBuilds, selectedBuildId]
  );

  const baseBuild =
    comparisonBuilds.find((build) => build.id === baseBuildId) ?? olderRun;

  const targetBuilds = React.useMemo(() => {
    if (!baseBuild) {
      return [];
    }
    const baseTime = new Date(
      baseBuild.finishTime ?? baseBuild.startTime ?? baseBuild.queueTime ?? 0
    ).getTime();
    return comparisonBuilds.filter((build) => {
      const targetTime = new Date(
        build.finishTime ?? build.startTime ?? build.queueTime ?? 0
      ).getTime();
      return build.id !== baseBuild.id && targetTime > baseTime;
    });
  }, [baseBuild, comparisonBuilds]);

  const selectBuild = React.useCallback((buildId: number) => {
    setSelectedBuildId(buildId);
    setCopyStatus("");
  }, []);

  const selectBaseBuild = React.useCallback((buildId: number) => {
    setBaseBuildId(buildId);
    setSelectedBuildId(null);
    setCopyStatus("");
  }, []);

  const compare = React.useCallback(async () => {
    if (!baseBuild || !selectedBuild || !config || !profile) {
      return;
    }
    setCopyStatus("");
    await compareCommits(baseBuild, selectedBuild, profile.id);
  }, [baseBuild, selectedBuild, config, profile, compareCommits]);

  const reset = React.useCallback(() => {
    setSelectedBuildId(null);
    resetComparison();
    setCopyStatus("");
  }, [resetComparison]);

  React.useEffect(() => {
    setSelectedBuildId(null);
    resetComparison();
    setCopyStatus("");
  }, [profile?.id, resetComparison]);

  React.useEffect(() => {
    if (olderRun) {
      setBaseBuildId(olderRun.id);
    }
  }, [olderRun]);

  React.useEffect(() => {
    if (result) {
      setReleaseSummary(generateDeterministicSummary(result));
      setHistoryRefreshKey((value) => value + 1);
      selectTab("changes");
    }
  }, [result, selectTab]);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.command === "loadComparison" && event.data.result) {
        loadComparison(event.data.result);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadComparison]);

  const copyResults = React.useCallback(async () => {
    if (!result) {
      return;
    }
    const textToCopy = generatePlainTextResults(result);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [result]);

  const openSettings = React.useCallback(() => {
    vscode.postMessage({ command: "openSettings" });
  }, [vscode]);

  const isLoading = authLoading || buildLoading;

  return {
    config,
    profile,
    profiles,
    needsOnboarding,
    reloadConfiguration,

    olderRun,
    comparisonBuilds,
    targetBuilds,
    baseBuild,
    selectedBuild,
    selectedBuildId,
    refresh,

    result,
    releaseSummary,
    setReleaseSummary,
    loadComparison,
    historyRefreshKey,

    isLoading,
    authLoading,
    comparisonLoading,
    currentError: authError || buildError,
    comparisonError,
    isComparisonActive: comparisonLoading || !!result || !!comparisonError,
    hasResults: Boolean(result),
    copyStatus,

    selectedTab,
    selectTab,
    skin,
    selectSkin,

    selectBuild,
    selectBaseBuild,
    compare,
    reset,
    copyResults,
    openSettings,
  };
}

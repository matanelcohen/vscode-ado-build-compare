import type { ComparisonHistoryEntry } from "./history";
import type { ProfileSnapshot } from "./profile";

export interface DashboardRow {
  id: string;
  label: string;
  description?: string;
  icon: string;
  command: string;
  arguments?: unknown[];
}

export function buildDashboardRows(
  snapshot: ProfileSnapshot,
  history: ComparisonHistoryEntry[],
  teamsConfigured: boolean
): DashboardRow[] {
  const active = snapshot.activeProfile;
  if (!active) {
    return [
      {
        id: "demo",
        label: "Explore a sample release",
        description: "No sign-in required",
        icon: "preview",
        command: "fe-ninja-tools.openDemo",
      },
      {
        id: "setup",
        label: "Connect Azure DevOps",
        description: "Start guided setup",
        icon: "plug",
        command: "fe-ninja-tools.setupProfile",
      },
    ];
  }

  const rows: DashboardRow[] = [
    {
      id: "active-profile",
      label: active.name,
      description: active.config.targetStageName,
      icon: "account",
      command: "fe-ninja-tools.switchProfile",
    },
    {
      id: "open-comparison",
      label: "Open comparison workspace",
      description: active.config.projectName,
      icon: "compare-changes",
      command: "fe-ninja-tools.showPipelines",
    },
    {
      id: "refresh",
      label: "Refresh pipeline data",
      icon: "refresh",
      command: "fe-ninja-tools.refresh",
    },
    {
      id: "teams",
      label: teamsConfigured ? "Teams connected" : "Configure Teams",
      description: teamsConfigured ? "Workflow ready" : "Adaptive Card delivery",
      icon: teamsConfigured ? "pass-filled" : "comment-discussion",
      command: "fe-ninja-tools.configureTeams",
    },
    {
      id: "feedback",
      label: "Send feedback",
      description: "Help shape Release Lens",
      icon: "feedback",
      command: "fe-ninja-tools.sendFeedback",
    },
    {
      id: "share-profiles",
      label: "Share team setup",
      description: "Export or import profiles",
      icon: "cloud-download",
      command: "fe-ninja-tools.manageProfiles",
    },
  ];

  for (const entry of history.slice(0, 3)) {
    rows.push({
      id: `history-${entry.id}`,
      label: `${entry.result.baseBuild.buildNumber} → ${entry.result.targetBuild.buildNumber}`,
      description: `${entry.result.risk.level} risk · ${new Date(
        entry.createdAt
      ).toLocaleDateString()}`,
      icon: "history",
      command: "fe-ninja-tools.openHistoryEntry",
      arguments: [entry.result],
    });
  }
  return rows;
}

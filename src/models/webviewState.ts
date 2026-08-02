export const comparisonTabs = [
  "compare",
  "changes",
  "share",
  "history",
] as const;

export type ComparisonTab = (typeof comparisonTabs)[number];

export const comparisonSkins = [
  "classic",
  "diffbar",
  "workbench",
  "report",
] as const;

export type ComparisonSkin = (typeof comparisonSkins)[number];

export const defaultComparisonSkin: ComparisonSkin = "classic";

export interface ComparisonSkinDescriptor {
  id: ComparisonSkin;
  label: string;
  description: string;
}

export const comparisonSkinDescriptors: readonly ComparisonSkinDescriptor[] = [
  {
    id: "classic",
    label: "Classic",
    description:
      "The original tabbed layout with stacked build cards and a single results card.",
  },
  {
    id: "diffbar",
    label: "Diff bar",
    description:
      "A focused linear flow: base and target side by side, results directly below.",
  },
  {
    id: "workbench",
    label: "Workbench",
    description:
      "A persistent selection rail beside a tabbed results pane.",
  },
  {
    id: "report",
    label: "Report",
    description:
      "A summary-first release report with details behind collapsible sections.",
  },
];

export interface ComparisonWebviewState {
  selectedTab: ComparisonTab;
  skin: ComparisonSkin;
}

export function readComparisonTab(value: unknown): ComparisonTab {
  if (
    typeof value === "object" &&
    value !== null &&
    "selectedTab" in value &&
    comparisonTabs.includes(
      (value as { selectedTab: ComparisonTab }).selectedTab
    )
  ) {
    return (value as { selectedTab: ComparisonTab }).selectedTab;
  }
  return "compare";
}

export function readComparisonSkin(value: unknown): ComparisonSkin {
  if (
    typeof value === "object" &&
    value !== null &&
    "skin" in value &&
    comparisonSkins.includes((value as { skin: ComparisonSkin }).skin)
  ) {
    return (value as { skin: ComparisonSkin }).skin;
  }
  return defaultComparisonSkin;
}

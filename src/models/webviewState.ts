export const comparisonTabs = [
  "compare",
  "changes",
  "share",
  "history",
] as const;

export type ComparisonTab = (typeof comparisonTabs)[number];

export interface ComparisonWebviewState {
  selectedTab: ComparisonTab;
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

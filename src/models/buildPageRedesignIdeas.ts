export interface BuildPageRedesignIdea {
  id: string;
  title: string;
  summary: string;
  layout: string;
  highlights: string[];
  recommended?: boolean;
}

export const buildPageRedesignIdeas: BuildPageRedesignIdea[] = [
  {
    id: "executive-briefing",
    title: "Executive briefing",
    summary:
      "Start with a release-health hero, then guide the user through the build pair, risk, and share actions in one linear scan.",
    layout: "Hero summary → build pair → change insights → publish actions",
    highlights: [
      "Highlights the latest deployment status before the user chooses a target build.",
      "Keeps risk, hotspots, and PR volume visible without opening a second tab first.",
      "Fits release managers who want a quick go/no-go view.",
    ],
    recommended: true,
  },
  {
    id: "workflow-board",
    title: "Workflow board",
    summary:
      "Split the page into three clear steps so the comparison flow feels like a guided checklist instead of a long dashboard.",
    layout: "Step 1 select builds → Step 2 inspect changes → Step 3 share outcome",
    highlights: [
      "Makes onboarding easier by turning the page into a predictable sequence.",
      "Keeps follow-up actions attached to the current step to reduce context switching.",
      "Works well for keyboard-driven users and smaller VS Code panes.",
    ],
  },
  {
    id: "analyst-workbench",
    title: "Analyst workbench",
    summary:
      "Use a denser workspace with build selection on the left, change intelligence in the center, and evidence panels on the right.",
    layout: "Left rail builds → center insights → right rail history, drift, and exports",
    highlights: [
      "Optimized for power users comparing many builds across the day.",
      "Leaves history and environment drift accessible without hiding the main findings.",
      "Best when the extension is opened in a wide editor column or secondary window.",
    ],
  },
];

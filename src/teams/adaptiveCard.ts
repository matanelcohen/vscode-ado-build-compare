import {
  ComparedCommit,
  TeamsMention,
  TeamsShareRequest,
} from "../models/comparison";

interface AdaptiveCardMentionEntity {
  type: "mention";
  text: string;
  mentioned: {
    id: string;
    name: string;
  };
}

export function isLikelyTeamsUpn(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

export function isSupportedTeamsMentionId(value: string): boolean {
  const trimmed = value.trim();
  return (
    isLikelyTeamsUpn(trimmed) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed
    ) ||
    trimmed.startsWith("29:")
  );
}

function buildMentionText(mentions: TeamsMention[]): {
  text: string;
  entities: AdaptiveCardMentionEntity[];
} {
  const unique = new Map<string, TeamsMention>();
  for (const mention of mentions) {
    if (isSupportedTeamsMentionId(mention.userId)) {
      unique.set(mention.userId.toLocaleLowerCase(), mention);
    }
  }

  const values = [...unique.values()];
  return {
    text: values.map((mention) => `<at>${mention.displayName}</at>`).join(" "),
    entities: values.map((mention) => ({
      type: "mention" as const,
      text: `<at>${mention.displayName}</at>`,
      mentioned: {
        id: mention.userId,
        name: mention.displayName,
      },
    })),
  };
}

function commitLine(commit: ComparedCommit): string {
  const prefix = commit.pullRequest
    ? `[PR #${commit.pullRequest.id}](${commit.pullRequest.url})`
    : `\`${commit.id.slice(0, 7)}\``;
  return `- ${prefix} ${commit.message.split("\n")[0] || "No commit message"}`;
}

export function buildTeamsWorkflowPayload(
  request: TeamsShareRequest
): Record<string, unknown> {
  const { comparison } = request;
  const mentionData = buildMentionText(request.mentions);
  const buildUrl = comparison.targetBuild._links?.web?.href as
    | string
    | undefined;
  const comparisonLines = comparison.commits.slice(0, 12).map(commitLine);
  const hiddenCount = Math.max(0, comparison.commits.length - 12);
  if (hiddenCount > 0) {
    comparisonLines.push(`- _...and ${hiddenCount} more changes_`);
  }

  const body: Record<string, unknown>[] = [
    {
      type: "TextBlock",
      size: "Large",
      weight: "Bolder",
      text: request.title.trim() || "Deployment comparison",
      wrap: true,
    },
    ...(request.summary?.trim()
      ? [
          {
            type: "TextBlock",
            text: request.summary.trim(),
            wrap: true,
          },
        ]
      : []),
    {
      type: "FactSet",
      facts: [
        {
          title: "Builds",
          value: `${comparison.baseBuild.buildNumber} → ${comparison.targetBuild.buildNumber}`,
        },
        { title: "Pull requests", value: String(comparison.pullRequests.length) },
        { title: "Commits", value: String(comparison.commits.length) },
        { title: "Changed files", value: String(comparison.files.length) },
        { title: "Contributors", value: String(comparison.contributors.length) },
        {
          title: "Release risk",
          value: `${comparison.risk.level.toLocaleUpperCase()} (${comparison.risk.score}/100)`,
        },
      ],
    },
    {
      type: "TextBlock",
      weight: "Bolder",
      text: "Included changes",
      separator: true,
      wrap: true,
    },
    {
      type: "TextBlock",
      text:
        comparisonLines.join("\n") ||
        "No relevant changes were found for the configured path filters.",
      wrap: true,
    },
  ];

  if (mentionData.text) {
    body.push({
      type: "TextBlock",
      text: mentionData.text,
      wrap: true,
      separator: true,
    });
  }

  const actions = buildUrl
    ? [
        {
          type: "Action.OpenUrl",
          title: "Open target build",
          url: buildUrl,
        },
      ]
    : [];

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          body,
          actions,
          msteams: {
            width: "Full",
            entities: mentionData.entities,
          },
        },
      },
    ],
  };
}

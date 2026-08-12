import {
  ComparedCommit,
  TeamsMention,
  TeamsShareRequest,
} from "../models/comparison";
import { marketplaceUrl } from "../product";
import { groupCommitsByAuthor } from "../utils/groupChanges";

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

function buildMentionData(mentions: TeamsMention[]): {
  entities: AdaptiveCardMentionEntity[];
  mentions: TeamsMention[];
} {
  const unique = new Map<string, TeamsMention>();
  for (const mention of mentions) {
    if (isSupportedTeamsMentionId(mention.userId)) {
      unique.set(mention.userId.toLocaleLowerCase(), mention);
    }
  }

  const values = [...unique.values()];
  return {
    mentions: values,
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

function commitLine(commit: ComparedCommit, index: number): string {
  const prefix = commit.pullRequest
    ? `[PR #${commit.pullRequest.id}](${commit.pullRequest.url})`
    : `\`${commit.id.slice(0, 7)}\``;
  const message = commit.message.split("\n")[0] || "No commit message";
  return `${index}. ${prefix} ${message}`;
}

function buildAuthorChangeBlocks(
  commits: ComparedCommit[],
  mentions: TeamsMention[]
): {
  blocks: Record<string, unknown>[];
  placedMentionIds: Set<string>;
} {
  const placedMentionIds = new Set<string>();
  const blocks = groupCommitsByAuthor(commits).map((group, groupIndex) => {
    const authorEmail = group.author.email?.toLocaleLowerCase();
    const authorName = group.author.displayName.toLocaleLowerCase();
    const mention = mentions.find(
      (candidate) =>
        (authorEmail &&
          candidate.userId.toLocaleLowerCase() === authorEmail) ||
        candidate.displayName.toLocaleLowerCase() === authorName
    );
    if (mention) {
      placedMentionIds.add(mention.userId.toLocaleLowerCase());
    }
    const displayName = mention
      ? `<at>${mention.displayName}</at>`
      : group.author.displayName;
    return {
      type: "TextBlock",
      text: [
        `**${displayName}**`,
        "",
        ...group.commits.map((commit, index) => commitLine(commit, index + 1)),
      ].join("\n"),
      wrap: true,
      separator: groupIndex > 0,
    };
  });
  return { blocks, placedMentionIds };
}

export function buildTeamsWorkflowPayload(
  request: TeamsShareRequest
): Record<string, unknown> {
  const { comparison } = request;
  const mentionData = buildMentionData(request.mentions);
  const buildUrl = comparison.targetBuild._links?.web?.href as
    | string
    | undefined;
  const { blocks: changeBlocks, placedMentionIds } = buildAuthorChangeBlocks(
    comparison.commits,
    mentionData.mentions
  );
  const unplacedMentionText = mentionData.mentions
    .filter(
      (mention) =>
        !placedMentionIds.has(mention.userId.toLocaleLowerCase())
    )
    .map((mention) => `<at>${mention.displayName}</at>`)
    .join(" ");
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
    ...(changeBlocks.length > 0
      ? changeBlocks
      : [
          {
            type: "TextBlock",
            text: "No relevant changes were found for the configured path filters.",
            wrap: true,
          },
        ]),
  ];

  if (unplacedMentionText) {
    body.push({
      type: "TextBlock",
      text: unplacedMentionText,
      wrap: true,
      separator: true,
    });
  }
  const actions = [
    ...(buildUrl
      ? [
        {
          type: "Action.OpenUrl",
          title: "Open target build",
          url: buildUrl,
        },
        ]
      : []),
    {
      type: "Action.OpenUrl",
      title: "Get Release Lens",
      url: marketplaceUrl,
    },
  ];

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

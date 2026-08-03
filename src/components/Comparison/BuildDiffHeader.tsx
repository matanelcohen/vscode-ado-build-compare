import * as React from "react";
import {
  Badge,
  Body1,
  Caption1,
  Dropdown,
  Link,
  Option,
  Text,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { ArrowRightRegular } from "@fluentui/react-icons";
import { PipelineRun } from "../../api-sdk";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "stretch",
    gap: tokens.spacingHorizontalM,
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: tokens.colorNeutralForeground3,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", "var(--vscode-editorWidget-border)"),
    backgroundColor: "var(--vscode-editorWidget-background)",
    minWidth: 0,
  },
  cardTarget: {
    ...shorthands.border("1px", "solid", "var(--vscode-focusBorder)"),
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
  },
  hash: {
    fontFamily: tokens.fontFamilyMonospace,
    ...shorthands.padding("1px", "6px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    backgroundColor: "var(--vscode-textCodeBlock-background)",
  },
  message: {
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  direction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    color: tokens.colorNeutralForeground3,
  },
});

function formatFinishTime(run: PipelineRun): string {
  if (!run.finishTime) {
    return "In progress";
  }
  return new Date(run.finishTime).toLocaleString();
}

interface BuildSideProps {
  run: PipelineRun | null;
  emptyLabel: string;
  isTarget?: boolean;
}

const BuildSide: React.FC<BuildSideProps> = ({
  run,
  emptyLabel,
  isTarget,
}) => {
  const styles = useStyles();
  if (!run) {
    return (
      <div className={styles.card}>
        <Body1 className={styles.empty}>{emptyLabel}</Body1>
      </div>
    );
  }
  const message = run.commitMessage?.split("\n")[0];
  return (
    <div
      className={`${styles.card} ${isTarget ? styles.cardTarget : ""}`}
    >
      <div className={styles.cardHeader}>
        {run._links?.web?.href ? (
          <Link href={run._links.web.href} target="_blank" rel="noreferrer">
            <Text weight="semibold">{run.buildNumber}</Text>
          </Link>
        ) : (
          <Text weight="semibold">{run.buildNumber}</Text>
        )}
        {run.result && (
          <Badge
            appearance="tint"
            color={run.result === "2" ? "success" : "informative"}
          >
            {run.result === "2" ? "Succeeded" : run.result}
          </Badge>
        )}
      </div>
      <div className={styles.meta}>
        {run.sourceVersion && (
          <Caption1 className={styles.hash}>
            {run.sourceVersion.substring(0, 7)}
          </Caption1>
        )}
        <Caption1>{formatFinishTime(run)}</Caption1>
      </div>
      {message && (
        <Tooltip content={run.commitMessage ?? message} relationship="label">
          <Caption1 className={styles.message}>{message}</Caption1>
        </Tooltip>
      )}
    </div>
  );
};

interface BuildDiffHeaderProps {
  baseBuild: PipelineRun | null;
  targetBuild: PipelineRun | null;
  baseBuilds: PipelineRun[];
  targetBuilds: PipelineRun[];
  onSelectBase: (buildId: number) => void;
  onSelectTarget: (buildId: number) => void;
  disabled?: boolean;
  /** Renders read-only cards instead of dropdowns. */
  readOnly?: boolean;
}

/**
 * Presents the base and target builds as a single "from → to" unit with an
 * forward direction, shared by the diff bar and report skins.
 */
export const BuildDiffHeader: React.FC<BuildDiffHeaderProps> = ({
  baseBuild,
  targetBuild,
  baseBuilds,
  targetBuilds,
  onSelectBase,
  onSelectTarget,
  disabled,
  readOnly,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.column}>
        <Caption1 className={styles.label}>From (base)</Caption1>
        {!readOnly && (
          <Dropdown
            value={baseBuild?.buildNumber ?? ""}
            selectedOptions={baseBuild ? [String(baseBuild.id)] : []}
            onOptionSelect={(_, data) => {
              const id = Number(data.optionValue);
              if (Number.isInteger(id)) {
                onSelectBase(id);
              }
            }}
            disabled={disabled}
            aria-label="Base build"
          >
            {baseBuilds.map((build) => (
              <Option key={build.id} value={String(build.id)}>
                {build.buildNumber}
              </Option>
            ))}
          </Dropdown>
        )}
        <BuildSide run={baseBuild} emptyLabel="No base build available." />
      </div>

      <div className={styles.direction}>
        <ArrowRightRegular aria-hidden />
      </div>

      <div className={styles.column}>
        <Caption1 className={styles.label}>To (target)</Caption1>
        {!readOnly && (
          <Dropdown
            placeholder="Select a build to compare"
            value={targetBuild?.buildNumber ?? ""}
            selectedOptions={targetBuild ? [String(targetBuild.id)] : []}
            onOptionSelect={(_, data) => {
              const id = Number(data.optionValue);
              if (Number.isInteger(id)) {
                onSelectTarget(id);
              }
            }}
            disabled={disabled || targetBuilds.length === 0}
            aria-label="Target build"
          >
            {targetBuilds.map((build) => (
              <Option key={build.id} value={String(build.id)}>
                {build.buildNumber}
              </Option>
            ))}
          </Dropdown>
        )}
        <BuildSide
          run={targetBuild}
          emptyLabel="Select a newer build to compare."
          isTarget
        />
      </div>
    </div>
  );
};

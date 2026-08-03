import * as React from "react";
import {
  makeStyles,
  shorthands,
  Title3,
  Body1,
  Button,
} from "@fluentui/react-components";
import { ArrowClockwiseRegular, SettingsRegular } from "@fluentui/react-icons";
import { ProfileControls } from "../components/Comparison/ProfileControls";
import { EnvironmentDrift } from "../components/Comparison/EnvironmentDrift";
import { SkinPicker } from "../components/Comparison/SkinPicker";
import { useComparisonWorkspace } from "../hooks/useComparisonWorkspace";
import { AppearancePreferences } from "../models/appearance";
import { ComparisonSkin } from "../models/webviewState";
import {
  ClassicSkin,
  DiffBarSkin,
  ReportSkin,
  SkinProps,
  WorkbenchSkin,
} from "./skins";

const useStyles = makeStyles({
  root: {
    ...shorthands.padding("16px"),
    minWidth: "350px",
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    boxSizing: "border-box",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-editor-background)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  title: {
    color: "var(--vscode-foreground)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  errorText: {
    color: "var(--vscode-errorForeground)",
    backgroundColor: "var(--vscode-inputValidation-errorBackground)",
    ...shorthands.border(
      "1px",
      "solid",
      "var(--vscode-inputValidation-errorBorder)"
    ),
    ...shorthands.padding("10px"),
    ...shorthands.borderRadius("4px"),
  },
});

const skinComponents: Record<ComparisonSkin, React.FC<SkinProps>> = {
  classic: ClassicSkin,
  diffbar: DiffBarSkin,
  workbench: WorkbenchSkin,
  report: ReportSkin,
};

interface ComparisonPageProps {
  vscode: any;
  appearance: AppearancePreferences;
  onAppearanceChange: (patch: Partial<AppearancePreferences>) => void;
}

const contentMaxWidths: Record<AppearancePreferences["contentWidth"], string> = {
  focused: "1100px",
  wide: "1600px",
  full: "100%",
};

export const ComparisonPage: React.FC<ComparisonPageProps> = ({
  vscode,
  appearance,
  onAppearanceChange,
}) => {
  const styles = useStyles();
  const workspace = useComparisonWorkspace(vscode);
  const {
    profile,
    profiles,
    needsOnboarding,
    reloadConfiguration,
    loadComparison,
    isLoading,
    authLoading,
    comparisonLoading,
    currentError,
    skin,
    selectSkin,
    refresh,
    reset,
    openSettings,
  } = workspace;

  const SkinComponent = skinComponents[skin] ?? ClassicSkin;
  // The classic skin renders its own inline error banner below the tab list.
  const showHeaderError = Boolean(currentError) && skin === "classic";

  return (
    <div
      className={styles.root}
      style={{ maxWidth: contentMaxWidths[appearance.contentWidth] }}
    >
      <div className={styles.header}>
        <div>
          <Title3 as="h1" className={styles.title}>
            Release intelligence
          </Title3>
          <Body1>
            Understand what changed, why it matters, and whether it is ready to
            ship.
          </Body1>
        </div>
        <div className={styles.headerActions}>
          {profile && (
            <EnvironmentDrift
              activeProfile={profile}
              profiles={profiles}
              onCompared={loadComparison}
            />
          )}
          <SkinPicker
            skin={skin}
            onSelect={selectSkin}
            appearance={appearance}
            onAppearanceChange={onAppearanceChange}
          />
          <Button
            icon={<ArrowClockwiseRegular />}
            disabled={isLoading || comparisonLoading}
            onClick={() => {
              reset();
              refresh();
            }}
          >
            Refresh
          </Button>
          <Button icon={<SettingsRegular />} onClick={openSettings}>
            Settings
          </Button>
        </div>
      </div>

      {!authLoading && (
        <ProfileControls
          activeProfile={profile}
          profileCount={profiles.length}
          needsOnboarding={needsOnboarding}
          onChanged={() => {
            reset();
            reloadConfiguration();
          }}
        />
      )}

      {showHeaderError && (
        <Body1 className={styles.errorText}>{currentError}</Body1>
      )}

      <SkinComponent workspace={workspace} />
    </div>
  );
};

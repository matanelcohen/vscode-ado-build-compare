import * as React from "react";
import {
  Body1,
  Button,
  Caption1,
  Card,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Subtitle1,
  Switch,
  Title2,
  makeStyles,
  shorthands,
} from "@fluentui/react-components";
import {
  AddRegular,
  ArrowClockwiseRegular,
  CheckmarkCircleFilled,
  DeleteRegular,
} from "@fluentui/react-icons";
import {
  DiscoveredItem,
  setupActivateProfile,
  setupClose,
  setupDeleteProfile,
  setupInit,
  setupListPipelines,
  setupListProjects,
  setupListRepositories,
  setupListStages,
  setupSaveProfile,
} from "../api-sdk";
import type { PipelineProfile } from "../models/profile";
import {
  createSetupDraft,
  SetupDraft,
  SetupDraftErrors,
  suggestProfileName,
  validateSetupDraft,
} from "../models/setupDraft";

const useStyles = makeStyles({
  root: {
    display: "flex",
    ...shorthands.gap("24px"),
    ...shorthands.padding("24px"),
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-editor-background)",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    minWidth: "220px",
    flexGrow: 1,
    flexBasis: "220px",
    maxWidth: "300px",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
    flexGrow: 3,
    flexBasis: "480px",
    minWidth: "320px",
  },
  profileButton: {
    justifyContent: "flex-start",
    textAlign: "left",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
    ...shorthands.padding("16px"),
  },
  row: {
    display: "flex",
    ...shorthands.gap("12px"),
    flexWrap: "wrap",
  },
  actions: {
    display: "flex",
    ...shorthands.gap("8px"),
    flexWrap: "wrap",
    alignItems: "center",
  },
  error: {
    color: "var(--vscode-errorForeground)",
  },
  success: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("6px"),
  },
  grow: {
    flexGrow: 1,
    minWidth: "220px",
  },
});

type LoadingKey = "projects" | "repositories" | "pipelines" | "stages" | "save";

export const SetupPage: React.FC = () => {
  const styles = useStyles();
  const [draft, setDraft] = React.useState<SetupDraft>(() =>
    createSetupDraft(null)
  );
  const [profiles, setProfiles] = React.useState<PipelineProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(
    null
  );
  const [projects, setProjects] = React.useState<DiscoveredItem[]>([]);
  const [repositories, setRepositories] = React.useState<DiscoveredItem[]>([]);
  const [pipelines, setPipelines] = React.useState<DiscoveredItem[]>([]);
  const [stages, setStages] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState<LoadingKey | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);

  const errors: SetupDraftErrors = validateSetupDraft(draft);
  const visibleErrors: SetupDraftErrors = showErrors ? errors : {};

  const applyInit = React.useCallback(
    (payload: {
      draft: SetupDraft;
      profiles: PipelineProfile[];
      activeProfileId: string | null;
    }) => {
      setDraft(payload.draft);
      setProfiles(payload.profiles);
      setActiveProfileId(payload.activeProfileId);
      setProjects([]);
      setRepositories([]);
      setPipelines([]);
      setStages([]);
      setShowErrors(false);
      setStatus(null);
      setError(null);
    },
    []
  );

  React.useEffect(() => {
    let cancelled = false;
    void setupInit()
      .then((payload) => {
        if (!cancelled) {
          applyInit(payload);
        }
      })
      .catch((initError: Error) => {
        if (!cancelled) {
          setError(initError.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyInit]);

  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data?.command === "setup:reset" && event.data.payload) {
        applyInit(event.data.payload);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [applyInit]);

  const update = React.useCallback(
    (patch: Partial<SetupDraft>) => {
      setDraft((current) => ({ ...current, ...patch }));
      setStatus(null);
    },
    []
  );

  const run = React.useCallback(
    async <T,>(key: LoadingKey, action: () => Promise<T>): Promise<T | null> => {
      setLoading(key);
      setError(null);
      try {
        return await action();
      } catch (actionError: unknown) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : String(actionError)
        );
        return null;
      } finally {
        setLoading(null);
      }
    },
    []
  );

  const loadProjects = React.useCallback(async () => {
    const result = await run("projects", () =>
      setupListProjects(draft.organizationUrl)
    );
    if (result) {
      setProjects(result);
    }
  }, [draft.organizationUrl, run]);

  const loadRepositories = React.useCallback(
    async (projectName: string) => {
      const result = await run("repositories", () =>
        setupListRepositories(draft.organizationUrl, projectName)
      );
      if (result) {
        setRepositories(result);
      }
    },
    [draft.organizationUrl, run]
  );

  const loadPipelines = React.useCallback(
    async (projectName: string, repositoryId: string) => {
      const result = await run("pipelines", () =>
        setupListPipelines(draft.organizationUrl, projectName, repositoryId)
      );
      if (result) {
        setPipelines(result);
        if (result.length === 0) {
          setError(
            "No build pipelines were found for this repository. Select the repository used by the pipeline."
          );
        }
      }
    },
    [draft.organizationUrl, run]
  );

  const loadStages = React.useCallback(
    async (projectName: string, definitionId: number) => {
      const result = await run("stages", () =>
        setupListStages(draft.organizationUrl, projectName, definitionId)
      );
      if (result) {
        setStages(result);
      }
    },
    [draft.organizationUrl, run]
  );

  const onSelectProject = (projectName: string) => {
    update({
      projectName,
      repositoryId: "",
      repositoryName: "",
      pipelineDefinitionId: null,
      pipelineName: "",
      targetStageName: "",
    });
    setRepositories([]);
    setPipelines([]);
    setStages([]);
    void loadRepositories(projectName);
  };

  const onSelectRepository = (repository: DiscoveredItem) => {
    update({
      repositoryId: repository.id,
      repositoryName: repository.name,
      pipelineDefinitionId: null,
      pipelineName: "",
      targetStageName: "",
    });
    setPipelines([]);
    setStages([]);
    void loadPipelines(draft.projectName, repository.id);
  };

  const onSelectPipeline = (pipeline: DiscoveredItem) => {
    const definitionId = Number(pipeline.id);
    update({
      pipelineDefinitionId: definitionId,
      pipelineName: pipeline.name,
      targetStageName: "",
    });
    setStages([]);
    void loadStages(draft.projectName, definitionId);
  };

  const onSelectExistingProfile = (profile: PipelineProfile) => {
    applyInit({
      draft: createSetupDraft(profile),
      profiles,
      activeProfileId,
    });
  };

  const onSave = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) {
      return;
    }
    const result = await run("save", () => setupSaveProfile(draft));
    if (result) {
      setProfiles(result.snapshot.profiles);
      setActiveProfileId(result.snapshot.activeProfile?.id ?? null);
      setDraft(createSetupDraft(result.profile));
      setShowErrors(false);
      setStatus(`Saved "${result.profile.name}".`);
    }
  };

  const onDelete = async (profileId: string) => {
    const result = await run("save", () => setupDeleteProfile(profileId));
    if (result?.deleted) {
      setProfiles(result.snapshot.profiles);
      setActiveProfileId(result.snapshot.activeProfile?.id ?? null);
      if (draft.profileId === profileId) {
        setDraft(createSetupDraft(null));
      }
      setStatus("Profile deleted.");
    }
  };

  const onActivate = async (profileId: string) => {
    const result = await run("save", () => setupActivateProfile(profileId));
    if (result) {
      setProfiles(result.snapshot.profiles);
      setActiveProfileId(result.snapshot.activeProfile?.id ?? null);
      setStatus("Active profile updated.");
    }
  };

  const suggestedName = suggestProfileName(draft);

  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        <Subtitle1>Pipeline profiles</Subtitle1>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={() =>
            applyInit({ draft: createSetupDraft(null), profiles, activeProfileId })
          }
        >
          New profile
        </Button>
        {profiles.length === 0 ? (
          <Caption1>
            No profiles yet. Complete the guided setup to create your first one.
          </Caption1>
        ) : null}
        {profiles.map((profile) => (
          <Card key={profile.id} className={styles.section}>
            <Button
              appearance={
                draft.profileId === profile.id ? "primary" : "subtle"
              }
              className={styles.profileButton}
              onClick={() => onSelectExistingProfile(profile)}
            >
              {profile.name}
            </Button>
            <Caption1>
              {profile.config.projectName} · {profile.config.targetStageName}
            </Caption1>
            <div className={styles.actions}>
              {profile.id === activeProfileId ? (
                <Caption1 className={styles.success}>
                  <CheckmarkCircleFilled /> Active
                </Caption1>
              ) : (
                <Button
                  size="small"
                  appearance="subtle"
                  onClick={() => void onActivate(profile.id)}
                >
                  Set active
                </Button>
              )}
              <Button
                size="small"
                appearance="subtle"
                icon={<DeleteRegular />}
                onClick={() => void onDelete(profile.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.main}>
        <Title2>
          {draft.profileId ? "Edit pipeline profile" : "Connect Azure DevOps"}
        </Title2>
        <Body1>
          Discover your project, repository, pipeline, and deployment stage
          without leaving this page. Everything is stored locally in VS Code.
        </Body1>

        {error ? <Body1 className={styles.error}>{error}</Body1> : null}
        {status ? (
          <Body1 className={styles.success}>
            <CheckmarkCircleFilled /> {status}
          </Body1>
        ) : null}

        <Card className={styles.section}>
          <Subtitle1>1 · Organization</Subtitle1>
          <div className={styles.row}>
            <Field
              className={styles.grow}
              label="Azure DevOps organization URL"
              validationState={
                visibleErrors.organizationUrl ? "error" : "none"
              }
              {...(visibleErrors.organizationUrl
                ? { validationMessage: visibleErrors.organizationUrl }
                : {})}
            >
              <Input
                value={draft.organizationUrl}
                placeholder="https://dev.azure.com/your-organization"
                onChange={(_event, data) =>
                  update({ organizationUrl: data.value })
                }
              />
            </Field>
            <Button
              icon={<ArrowClockwiseRegular />}
              disabled={Boolean(errors.organizationUrl) || loading !== null}
              onClick={() => void loadProjects()}
            >
              Discover projects
            </Button>
          </div>
          {loading === "projects" ? <Spinner size="tiny" /> : null}
        </Card>

        <Card className={styles.section}>
          <Subtitle1>2 · Project and repository</Subtitle1>
          <Field
            label="Project"
            validationState={visibleErrors.projectName ? "error" : "none"}
            {...(visibleErrors.projectName
              ? { validationMessage: visibleErrors.projectName }
              : {})}
          >
            <Dropdown
              placeholder={
                projects.length
                  ? "Select a project"
                  : "Discover projects to continue"
              }
              value={draft.projectName}
              selectedOptions={draft.projectName ? [draft.projectName] : []}
              onOptionSelect={(_event, data) =>
                data.optionValue && onSelectProject(data.optionValue)
              }
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.name}>
                  {project.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field
            label="Repository"
            validationState={visibleErrors.repositoryId ? "error" : "none"}
            {...(visibleErrors.repositoryId
              ? { validationMessage: visibleErrors.repositoryId }
              : {})}
          >
            <Dropdown
              placeholder={
                repositories.length
                  ? "Select a repository"
                  : "Select a project first"
              }
              value={draft.repositoryName || draft.repositoryId}
              selectedOptions={draft.repositoryId ? [draft.repositoryId] : []}
              onOptionSelect={(_event, data) => {
                const repository = repositories.find(
                  (item) => item.id === data.optionValue
                );
                if (repository) {
                  onSelectRepository(repository);
                }
              }}
            >
              {repositories.map((repository) => (
                <Option key={repository.id} value={repository.id}>
                  {repository.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          {loading === "repositories" ? <Spinner size="tiny" /> : null}
        </Card>

        <Card className={styles.section}>
          <Subtitle1>3 · Pipeline and stage</Subtitle1>
          <Field
            label="Pipeline"
            validationState={
              visibleErrors.pipelineDefinitionId ? "error" : "none"
            }
            {...(visibleErrors.pipelineDefinitionId
              ? { validationMessage: visibleErrors.pipelineDefinitionId }
              : {})}
          >
            <Dropdown
              placeholder={
                pipelines.length
                  ? "Select a pipeline"
                  : "Select a repository first"
              }
              value={
                draft.pipelineName ||
                (draft.pipelineDefinitionId
                  ? `Pipeline ${draft.pipelineDefinitionId}`
                  : "")
              }
              selectedOptions={
                draft.pipelineDefinitionId
                  ? [String(draft.pipelineDefinitionId)]
                  : []
              }
              onOptionSelect={(_event, data) => {
                const pipeline = pipelines.find(
                  (item) => item.id === data.optionValue
                );
                if (pipeline) {
                  onSelectPipeline(pipeline);
                }
              }}
            >
              {pipelines.map((pipeline) => (
                <Option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          <Field
            label="Deployment stage"
            hint="Pick a discovered stage or type the stage name exactly as it appears in Azure DevOps."
            validationState={visibleErrors.targetStageName ? "error" : "none"}
            {...(visibleErrors.targetStageName
              ? { validationMessage: visibleErrors.targetStageName }
              : {})}
          >
            <Input
              value={draft.targetStageName}
              placeholder="Production"
              onChange={(_event, data) =>
                update({ targetStageName: data.value })
              }
            />
          </Field>
          {stages.length > 0 ? (
            <div className={styles.actions}>
              {stages.map((stage) => (
                <Button
                  key={stage}
                  size="small"
                  appearance={
                    draft.targetStageName === stage ? "primary" : "outline"
                  }
                  onClick={() => update({ targetStageName: stage })}
                >
                  {stage}
                </Button>
              ))}
            </div>
          ) : null}
          {loading === "pipelines" || loading === "stages" ? (
            <Spinner size="tiny" />
          ) : null}
        </Card>

        <Card className={styles.section}>
          <Subtitle1>4 · Details</Subtitle1>
          <Field
            label="Profile name"
            validationState={visibleErrors.name ? "error" : "none"}
            {...(visibleErrors.name
              ? { validationMessage: visibleErrors.name }
              : {})}
          >
            <Input
              value={draft.name}
              placeholder={suggestedName || "Production releases"}
              onChange={(_event, data) => update({ name: data.value })}
            />
          </Field>
          {suggestedName && draft.name !== suggestedName ? (
            <Button
              size="small"
              appearance="subtle"
              onClick={() => update({ name: suggestedName })}
            >
              Use suggested name: {suggestedName}
            </Button>
          ) : null}
          <Field
            label="Relevant path filters"
            hint="Optional. Separate multiple paths with commas."
          >
            <Input
              value={draft.relevantPathFilter}
              placeholder="/src/frontend, /packages/shared"
              onChange={(_event, data) =>
                update({ relevantPathFilter: data.value })
              }
            />
          </Field>
        </Card>

        <Card className={styles.section}>
          <Subtitle1>5 · Automatic Teams updates</Subtitle1>
          <Switch
            checked={draft.automationEnabled}
            label="Check for newer builds while VS Code is running and post through the configured Teams Workflow"
            onChange={(_event, data) =>
              update({ automationEnabled: data.checked })
            }
          />
          {draft.automationEnabled ? (
            <>
              <Field
                label="Check interval (minutes)"
                validationState={
                  visibleErrors.automationIntervalMinutes ? "error" : "none"
                }
                {...(visibleErrors.automationIntervalMinutes
                  ? {
                      validationMessage:
                        visibleErrors.automationIntervalMinutes,
                    }
                  : {})}
              >
                <Input
                  type="number"
                  min={5}
                  value={String(draft.automationIntervalMinutes)}
                  onChange={(_event, data) =>
                    update({
                      automationIntervalMinutes: Number(data.value),
                    })
                  }
                />
              </Field>
              <Field
                label="Mention UPNs"
                hint="Optional. Separate multiple UPNs with commas."
              >
                <Input
                  value={draft.automationMentionUpns}
                  placeholder="person@contoso.com"
                  onChange={(_event, data) =>
                    update({ automationMentionUpns: data.value })
                  }
                />
              </Field>
            </>
          ) : null}
        </Card>

        <div className={styles.actions}>
          <Button
            appearance="primary"
            disabled={loading !== null}
            onClick={() => void onSave()}
          >
            {draft.profileId ? "Save changes" : "Create profile"}
          </Button>
          <Button appearance="secondary" onClick={() => setupClose()}>
            Close
          </Button>
          {loading === "save" ? <Spinner size="tiny" /> : null}
        </div>
      </div>
    </div>
  );
};

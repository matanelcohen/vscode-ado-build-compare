import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import * as azdev from "azure-devops-node-api";
import {
  BuildStatus,
  TimelineRecordState,
} from "azure-devops-node-api/interfaces/BuildInterfaces";
import { AdcPipelineViewerConfig } from "../api-sdk";
import {
  isValidOrganizationUrl,
  PipelineProfile,
} from "../models/profile";
import { mapWithConcurrency } from "../utils/comparison";
import { ProfileStore } from "./ProfileStore";

const adoScope = "499b84ac-1321-427f-aa17-267ca6975798/.default";

interface NamedItem {
  id: string;
  name: string;
  description?: string;
}

interface NamedQuickPickItem extends vscode.QuickPickItem {
  item: NamedItem;
}

interface ProfileQuickPickItem extends vscode.QuickPickItem {
  profile: PipelineProfile;
}

export async function runSmartOnboarding(
  store: ProfileStore
): Promise<PipelineProfile | null> {
  const current = store.getSnapshot().activeProfile;
  const organizationUrl = await vscode.window.showInputBox({
    title: "Build Compare setup · 1/7",
    prompt: "Enter your Azure DevOps organization URL.",
    placeHolder: "https://dev.azure.com/your-organization",
    value: current?.config.organizationUrl ?? "",
    ignoreFocusOut: true,
    validateInput: validateOrganizationUrl,
  });
  if (!organizationUrl) {
    return null;
  }

  const session = await vscode.authentication.getSession(
    "microsoft",
    [adoScope],
    { createIfNone: true }
  );
  const connection = new azdev.WebApi(
    organizationUrl.trim().replace(/\/+$/, ""),
    azdev.getBearerHandler(session.accessToken)
  );

  const projects = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Discovering Azure DevOps projects...",
      cancellable: false,
    },
    async () => {
      const coreApi = await connection.getCoreApi();
      return coreApi.getProjects(undefined, 500);
    }
  );
  const project = await pickNamedItem(
    "Build Compare setup · 2/7",
    "Select an Azure DevOps project",
    projects
      .filter((item) => item.id && item.name)
      .map((item) => ({
        id: item.id ?? "",
        name: item.name ?? "",
        ...(item.description ? { description: item.description } : {}),
      }))
  );
  if (!project) {
    return null;
  }

  const gitApi = await connection.getGitApi();
  const repositories = await gitApi.getRepositories(project.id);
  const repository = await pickNamedItem(
    "Build Compare setup · 3/7",
    "Select the repository built by this pipeline",
    repositories
      .filter((item) => item.id && item.name && !item.isDisabled)
      .map((item) => ({
        id: item.id ?? "",
        name: item.name ?? "",
        ...(item.defaultBranch
          ? { description: `Default branch: ${item.defaultBranch}` }
          : {}),
      }))
  );
  if (!repository) {
    return null;
  }

  const buildApi = await connection.getBuildApi();
  const definitions = await buildApi.getDefinitions(
    project.id,
    undefined,
    repository.id,
    "TfsGit"
  );
  if (definitions.length === 0) {
    throw new Error(
      `No build pipelines were found for repository "${repository.name}". Select the repository used by the pipeline.`
    );
  }
  const definition = await pickNamedItem(
    "Build Compare setup · 4/7",
    "Select a build or deployment pipeline",
    definitions
      .filter((item) => item.id && item.name)
      .map((item) => ({
        id: String(item.id ?? 0),
        name: item.name ?? "",
        ...(item.path ? { description: item.path } : {}),
      }))
  );
  if (!definition) {
    return null;
  }

  const definitionId = Number(definition.id);
  const stageNames = await discoverStageNames(
    buildApi,
    project.id,
    definitionId
  );
  const targetStageName = await pickStage(stageNames);
  if (!targetStageName) {
    return null;
  }

  const relevantPathFilter = await vscode.window.showInputBox({
    title: "Build Compare setup · 6/7",
    prompt:
      "Optionally limit comparisons to repository paths. Separate multiple paths with commas.",
    placeHolder: "/src/frontend, /packages/shared",
    value: current?.config.relevantPathFilter ?? "",
    ignoreFocusOut: true,
  });
  if (relevantPathFilter === undefined) {
    return null;
  }

  const suggestedName = `${project.name} · ${definition.name} · ${targetStageName}`;
  const profileName = await vscode.window.showInputBox({
    title: "Build Compare setup · 7/7",
    prompt: "Name this pipeline profile.",
    value: suggestedName,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "Enter a profile name.",
  });
  if (!profileName) {
    return null;
  }

  const now = new Date().toISOString();
  const config: AdcPipelineViewerConfig = {
    organizationUrl: organizationUrl.trim().replace(/\/+$/, ""),
    projectName: project.name,
    pipelineDefinitionId: definitionId,
    targetStageName,
    repositoryId: repository.id,
    relevantPathFilter: relevantPathFilter.trim(),
  };
  const profile: PipelineProfile = {
    id: randomUUID(),
    name: profileName.trim(),
    config,
    createdAt: now,
    updatedAt: now,
  };
  await store.upsert(profile);
  return profile;
}

export async function pickActiveProfile(
  store: ProfileStore
): Promise<PipelineProfile | null> {
  const snapshot = store.getSnapshot();
  if (snapshot.profiles.length === 0) {
    return runSmartOnboarding(store);
  }
  const items: ProfileQuickPickItem[] = snapshot.profiles.map((profile) => ({
      label: profile.name,
      ...(profile.id === snapshot.activeProfile?.id
        ? { description: "Active" }
        : {}),
      detail: `${profile.config.projectName} · Pipeline ${profile.config.pipelineDefinitionId} · ${profile.config.targetStageName}`,
      profile,
    }));
  const picked = await vscode.window.showQuickPick<ProfileQuickPickItem>(
    items,
    {
      title: "Switch pipeline profile",
      placeHolder: "Choose the pipeline and environment to compare",
      ignoreFocusOut: true,
    }
  );
  if (!picked) {
    return null;
  }
  await store.setActive(picked.profile.id);
  return picked.profile;
}

export async function deletePipelineProfile(
  store: ProfileStore
): Promise<void> {
  const snapshot = store.getSnapshot();
  if (snapshot.profiles.length === 0) {
    vscode.window.showInformationMessage("There are no pipeline profiles.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    snapshot.profiles.map((profile) => ({
      label: profile.name,
      detail: `${profile.config.projectName} · ${profile.config.targetStageName}`,
      profile,
    })),
    {
      title: "Delete pipeline profile",
      placeHolder: "Select a profile to delete",
      ignoreFocusOut: true,
    }
  );
  if (!picked) {
    return;
  }
  const confirmed = await vscode.window.showWarningMessage(
    `Delete pipeline profile "${picked.profile.name}"?`,
    { modal: true },
    "Delete"
  );
  if (confirmed === "Delete") {
    await store.delete(picked.profile.id);
  }
}

export async function editPipelineProfile(
  store: ProfileStore
): Promise<PipelineProfile | null> {
  const snapshot = store.getSnapshot();
  const selected = await vscode.window.showQuickPick(
    snapshot.profiles.map((profile) => ({
      label: profile.name,
      detail: `${profile.config.projectName} · ${profile.config.targetStageName}`,
      profile,
    })),
    {
      title: "Edit pipeline profile",
      placeHolder: "Select a profile",
      ignoreFocusOut: true,
    }
  );
  if (!selected) {
    return null;
  }
  const name = await vscode.window.showInputBox({
    title: "Edit profile · 1/3",
    prompt: "Profile name",
    value: selected.profile.name,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "Enter a profile name.",
  });
  if (!name) {
    return null;
  }
  const stage = await vscode.window.showInputBox({
    title: "Edit profile · 2/3",
    prompt: "Deployment stage name",
    value: selected.profile.config.targetStageName,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "Enter a deployment stage.",
  });
  if (!stage) {
    return null;
  }
  const paths = await vscode.window.showInputBox({
    title: "Edit profile · 3/3",
    prompt: "Relevant path filters, separated by commas",
    value: selected.profile.config.relevantPathFilter ?? "",
    ignoreFocusOut: true,
  });
  if (paths === undefined) {
    return null;
  }
  const automationChoice = await vscode.window.showQuickPick(
    [
      {
        label: "Manual only",
        description: "Do not post comparisons automatically",
        enabled: false,
      },
      {
        label: "Automatic Teams updates",
        description:
          "Check for newer builds while VS Code is running and post through the configured Workflow",
        enabled: true,
      },
    ],
    {
      title: "Edit profile · Automation",
      placeHolder: "Choose notification behavior",
      ignoreFocusOut: true,
    }
  );
  if (!automationChoice) {
    return null;
  }
  let intervalMinutes = selected.profile.automation?.intervalMinutes ?? 15;
  let mentionUpns = selected.profile.automation?.mentionUpns ?? [];
  if (automationChoice.enabled) {
    const interval = await vscode.window.showInputBox({
      title: "Automatic Teams updates",
      prompt: "Check interval in minutes (minimum 5)",
      value: String(intervalMinutes),
      ignoreFocusOut: true,
      validateInput: (value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 5
          ? undefined
          : "Enter a whole number of at least 5.";
      },
    });
    if (!interval) {
      return null;
    }
    intervalMinutes = Number(interval);
    const mentions = await vscode.window.showInputBox({
      title: "Automatic Teams updates",
      prompt: "Optional UPNs to mention, separated by commas",
      value: mentionUpns.join(", "),
      ignoreFocusOut: true,
    });
    if (mentions === undefined) {
      return null;
    }
    mentionUpns = mentions
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const confirmed = await vscode.window.showWarningMessage(
      "Enable automatic Teams posts while VS Code is running?",
      { modal: true },
      "Enable"
    );
    if (confirmed !== "Enable") {
      return null;
    }
  }
  const updated: PipelineProfile = {
    ...selected.profile,
    name: name.trim(),
    config: {
      ...selected.profile.config,
      targetStageName: stage.trim(),
      relevantPathFilter: paths.trim(),
    },
    updatedAt: new Date().toISOString(),
    automation: {
      enabled: automationChoice.enabled,
      intervalMinutes,
      mentionUpns,
    },
  };
  await store.upsert(updated, false);
  return updated;
}

async function discoverStageNames(
  buildApi: Awaited<ReturnType<azdev.WebApi["getBuildApi"]>>,
  projectId: string,
  definitionId: number
): Promise<string[]> {
  const builds = await buildApi.getBuilds(
    projectId,
    [definitionId],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    BuildStatus.Completed,
    undefined,
    undefined,
    undefined,
    8
  );
  const timelines = await mapWithConcurrency(builds, 4, async (build) => {
    if (!build.id) {
      return [];
    }
    try {
      const timeline = await buildApi.getBuildTimeline(projectId, build.id);
      return (timeline.records ?? [])
        .filter(
          (record) =>
            record.type === "Stage" &&
            record.name &&
            record.state === TimelineRecordState.Completed
        )
        .map((record) => record.name ?? "");
    } catch {
      return [];
    }
  });
  return [...new Set(timelines.flat().filter(Boolean))].sort();
}

async function pickStage(stageNames: string[]): Promise<string | null> {
  const manualLabel = "$(edit) Enter a stage name manually";
  if (stageNames.length > 0) {
    const picked = await vscode.window.showQuickPick(
      [
        ...stageNames.map((name) => ({ label: name })),
        { label: manualLabel },
      ],
      {
        title: "Build Compare setup · 5/7",
        placeHolder: "Select the deployment stage to track",
        ignoreFocusOut: true,
      }
    );
    if (!picked) {
      return null;
    }
    if (picked.label !== manualLabel) {
      return picked.label;
    }
  }
  return (
    (await vscode.window.showInputBox({
      title: "Build Compare setup · 5/7",
      prompt: "Enter the deployment stage name exactly as it appears in ADO.",
      ignoreFocusOut: true,
      validateInput: (value) =>
        value.trim() ? undefined : "Enter a stage name.",
    }))?.trim() ?? null
  );
}

async function pickNamedItem(
  title: string,
  placeHolder: string,
  items: NamedItem[]
): Promise<NamedItem | null> {
  if (items.length === 0) {
    throw new Error(`No options were found for "${placeHolder}".`);
  }
  const quickPickItems: NamedQuickPickItem[] = items.map((item) => ({
      label: item.name,
      ...(item.description ? { description: item.description } : {}),
      item,
    }));
  const picked = await vscode.window.showQuickPick<NamedQuickPickItem>(
    quickPickItems,
    { title, placeHolder, ignoreFocusOut: true, matchOnDescription: true }
  );
  return picked?.item ?? null;
}

function validateOrganizationUrl(value: string): string | undefined {
  return isValidOrganizationUrl(value)
    ? undefined
    : "Use https://dev.azure.com/organization or https://organization.visualstudio.com.";
}

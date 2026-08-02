import * as vscode from "vscode";
import * as azdev from "azure-devops-node-api";
import {
  BuildStatus,
  TimelineRecordState,
} from "azure-devops-node-api/interfaces/BuildInterfaces";
import { isValidOrganizationUrl } from "../models/profile";
import { normalizeOrganizationUrlValue } from "../models/setupDraft";
import { mapWithConcurrency } from "../utils/comparison";

export const adoScope = "499b84ac-1321-427f-aa17-267ca6975798/.default";

export interface DiscoveredItem {
  id: string;
  name: string;
  description?: string;
}

export async function createDiscoveryConnection(
  organizationUrl: string
): Promise<azdev.WebApi> {
  if (!isValidOrganizationUrl(organizationUrl)) {
    throw new Error(
      "Use https://dev.azure.com/organization or https://organization.visualstudio.com."
    );
  }
  const session = await vscode.authentication.getSession(
    "microsoft",
    [adoScope],
    { createIfNone: true }
  );
  return new azdev.WebApi(
    normalizeOrganizationUrlValue(organizationUrl),
    azdev.getBearerHandler(session.accessToken)
  );
}

export async function listProjects(
  connection: azdev.WebApi
): Promise<DiscoveredItem[]> {
  const coreApi = await connection.getCoreApi();
  const projects = await coreApi.getProjects(undefined, 500);
  return projects
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: item.id ?? "",
      name: item.name ?? "",
      ...(item.description ? { description: item.description } : {}),
    }));
}

export async function listRepositories(
  connection: azdev.WebApi,
  projectId: string
): Promise<DiscoveredItem[]> {
  const gitApi = await connection.getGitApi();
  const repositories = await gitApi.getRepositories(projectId);
  return repositories
    .filter((item) => item.id && item.name && !item.isDisabled)
    .map((item) => ({
      id: item.id ?? "",
      name: item.name ?? "",
      ...(item.defaultBranch
        ? { description: `Default branch: ${item.defaultBranch}` }
        : {}),
    }));
}

export async function listPipelines(
  connection: azdev.WebApi,
  projectId: string,
  repositoryId: string
): Promise<DiscoveredItem[]> {
  const buildApi = await connection.getBuildApi();
  const definitions = await buildApi.getDefinitions(
    projectId,
    undefined,
    repositoryId,
    "TfsGit"
  );
  return definitions
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: String(item.id ?? 0),
      name: item.name ?? "",
      ...(item.path ? { description: item.path } : {}),
    }));
}

export async function listStageNames(
  connection: azdev.WebApi,
  projectId: string,
  definitionId: number
): Promise<string[]> {
  const buildApi = await connection.getBuildApi();
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

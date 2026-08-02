import * as vscode from "vscode";
import { buildDashboardRows, DashboardRow } from "../models/dashboard";
import { ComparisonHistoryStore } from "./ComparisonHistoryStore";
import { ProfileStore } from "./ProfileStore";

export class DashboardTreeProvider
  implements vscode.TreeDataProvider<DashboardRow>
{
  private readonly changeEmitter = new vscode.EventEmitter<
    DashboardRow | undefined
  >();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(
    private readonly profiles: ProfileStore,
    private readonly history: ComparisonHistoryStore,
    private readonly isTeamsConfigured: () => Promise<boolean>
  ) {}

  refresh(): void {
    this.changeEmitter.fire(undefined);
  }

  async getChildren(): Promise<DashboardRow[]> {
    const snapshot = this.profiles.getSnapshot();
    return buildDashboardRows(
      snapshot,
      snapshot.activeProfile
        ? this.history.get(snapshot.activeProfile.id)
        : [],
      await this.isTeamsConfigured()
    );
  }

  getTreeItem(row: DashboardRow): vscode.TreeItem {
    const item = new vscode.TreeItem(
      row.label,
      vscode.TreeItemCollapsibleState.None
    );
    item.id = row.id;
    if (row.description) {
      item.description = row.description;
    }
    item.iconPath = new vscode.ThemeIcon(row.icon);
    item.tooltip = row.description
      ? `${row.label} — ${row.description}`
      : row.label;
    item.command = {
      command: row.command,
      title: row.label,
      ...(row.arguments ? { arguments: row.arguments } : {}),
    };
    return item;
  }
}

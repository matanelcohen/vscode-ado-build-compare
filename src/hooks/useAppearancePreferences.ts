import * as React from "react";
import {
  AppearancePreferences,
  readAppearancePreferences,
} from "../models/appearance";

export function useAppearancePreferences(vscode: any): {
  appearance: AppearancePreferences;
  updateAppearance: (patch: Partial<AppearancePreferences>) => void;
} {
  const [appearance, setAppearance] = React.useState<AppearancePreferences>(() =>
    readAppearancePreferences(vscode.getState?.())
  );

  const updateAppearance = React.useCallback(
    (patch: Partial<AppearancePreferences>) => {
      setAppearance((current) => {
        const next = { ...current, ...patch };
        const persisted = vscode.getState?.() ?? {};
        vscode.setState?.({ ...persisted, appearance: next });
        return next;
      });
    },
    [vscode]
  );

  return { appearance, updateAppearance };
}

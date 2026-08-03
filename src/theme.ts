import {
  teamsHighContrastTheme,
  Theme,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import { ColorTheme, Density } from "./models/appearance";

type ThemeCssVariables = Record<`--${string}`, string>;

export interface ResolvedAppearanceTheme {
  fluentTheme: Theme;
  cssVariables: ThemeCssVariables;
}

const darkVariables: ThemeCssVariables = {
  "--vscode-editor-background": "#111827",
  "--vscode-foreground": "#f3f4f6",
  "--vscode-descriptionForeground": "#aeb8c8",
  "--vscode-editorWidget-background": "#182235",
  "--vscode-editorWidget-border": "#34435a",
  "--vscode-textBlockQuote-background": "#182235",
  "--vscode-textBlockQuote-border": "#53647d",
  "--vscode-textBlockQuote-foreground": "#f3f4f6",
  "--vscode-textCodeBlock-background": "#0b1220",
  "--vscode-list-hoverBackground": "#24324a",
  "--vscode-list-activeSelectionForeground": "#ffffff",
  "--vscode-errorForeground": "#ffb4ab",
  "--vscode-inputValidation-errorBackground": "#3b1219",
  "--vscode-inputValidation-errorBorder": "#f87171",
};

const paletteDefinitions: Record<
  Exclude<ColorTheme, "system">,
  {
    base: Theme;
    variables: ThemeCssVariables;
    accent: string;
    accentHover: string;
    selection: string;
  }
> = {
  light: {
    base: webLightTheme,
    accent: "#0f6cbd",
    accentHover: "#115ea3",
    selection: "#0f6cbd",
    variables: {
      "--vscode-editor-background": "#ffffff",
      "--vscode-foreground": "#242424",
      "--vscode-descriptionForeground": "#616161",
      "--vscode-editorWidget-background": "#f8f8f8",
      "--vscode-editorWidget-border": "#d1d1d1",
      "--vscode-textBlockQuote-background": "#f5f5f5",
      "--vscode-textBlockQuote-border": "#b3b3b3",
      "--vscode-textBlockQuote-foreground": "#242424",
      "--vscode-textCodeBlock-background": "#f1f1f1",
      "--vscode-list-hoverBackground": "#ebebeb",
      "--vscode-list-activeSelectionForeground": "#ffffff",
      "--vscode-errorForeground": "#b10e1c",
      "--vscode-inputValidation-errorBackground": "#fde7e9",
      "--vscode-inputValidation-errorBorder": "#d13438",
    },
  },
  dark: {
    base: webDarkTheme,
    accent: "#479ef5",
    accentHover: "#62abf5",
    selection: "#0f6cbd",
    variables: darkVariables,
  },
  highContrast: {
    base: teamsHighContrastTheme,
    accent: "#ffff00",
    accentHover: "#ffffff",
    selection: "#1aebff",
    variables: {
      ...darkVariables,
      "--vscode-editor-background": "#000000",
      "--vscode-foreground": "#ffffff",
      "--vscode-descriptionForeground": "#ffffff",
      "--vscode-editorWidget-background": "#000000",
      "--vscode-editorWidget-border": "#ffffff",
      "--vscode-textBlockQuote-background": "#000000",
      "--vscode-textBlockQuote-border": "#ffffff",
      "--vscode-textCodeBlock-background": "#000000",
      "--vscode-list-hoverBackground": "#1a1a1a",
    },
  },
  azure: {
    base: webDarkTheme,
    accent: "#4cc2ff",
    accentHover: "#75d1ff",
    selection: "#0078d4",
    variables: {
      ...darkVariables,
      "--vscode-editor-background": "#07182d",
      "--vscode-editorWidget-background": "#0d2542",
      "--vscode-editorWidget-border": "#244d75",
      "--vscode-textBlockQuote-background": "#0d2542",
      "--vscode-textCodeBlock-background": "#04101f",
      "--vscode-list-hoverBackground": "#15385d",
    },
  },
  emerald: {
    base: webDarkTheme,
    accent: "#34d399",
    accentHover: "#6ee7b7",
    selection: "#047857",
    variables: {
      ...darkVariables,
      "--vscode-editor-background": "#071c17",
      "--vscode-editorWidget-background": "#0d2a23",
      "--vscode-editorWidget-border": "#285648",
      "--vscode-textBlockQuote-background": "#0d2a23",
      "--vscode-textCodeBlock-background": "#04130f",
      "--vscode-list-hoverBackground": "#153c31",
    },
  },
  purple: {
    base: webDarkTheme,
    accent: "#c4b5fd",
    accentHover: "#ddd6fe",
    selection: "#7c3aed",
    variables: {
      ...darkVariables,
      "--vscode-editor-background": "#171128",
      "--vscode-editorWidget-background": "#241a3b",
      "--vscode-editorWidget-border": "#4a3a6b",
      "--vscode-textBlockQuote-background": "#241a3b",
      "--vscode-textCodeBlock-background": "#0f0a1c",
      "--vscode-list-hoverBackground": "#332650",
    },
  },
};

const densityScale: Record<Density, number> = {
  compact: 0.78,
  comfortable: 1,
  spacious: 1.24,
};

function scaleSpacing(value: string, scale: number): string {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? `${Math.max(2, Math.round(pixels * scale))}px` : value;
}

function withDensity(theme: Theme, density: Density): Theme {
  const scale = densityScale[density];
  if (scale === 1) {
    return theme;
  }

  return {
    ...theme,
    spacingHorizontalXXS: scaleSpacing(theme.spacingHorizontalXXS, scale),
    spacingHorizontalXS: scaleSpacing(theme.spacingHorizontalXS, scale),
    spacingHorizontalSNudge: scaleSpacing(theme.spacingHorizontalSNudge, scale),
    spacingHorizontalS: scaleSpacing(theme.spacingHorizontalS, scale),
    spacingHorizontalMNudge: scaleSpacing(theme.spacingHorizontalMNudge, scale),
    spacingHorizontalM: scaleSpacing(theme.spacingHorizontalM, scale),
    spacingHorizontalL: scaleSpacing(theme.spacingHorizontalL, scale),
    spacingHorizontalXL: scaleSpacing(theme.spacingHorizontalXL, scale),
    spacingHorizontalXXL: scaleSpacing(theme.spacingHorizontalXXL, scale),
    spacingHorizontalXXXL: scaleSpacing(theme.spacingHorizontalXXXL, scale),
    spacingVerticalXXS: scaleSpacing(theme.spacingVerticalXXS, scale),
    spacingVerticalXS: scaleSpacing(theme.spacingVerticalXS, scale),
    spacingVerticalSNudge: scaleSpacing(theme.spacingVerticalSNudge, scale),
    spacingVerticalS: scaleSpacing(theme.spacingVerticalS, scale),
    spacingVerticalMNudge: scaleSpacing(theme.spacingVerticalMNudge, scale),
    spacingVerticalM: scaleSpacing(theme.spacingVerticalM, scale),
    spacingVerticalL: scaleSpacing(theme.spacingVerticalL, scale),
    spacingVerticalXL: scaleSpacing(theme.spacingVerticalXL, scale),
    spacingVerticalXXL: scaleSpacing(theme.spacingVerticalXXL, scale),
    spacingVerticalXXXL: scaleSpacing(theme.spacingVerticalXXXL, scale),
  };
}

export function resolveAppearanceTheme(
  colorTheme: ColorTheme,
  density: Density,
  vscodeTheme: Theme
): ResolvedAppearanceTheme {
  if (colorTheme === "system") {
    return {
      fluentTheme: withDensity(vscodeTheme, density),
      cssVariables: {},
    };
  }

  const palette = paletteDefinitions[colorTheme];
  const fluentTheme: Theme = {
    ...palette.base,
    colorBrandForeground1: palette.accent,
    colorBrandForeground2: palette.accent,
    colorBrandBackground: palette.selection,
    colorBrandBackgroundHover: palette.selection,
    colorBrandBackgroundPressed: palette.selection,
    colorBrandStroke1: palette.accent,
    ...(colorTheme === "highContrast"
      ? { colorNeutralForegroundOnBrand: "#000000" }
      : {}),
  };

  return {
    fluentTheme: withDensity(fluentTheme, density),
    cssVariables: {
      ...palette.variables,
      "--vscode-focusBorder": palette.accent,
      "--vscode-textLink-foreground": palette.accent,
      "--vscode-textLink-activeForeground": palette.accentHover,
      "--vscode-list-activeSelectionBackground": palette.selection,
    },
  };
}

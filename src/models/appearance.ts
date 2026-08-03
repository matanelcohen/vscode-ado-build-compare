export const colorThemes = [
  "system",
  "light",
  "dark",
  "highContrast",
  "azure",
  "emerald",
  "purple",
] as const;

export type ColorTheme = (typeof colorThemes)[number];

export const densityOptions = ["compact", "comfortable", "spacious"] as const;
export type Density = (typeof densityOptions)[number];

export const contentWidths = ["focused", "wide", "full"] as const;
export type ContentWidth = (typeof contentWidths)[number];

export interface AppearancePreferences {
  colorTheme: ColorTheme;
  density: Density;
  contentWidth: ContentWidth;
}

export const defaultAppearancePreferences: AppearancePreferences = {
  colorTheme: "system",
  density: "comfortable",
  contentWidth: "wide",
};

export interface AppearanceOptionDescriptor<T extends string> {
  id: T;
  label: string;
  description: string;
  swatch?: string;
}

export const colorThemeDescriptors: readonly AppearanceOptionDescriptor<ColorTheme>[] =
  [
    {
      id: "system",
      label: "Follow VS Code",
      description: "Automatically match the active editor theme.",
      swatch: "linear-gradient(135deg, #f5f5f5 50%, #1f1f1f 50%)",
    },
    {
      id: "light",
      label: "Light",
      description: "Bright, neutral workspace.",
      swatch: "#ffffff",
    },
    {
      id: "dark",
      label: "Dark",
      description: "Low-glare neutral workspace.",
      swatch: "#1f1f1f",
    },
    {
      id: "highContrast",
      label: "High contrast",
      description: "Maximum contrast and strong boundaries.",
      swatch: "#000000",
    },
    {
      id: "azure",
      label: "Azure",
      description: "Deep blue with a vivid Azure accent.",
      swatch: "#0078d4",
    },
    {
      id: "emerald",
      label: "Emerald",
      description: "Dark green workspace with a fresh accent.",
      swatch: "#10b981",
    },
    {
      id: "purple",
      label: "Purple",
      description: "Deep violet workspace with a purple accent.",
      swatch: "#8b5cf6",
    },
  ];

export const densityDescriptors: readonly AppearanceOptionDescriptor<Density>[] =
  [
    {
      id: "compact",
      label: "Compact",
      description: "Fit more release data on screen.",
    },
    {
      id: "comfortable",
      label: "Comfortable",
      description: "Balanced spacing for everyday use.",
    },
    {
      id: "spacious",
      label: "Spacious",
      description: "More breathing room and larger sections.",
    },
  ];

export const contentWidthDescriptors: readonly AppearanceOptionDescriptor<ContentWidth>[] =
  [
    {
      id: "focused",
      label: "Focused",
      description: "Keep content in a readable 1100px column.",
    },
    {
      id: "wide",
      label: "Wide",
      description: "Use up to 1600px for detailed comparisons.",
    },
    {
      id: "full",
      label: "Full width",
      description: "Use all available editor space.",
    },
  ];

function readOption<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}

export function readAppearancePreferences(
  value: unknown
): AppearancePreferences {
  const appearance =
    typeof value === "object" &&
    value !== null &&
    "appearance" in value &&
    typeof (value as { appearance?: unknown }).appearance === "object" &&
    (value as { appearance?: unknown }).appearance !== null
      ? (value as { appearance: Record<string, unknown> }).appearance
      : {};

  return {
    colorTheme: readOption(
      appearance.colorTheme,
      colorThemes,
      defaultAppearancePreferences.colorTheme
    ),
    density: readOption(
      appearance.density,
      densityOptions,
      defaultAppearancePreferences.density
    ),
    contentWidth: readOption(
      appearance.contentWidth,
      contentWidths,
      defaultAppearancePreferences.contentWidth
    ),
  };
}

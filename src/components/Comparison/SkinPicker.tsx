import * as React from "react";
import {
  Menu,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuButton,
  Tooltip,
} from "@fluentui/react-components";
import { ColorRegular } from "@fluentui/react-icons";
import {
  AppearancePreferences,
  colorThemeDescriptors,
  contentWidthDescriptors,
  densityDescriptors,
} from "../../models/appearance";
import {
  ComparisonSkin,
  comparisonSkinDescriptors,
} from "../../models/webviewState";

interface SkinPickerProps {
  skin: ComparisonSkin;
  onSelect: (skin: ComparisonSkin) => void;
  appearance: AppearancePreferences;
  onAppearanceChange: (patch: Partial<AppearancePreferences>) => void;
}

/** Controls the workspace layout, palette, density, and usable content width. */
export const SkinPicker: React.FC<SkinPickerProps> = ({
  skin,
  onSelect,
  appearance,
  onAppearanceChange,
}) => {
  return (
    <Menu
      checkedValues={{
        skin: [skin],
        colorTheme: [appearance.colorTheme],
        density: [appearance.density],
        contentWidth: [appearance.contentWidth],
      }}
      onCheckedValueChange={(_event, data) => {
        const next = data.checkedItems[0];
        if (!next) {
          return;
        }
        if (data.name === "skin") {
          onSelect(next as ComparisonSkin);
        } else if (data.name === "colorTheme") {
          onAppearanceChange({
            colorTheme: next as AppearancePreferences["colorTheme"],
          });
        } else if (data.name === "density") {
          onAppearanceChange({
            density: next as AppearancePreferences["density"],
          });
        } else if (data.name === "contentWidth") {
          onAppearanceChange({
            contentWidth: next as AppearancePreferences["contentWidth"],
          });
        }
      }}
    >
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content="Customize workspace appearance" relationship="label">
          <MenuButton icon={<ColorRegular />} appearance="subtle">
            Appearance
          </MenuButton>
        </Tooltip>
      </MenuTrigger>
      <MenuPopover style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <MenuList>
          <MenuGroup>
            <MenuGroupHeader>Layout</MenuGroupHeader>
            {comparisonSkinDescriptors.map((descriptor) => (
              <MenuItemRadio
                key={descriptor.id}
                name="skin"
                value={descriptor.id}
                secondaryContent={descriptor.description}
              >
                {descriptor.label}
              </MenuItemRadio>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuGroupHeader>Color theme</MenuGroupHeader>
            {colorThemeDescriptors.map((descriptor) => (
              <MenuItemRadio
                key={descriptor.id}
                name="colorTheme"
                value={descriptor.id}
                icon={
                  <span
                    aria-hidden="true"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "1px solid currentColor",
                      background: descriptor.swatch,
                    }}
                  />
                }
                secondaryContent={descriptor.description}
              >
                {descriptor.label}
              </MenuItemRadio>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuGroupHeader>Density</MenuGroupHeader>
            {densityDescriptors.map((descriptor) => (
              <MenuItemRadio
                key={descriptor.id}
                name="density"
                value={descriptor.id}
              >
                {descriptor.label}
              </MenuItemRadio>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuGroupHeader>Content width</MenuGroupHeader>
            {contentWidthDescriptors.map((descriptor) => (
              <MenuItemRadio
                key={descriptor.id}
                name="contentWidth"
                value={descriptor.id}
              >
                {descriptor.label}
              </MenuItemRadio>
            ))}
          </MenuGroup>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

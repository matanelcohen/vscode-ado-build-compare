import * as React from "react";
import {
  Menu,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuButton,
  Tooltip,
} from "@fluentui/react-components";
import { PaintBrushRegular } from "@fluentui/react-icons";
import {
  ComparisonSkin,
  comparisonSkinDescriptors,
} from "../../models/webviewState";

interface SkinPickerProps {
  skin: ComparisonSkin;
  onSelect: (skin: ComparisonSkin) => void;
}

/** Lets the user switch between the available comparison layouts (skins). */
export const SkinPicker: React.FC<SkinPickerProps> = ({ skin, onSelect }) => {
  const active = comparisonSkinDescriptors.find(
    (descriptor) => descriptor.id === skin
  );

  return (
    <Menu
      checkedValues={{ skin: [skin] }}
      onCheckedValueChange={(_event, data) => {
        const next = data.checkedItems[0] as ComparisonSkin | undefined;
        if (next) {
          onSelect(next);
        }
      }}
    >
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content="Change the layout of this view" relationship="label">
          <MenuButton icon={<PaintBrushRegular />} appearance="subtle">
            {active?.label ?? "Layout"}
          </MenuButton>
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
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
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

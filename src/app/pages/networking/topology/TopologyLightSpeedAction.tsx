import type { ReactNode } from "react";
import { Button } from "@patternfly/react-core";
import RhUiAiCreateIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-ai-create-icon";
import RhUiAiInfoIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-ai-info-icon";
import RhUiAiTroubleshootIcon from "@patternfly/react-icons/dist/esm/icons/rh-ui-ai-troubleshoot-icon";
import { useTopologyLightspeed } from "./useTopologyLightspeed";

type TopologyLightSpeedActionProps = {
  contextKey: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "link";
  size?: "sm" | "md";
  intent?: "troubleshoot" | "create" | "analyze";
  className?: string;
  isInline?: boolean;
};

const INTENT_ICON = {
  troubleshoot: RhUiAiTroubleshootIcon,
  create: RhUiAiCreateIcon,
  analyze: RhUiAiInfoIcon,
} as const;

/** Contextual entry to OpenShift LightSpeed from the networking topology UI. */
export function TopologyLightSpeedAction({
  contextKey,
  children,
  variant = "secondary",
  size = "sm",
  intent = "troubleshoot",
  className,
  isInline = false,
}: TopologyLightSpeedActionProps) {
  const { openTopologyLightspeed } = useTopologyLightspeed();
  const Icon = INTENT_ICON[intent];

  return (
    <Button
      variant={variant}
      size={size}
      isInline={isInline}
      className={className}
      icon={<Icon aria-hidden />}
      onClick={() => openTopologyLightspeed(contextKey)}
    >
      {children}
    </Button>
  );
}

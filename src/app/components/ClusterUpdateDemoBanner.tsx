import {
  Banner,
  Button,
  Content,
  Flex,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import { useLocation } from "react-router";
import { useClusterUpdateDemoVariant } from "../contexts/ClusterUpdateDemoContext";

/** Sits above the masthead on Cluster Update routes; variant toggle is shared via context. */
export default function ClusterUpdateDemoBanner() {
  const { pathname } = useLocation();
  const { demoVariant, setDemoVariant, performClusterUpdateDemoReset } = useClusterUpdateDemoVariant();

  if (!pathname.startsWith("/administration/cluster-update")) {
    return null;
  }

  return (
    <Banner status="info" aria-label="Prototype demo">
      <Flex
        justifyContent={{ default: "justifyContentSpaceBetween" }}
        alignItems={{ default: "alignItemsCenter" }}
        gap={{ default: "gapMd" }}
        flexWrap={{ default: "wrap" }}
      >
        <Content
          component="p"
          style={{
            margin: 0,
            fontSize: "var(--pf-t--global--FontSize--xs)",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "var(--pf-t--global--text--Color--200)",
          }}
        >
          Prototype demo
        </Content>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
          <ToggleGroup aria-label="Cluster update experience variant" isCompact>
            <ToggleGroupItem
              text="Agent-led"
              isSelected={demoVariant === "agent-only"}
              onChange={(_event, selected) => {
                if (selected) setDemoVariant("agent-only");
              }}
            />
            <ToggleGroupItem
              text="Manual updates"
              isSelected={demoVariant === "manual-and-agent"}
              onChange={(_event, selected) => {
                if (selected) setDemoVariant("manual-and-agent");
              }}
            />
          </ToggleGroup>
          <Button variant="link" isInline onClick={() => performClusterUpdateDemoReset()}>
            Reset demo
          </Button>
        </Flex>
      </Flex>
    </Banner>
  );
}

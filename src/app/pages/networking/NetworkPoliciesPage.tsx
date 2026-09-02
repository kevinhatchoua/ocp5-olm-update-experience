import { useState } from "react";
import { Content, Flex, Tab, Tabs, TabTitleText } from "@patternfly/react-core";
import PrototypeCreateButton from "../../components/prototype/PrototypeCreateButton";
import { NetworkingEmptyState, NetworkingPageShell } from "./networkingShared";

export default function NetworkPoliciesPage() {
  const [activeTab, setActiveTab] = useState("networkpolicies");

  return (
    <NetworkingPageShell
      title="NetworkPolicies"
      path="/networking/networkpolicies"
      createLabel="Create NetworkPolicy"
      createTo="/networking/networkpolicies/create"
      extraHeader={
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(String(key))}
          aria-label="Network policy types"
        >
          <Tab eventKey="networkpolicies" title={<TabTitleText>NetworkPolicies</TabTitleText>} />
          <Tab eventKey="multinetworkpolicies" title={<TabTitleText>MultiNetworkPolicies</TabTitleText>} />
        </Tabs>
      }
    >
      {activeTab === "networkpolicies" ? (
        <NetworkingEmptyState
          title="No NetworkPolicy found"
          description="Click Create NetworkPolicy to create your first NetworkPolicy"
          createLabel="Create NetworkPolicy"
          learnMoreHref="https://docs.openshift.com/container-platform/latest/networking/network_policy/about-network-policy.html"
          learnMoreLabel="Learn more about NetworkPolicy"
        />
      ) : (
        <div className="ocs-nodes-list__table-wrap ocs-networking-empty">
          <Flex
            direction={{ default: "column" }}
            alignItems={{ default: "alignItemsCenter" }}
            className="pf-v6-u-py-3xl"
            gap={{ default: "gapMd" }}
          >
            <Content component="p" className="pf-v6-u-text-align-center">
              No MultiNetworkPolicy found
            </Content>
            <PrototypeCreateButton>Create MultiNetworkPolicy</PrototypeCreateButton>
          </Flex>
        </div>
      )}
    </NetworkingPageShell>
  );
}

import {
  Alert,
  Button,
  Content,
  Flex,
  Label,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { GITOPS_AGENT_SPOKES } from "./gitopsData";
import { GitOpsEditDeleteMenu, ResourceName } from "./gitopsShared";

export default function GitOpsAgentSpokesPage() {
  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Connected Agents", path: "/gitops/agents" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                Connected Agents
              </Title>
              <FavoriteButton name="Connected Agents" path="/gitops/agents" />
            </Flex>
            <Button variant="primary">Connect agent</Button>
          </Flex>

          <Alert
            variant="info"
            isInline
            title="Credential material (JWT/TLS) is never shown — status and health only."
          />

          <Content component="p" className="pf-v6-u-color-200">
            Hub-and-spoke connection status and sync mode (GITOPS-10917). Application sync-error
            messaging stays with existing Agent clarity patterns (HPUX-1431) — this page does not
            replace that UX.
          </Content>

          <OcsNamedResourceDataView
            ouiaId="gitops-agents-data-view"
            ariaLabel="Connected Agents"
            itemsLabel="agents"
            items={GITOPS_AGENT_SPOKES}
            getName={(item) => item.name}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Spoke name">
                      <PlainTableHeader label="Spoke name" />
                    </Th>
                    <Th dataLabel="Cluster">
                      <PlainTableHeader label="Cluster" />
                    </Th>
                    <Th dataLabel="Connection">
                      <PlainTableHeader label="Connection" />
                    </Th>
                    <Th dataLabel="Sync mode">
                      <PlainTableHeader label="Sync mode" />
                    </Th>
                    <Th dataLabel="Last heartbeat">
                      <PlainTableHeader label="Last heartbeat" />
                    </Th>
                    <Th dataLabel="Reconnections">
                      <PlainTableHeader label="Reconnections" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((item) => (
                    <Tr key={item.name}>
                      <Td dataLabel="Spoke name">
                        <ResourceName kind="Agent" name={item.name} />
                      </Td>
                      <Td dataLabel="Cluster">{item.cluster}</Td>
                      <Td dataLabel="Connection">
                        <Label
                          color={item.connection === "Connected" ? "green" : "red"}
                          isCompact
                        >
                          {item.connection}
                        </Label>
                      </Td>
                      <Td dataLabel="Sync mode">{item.syncMode}</Td>
                      <Td dataLabel="Last heartbeat">{item.lastHeartbeat}</Td>
                      <Td dataLabel="Reconnections">{item.reconnections}</Td>
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <GitOpsEditDeleteMenu kind="Agent" name={item.name} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

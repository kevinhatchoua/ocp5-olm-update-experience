import { useMemo, useState } from "react";
import {
  Button,
  Content,
  Flex,
  Label,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { CreateNncpModal } from "./networkingCreateModals";
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { useNetworkingResources } from "./useNetworkingResources";

function nncpName(row: { name: string }) {
  return row.name;
}

export default function NodeNetworkConfigurationPolicyPage() {
  const { nncpRecords } = useNetworkingResources();
  const [createOpen, setCreateOpen] = useState(false);

  const sorted = useMemo(
    () => [...nncpRecords].sort((a, b) => a.name.localeCompare(b.name)),
    [nncpRecords]
  );

  return (
    <>
      <NetworkingPageShell
        title="NodeNetworkConfigurationPolicy"
        path="/networking/nodenetworkconfigurationpolicy"
        createButton={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create NodeNetworkConfigurationPolicy
          </Button>
        }
      >
        {nncpRecords.length === 0 ? (
          <div className="ocs-nnodes-policy-empty">
            <Flex
              direction={{ default: "column" }}
              alignItems={{ default: "alignItemsCenter" }}
              gap={{ default: "gapLg" }}
              className="pf-v6-u-py-3xl"
            >
              <div className="ocs-nnodes-policy-empty__illustration" aria-hidden />
              <Content component="h2" className="ocs-nnodes-policy-empty__title">
                No NodeNetworkConfigurationPolicy found
              </Content>
              <Content component="p" className="ocs-nnodes-policy-empty__desc">
                Click Create NodeNetworkConfigurationPolicy to create your first policy
              </Content>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                Create NodeNetworkConfigurationPolicy
              </Button>
              <Button
                variant="link"
                isInline
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
                component="a"
                href="https://docs.openshift.com/container-platform/latest/networking/k8s_nic_configuration/k8s-nic-configuration.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                View documentation
              </Button>
            </Flex>
          </div>
        ) : (
          <NetworkingTablePanel>
            <OcsNamedResourceDataView
              ouiaId="nncp-data-view"
              ariaLabel="NodeNetworkConfigurationPolicies"
              itemsLabel="policies"
              items={sorted}
              getName={nncpName}
              defaultPerPage={10}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="Status">
                        <PlainTableHeader label="Status" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((row) => (
                      <Tr key={row.name}>
                        <Td dataLabel="Name">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Label color="purple" isCompact className="ocs-resource-label">
                              NNCP
                            </Label>
                            <Content>{row.name}</Content>
                          </Flex>
                        </Td>
                        <Td dataLabel="Status">
                          <Label color="blue" isCompact>
                            {row.status}
                          </Label>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          </NetworkingTablePanel>
        )}
      </NetworkingPageShell>
      <CreateNncpModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => setCreateOpen(false)} />
    </>
  );
}

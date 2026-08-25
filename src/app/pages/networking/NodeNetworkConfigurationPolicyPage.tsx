import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { useToast } from "../../contexts/ToastContext";
import { CreateNncpModal } from "./networkingCreateModals";
import {
  deleteNncp,
  nncpDetailPath,
  nncpTopologyHighlightId,
  topologyHighlightPath,
  type NncpRecord,
} from "./networkingMockData";
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { useNetworkingResources } from "./useNetworkingResources";

function nncpName(row: { name: string }) {
  return row.name;
}

function NncpActionsMenu({
  row,
  onRequestDelete,
}: {
  row: NncpRecord;
  onRequestDelete: (row: NncpRecord) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const detailPath = nncpDetailPath(row.name);
  const topologyPath = topologyHighlightPath(nncpTopologyHighlightId(row.name));

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={`Actions for ${row.name}`}
          onClick={() => setOpen((v) => !v)}
          icon={<EllipsisVIcon />}
        />
      )}
    >
      <DropdownList>
        <DropdownItem itemId="edit" onClick={() => navigate(detailPath)}>
          Edit
        </DropdownItem>
        <DropdownItem itemId="edit-yaml" onClick={() => navigate(`${detailPath}?tab=yaml`)}>
          Edit YAML
        </DropdownItem>
        <DropdownItem itemId="view-topology" onClick={() => navigate(topologyPath)}>
          View in Topology
        </DropdownItem>
        <DropdownItem itemId="delete" isDanger onClick={() => onRequestDelete(row)}>
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

export default function NodeNetworkConfigurationPolicyPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { nncpRecords } = useNetworkingResources();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NncpRecord | null>(null);

  const sorted = useMemo(
    () => [...nncpRecords].sort((a, b) => a.name.localeCompare(b.name)),
    [nncpRecords]
  );

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { name } = pendingDelete;
    const deleted = deleteNncp(name);
    setPendingDelete(null);
    if (deleted) {
      pushToast({ variant: "success", title: `NodeNetworkConfigurationPolicy ${name} deleted` });
    } else {
      pushToast({ variant: "danger", title: `Could not delete NodeNetworkConfigurationPolicy ${name}` });
    }
  };

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
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
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
                            <Button variant="link" isInline component={Link} to={nncpDetailPath(row.name)}>
                              {row.name}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Status">
                          <Label color="blue" isCompact>
                            {row.status}
                          </Label>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <NncpActionsMenu row={row} onRequestDelete={setPendingDelete} />
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
      <CreateNncpModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(record) => {
          setCreateOpen(false);
          navigate(nncpDetailPath(record.name));
        }}
      />
      <Modal
        variant="small"
        isOpen={pendingDelete != null}
        onClose={() => setPendingDelete(null)}
        aria-labelledby="delete-nncp-title"
      >
        <ModalHeader
          title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete NodeNetworkConfigurationPolicy?"}
          labelId="delete-nncp-title"
        />
        <ModalBody>
          <Content component="p">
            Are you sure you want to delete NodeNetworkConfigurationPolicy <strong>{pendingDelete?.name}</strong>? This
            action cannot be undone.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

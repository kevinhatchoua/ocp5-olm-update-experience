import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Icon,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Title,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import EditIcon from "@patternfly/react-icons/dist/esm/icons/edit-icon";
import GlobeIcon from "@patternfly/react-icons/dist/esm/icons/globe-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { getNodeDetail } from "./nodeDetailData";
import { getNodeGpuMetrics, nodeHasGpu } from "./nodeGpuMetricsData";
import NodeDetailsConditions from "./NodeDetailsConditions";
import NodeDetailsGpuMetrics from "./NodeDetailsGpuMetrics";
import { getNodeConditions } from "./nodeConditionsData";

function NodeDetailsDescriptionList({ node }: { node: ReturnType<typeof getNodeDetail> }) {
  return (
    <DescriptionList
      isHorizontal
      isCompact
      className="ocs-node-details__dl"
      aria-label="Node properties"
    >
      <DescriptionListGroup>
        <DescriptionListTerm>Node name</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.name}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Status</DescriptionListTerm>
        <DescriptionListDescription>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <Icon status="success" aria-hidden>
              <CheckCircleIcon />
            </Icon>
            <Content component="small">{node.status}</Content>
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>External ID</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.externalId}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Uptime</DescriptionListTerm>
        <DescriptionListDescription>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <GlobeIcon aria-hidden className="ocs-node-details__uptime-icon" />
            <Content component="small">{node.uptime}</Content>
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Node addresses</DescriptionListTerm>
        <DescriptionListDescription>
          <DescriptionList isCompact className="ocs-node-details__nested-dl">
            <DescriptionListGroup>
              <DescriptionListTerm>Hostname</DescriptionListTerm>
              <DescriptionListDescription>
                <Content component="small">{node.addresses.hostname}</Content>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Internal DNS</DescriptionListTerm>
              <DescriptionListDescription>
                <Content component="small">{node.addresses.internalDns}</Content>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Internal IP</DescriptionListTerm>
              <DescriptionListDescription>
                <Content component="small">{node.addresses.internalIp}</Content>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm className="ocs-node-details__labels-term">
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "nowrap" }}
            className="ocs-node-details__labels-term-inner"
          >
            <span className="ocs-node-details__labels-heading">Labels</span>
            <Button variant="link" isInline icon={<EditIcon aria-hidden />}>
              Edit
            </Button>
          </Flex>
        </DescriptionListTerm>
        <DescriptionListDescription>
          <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }} className="ocs-node-details__label-group">
            {node.labels.map((label) => (
              <Label key={label} color="purple" isCompact>
                {label}
              </Label>
            ))}
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
}

function NodeSystemDescriptionList({ node }: { node: ReturnType<typeof getNodeDetail> }) {
  return (
    <DescriptionList
      isHorizontal
      isCompact
      className="ocs-node-details__dl"
      aria-label="Node system information"
    >
      <DescriptionListGroup>
        <DescriptionListTerm>Operating system</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.operatingSystem}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>OS image</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.osImage}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Architecture</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.architecture}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Kernel version</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.kernelVersion}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Boot ID</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.bootId}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Container runtime</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.containerRuntime}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Kubelet version</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.kubeletVersion}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Kube-Proxy version</DescriptionListTerm>
        <DescriptionListDescription>
          <Content component="small">{node.kubeProxyVersion}</Content>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
}

export default function NodeDetailPage() {
  const { nodeName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(nodeName || "");
  const node = getNodeDetail(decodedName);
  const gpuMetrics = nodeHasGpu(node) ? getNodeGpuMetrics(node.name) : undefined;
  const nodeConditions = getNodeConditions(node.name);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [showDrainModal, setShowDrainModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const closeAndReturn = () => navigate("/compute");

  return (
    <div className="ocs-app-page-outer ocs-node-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Compute", path: "/compute" },
          { label: "Nodes", path: "/compute" },
          { label: node.name },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="ocs-node-details">
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Title headingLevel="h1" size="2xl">
              Node details
            </Title>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={node.name} path={`/compute/nodes/${encodeURIComponent(node.name)}`} />
              <Dropdown
                isOpen={actionsOpen}
                onOpenChange={setActionsOpen}
                onSelect={() => setActionsOpen(false)}
                popperProps={{ position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((o) => !o)} variant="secondary">
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem itemId="drain" onClick={() => setShowDrainModal(true)}>
                    Drain node
                  </DropdownItem>
                  <DropdownItem itemId="restart" onClick={() => setShowRestartModal(true)}>
                    Restart
                  </DropdownItem>
                  <DropdownItem itemId="delete" onClick={() => setShowDeleteModal(true)} isDanger>
                    Delete
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Flex>
          </Flex>

          <div className="ocs-node-details__panel">
            <div className="ocs-node-details__columns">
              <div className="ocs-node-details__column">
                <NodeDetailsDescriptionList node={node} />
              </div>
              <div className="ocs-node-details__column">
                <NodeSystemDescriptionList node={node} />
              </div>
            </div>
          </div>

          {gpuMetrics && <NodeDetailsGpuMetrics metrics={gpuMetrics} />}

          <NodeDetailsConditions conditions={nodeConditions} />
        </Flex>
      </Breadcrumbs>

      <Modal variant="small" isOpen={showDrainModal} onClose={() => setShowDrainModal(false)}>
        <ModalHeader title={`Drain ${node.name}`} />
        <ModalBody>
          <Content component="p">
            Draining will safely evict all pods from this node. The node will be marked as unschedulable until
            uncordoned.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button key="cancel" variant="link" onClick={() => setShowDrainModal(false)}>
            Cancel
          </Button>
          <Button key="drain" variant="primary" onClick={() => { setShowDrainModal(false); closeAndReturn(); }}>
            Drain node
          </Button>
        </ModalFooter>
      </Modal>

      <Modal variant="small" isOpen={showRestartModal} onClose={() => setShowRestartModal(false)}>
        <ModalHeader title={`Restart ${node.name}`} />
        <ModalBody>
          <Content component="p">
            Restarting the node will cause a brief interruption. All pods will be rescheduled to other available nodes.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button key="cancel" variant="link" onClick={() => setShowRestartModal(false)}>
            Cancel
          </Button>
          <Button key="restart" variant="primary" onClick={() => { setShowRestartModal(false); closeAndReturn(); }}>
            Restart node
          </Button>
        </ModalFooter>
      </Modal>

      <Modal variant="small" isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader title={`Delete ${node.name}`} />
        <ModalBody>
          <Content component="p">
            Are you sure you want to delete this node? This action cannot be undone. The node will be permanently removed
            from the cluster.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button key="cancel" variant="link" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button key="delete" variant="danger" onClick={() => { setShowDeleteModal(false); closeAndReturn(); }}>
            Delete node
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

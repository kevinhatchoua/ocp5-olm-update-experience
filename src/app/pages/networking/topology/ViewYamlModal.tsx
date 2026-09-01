import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  FlexItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
} from "@patternfly/react-core";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import { TopologyLightSpeedAction } from "./TopologyLightSpeedAction";
import { LightspeedAiAccuracyInline } from "../../../components/lightspeed/LightspeedLegalCopy";

type ViewYamlModalProps = {
  isOpen: boolean;
  resourceLabel: string;
  yaml: string;
  reviewContextKey?: string;
  onClose: () => void;
  onSave?: (yaml: string) => void;
};

function downloadYaml(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ViewYamlModal({
  isOpen,
  resourceLabel,
  yaml,
  reviewContextKey,
  onClose,
  onSave,
}: ViewYamlModalProps) {
  const [draft, setDraft] = useState(yaml);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(yaml);
      setCopied(false);
    }
  }, [isOpen, yaml]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleSave = () => {
    onSave?.(draft);
    onClose();
  };

  const safeFilename = resourceLabel.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase() || "resource";

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="view-yaml-modal-title"
      className="ocs-pf-topo-yaml-modal"
    >
      <ModalHeader title={`YAML: ${resourceLabel}`} labelId="view-yaml-modal-title" />
      <ModalBody>
        {reviewContextKey ? (
          <div className="ocs-pf-topo-yaml-modal__ai pf-v6-u-mb-md">
            <TopologyLightSpeedAction contextKey={reviewContextKey} intent="analyze" variant="link" isInline>
              Review YAML with LightSpeed
            </TopologyLightSpeedAction>
            <LightspeedAiAccuracyInline className="ocs-pf-topo-yaml-modal__disclaimer" />
          </div>
        ) : null}
        <TextArea
          id="topology-resource-yaml"
          aria-label={`YAML for ${resourceLabel}`}
          value={draft}
          onChange={(_event, value) => setDraft(value)}
          className="ocs-pf-topo-yaml-modal__editor"
          resizeOrientation="vertical"
          rows={18}
        />
      </ModalBody>
      <ModalFooter>
        <Flex flexWrap={{ default: "wrap" }} spaceItems={{ default: "spaceItemsSm" }} className="pf-v6-u-w-100">
          <FlexItem>
            <Button variant="secondary" icon={<CopyIcon aria-hidden />} onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              variant="secondary"
              icon={<DownloadIcon aria-hidden />}
              onClick={() => downloadYaml(`${safeFilename}.yaml`, draft)}
            >
              Download
            </Button>
          </FlexItem>
          <FlexItem align={{ default: "alignRight" }} className="pf-v6-u-ml-auto">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </FlexItem>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}

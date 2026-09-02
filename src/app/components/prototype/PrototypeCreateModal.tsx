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

type PrototypeCreateModalProps = {
  isOpen: boolean;
  resourceLabel: string;
  yaml: string;
  onClose: () => void;
  onCreate: (yaml: string) => void;
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

export default function PrototypeCreateModal({
  isOpen,
  resourceLabel,
  yaml,
  onClose,
  onCreate,
}: PrototypeCreateModalProps) {
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

  const safeFilename = resourceLabel.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase() || "resource";

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="prototype-create-modal-title"
      className="ocs-pf-topo-yaml-modal"
    >
      <ModalHeader title={`Create ${resourceLabel}`} labelId="prototype-create-modal-title" />
      <ModalBody>
        <TextArea
          id="prototype-create-yaml"
          aria-label={`${resourceLabel} YAML`}
          value={draft}
          onChange={(_e, value) => setDraft(value)}
          resizeOrientation="vertical"
          style={{ minHeight: "18rem", fontFamily: "var(--pf-v6-global--FontFamily--monospace)" }}
        />
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} flexWrap={{ default: "wrap" }} gap={{ default: "gapSm" }}>
          <FlexItem>
            <Flex gap={{ default: "gapSm" }}>
              <Button variant="secondary" icon={<CopyIcon />} onClick={() => void handleCopy()}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="secondary"
                icon={<DownloadIcon />}
                onClick={() => downloadYaml(`${safeFilename}.yaml`, draft)}
              >
                Download
              </Button>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: "gapSm" }}>
              <Button variant="link" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => onCreate(draft)}>
                Create
              </Button>
            </Flex>
          </FlexItem>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}

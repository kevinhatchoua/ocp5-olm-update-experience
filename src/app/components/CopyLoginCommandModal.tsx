import {
  Button,
  ClipboardCopy,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

const LOGIN_COMMAND =
  "oc login --token=sha256~prototype-demo-token --server=https://api.cluster.example.com:6443";

type CopyLoginCommandModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Prototype stand-in for the OpenShift “Copy login command” masthead action. */
export default function CopyLoginCommandModal({ isOpen, onClose }: CopyLoginCommandModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      aria-label="Copy login command"
    >
      <ModalHeader title="Copy login command" />
      <ModalBody>
        <Content component="p" className="pf-v6-u-mb-md">
          Log in with this token from your terminal. Do not share your API token.
        </Content>
        <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
          {LOGIN_COMMAND}
        </ClipboardCopy>
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

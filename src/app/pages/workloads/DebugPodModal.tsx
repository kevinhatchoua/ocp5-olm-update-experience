import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";
import type { PodRecord } from "./podListData";
import { getPodDetail } from "./podDetailData";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";

export const DEFAULT_DEBUG_IMAGE = "registry.redhat.io/rhel9/support-tools:latest";

type DebugPhase = "form" | "starting" | "session" | "pull-fail" | "denied";

export type DebugPodTarget = {
  namespace: string;
  name: string;
  pod?: PodRecord;
};

type DebugPodModalProps = {
  target: DebugPodTarget | null;
  isOpen: boolean;
  onClose: () => void;
};

function containersFor(target: DebugPodTarget) {
  const detail = getPodDetail(target.namespace, target.name);
  if (detail?.containers.length) {
    return detail.containers.map((c) => ({ name: c.name, image: c.image }));
  }
  return [{ name: "container", image: target.pod?.image ?? "" }];
}

function isDistroless(target: DebugPodTarget, containerName: string) {
  if (target.pod?.distroless || target.pod?.status === "CrashLoopBackOff") return true;
  const detail = getPodDetail(target.namespace, target.name);
  const c = detail?.containers.find((x) => x.name === containerName);
  return /ubi-micro|distroless|hardened/i.test(c?.image ?? target.pod?.image ?? "");
}

function imageWillFail(image: string) {
  return !/support-tools|ubi9\/support|toolbox/i.test(image);
}

export default function DebugPodModal({ target, isOpen, onClose }: DebugPodModalProps) {
  const { permission } = usePrototypeDemo();
  const containers = useMemo(() => (target ? containersFor(target) : []), [target]);
  const [phase, setPhase] = useState<DebugPhase>("form");
  const [container, setContainer] = useState("");
  const [image, setImage] = useState(DEFAULT_DEBUG_IMAGE);
  const [sessionLines, setSessionLines] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !target) {
      setPhase("form");
      setImage(DEFAULT_DEBUG_IMAGE);
      setSessionLines([]);
      return;
    }
    setContainer(containers[0]?.name ?? "container");
    setPhase(permission === "no-access" || permission === "view" ? "denied" : "form");
    setImage(DEFAULT_DEBUG_IMAGE);
  }, [isOpen, target, containers, permission]);

  useEffect(() => {
    if (phase !== "starting" || !target) return;
    const timer = window.setTimeout(() => {
      if (imageWillFail(image)) {
        setPhase("pull-fail");
        return;
      }
      const distroless = isDistroless(target, container);
      setSessionLines([
        "Creating ephemeral debug container…",
        `  pod: ${target.namespace}/${target.name}`,
        `  target: ${container}`,
        `  debug image: ${image}`,
        "",
        distroless
          ? "Note: target workload looks distroless/hardened — Terminal would fail with “sh: not found”."
          : "Note: This image has a shell — Terminal also works. Debug provides support-tools in an ephemeral container.",
        "",
        "Attached to debug container.",
        "sh-5.1# ",
      ]);
      setPhase("session");
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [phase, target, container, image]);

  if (!target) return null;

  const title =
    phase === "starting"
      ? "Starting debug container"
      : phase === "session"
        ? "Debug session"
        : phase === "pull-fail"
          ? "Unable to start debug"
      : phase === "denied"
        ? "Access denied"
        : "Start debug container";

  return (
    <Modal
      variant={phase === "session" ? "large" : "medium"}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="debug-pod-modal-title"
    >
      <ModalHeader title={title} labelId="debug-pod-modal-title" />
      <ModalBody>
        {phase === "form" ? (
          <>
            <Content component="p">
              Starts an ephemeral debug container in pod <strong>{target.name}</strong> (namespace{" "}
              <strong>{target.namespace}</strong>). Unlike the <strong>Terminal</strong> tab, Debug does not
              require a shell in the workload image.
            </Content>
            <Alert variant="info" isInline title="Debug vs Terminal" className="pf-v6-u-mt-md pf-v6-u-mb-md">
              Use <strong>Terminal</strong> when the container has a shell. Use <strong>Debug</strong> for
              distroless or hardened images, or when a container is crash looping (equivalent to{" "}
              <code>oc debug</code>).
            </Alert>
            <Form>
              <FormGroup label="Target container" fieldId="debug-pod-container">
                <FormSelect
                  id="debug-pod-container"
                  value={container}
                  onChange={(_e, v) => setContainer(v)}
                  aria-label="Target container"
                >
                  {containers.map((c) => (
                    <FormSelectOption
                      key={c.name}
                      value={c.name}
                      label={c.image ? `${c.name} — ${c.image}` : c.name}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
              <FormGroup label="Debug image" fieldId="debug-pod-image">
                <TextInput
                  id="debug-pod-image"
                  value={image}
                  onChange={(_e, v) => setImage(v)}
                  aria-label="Debug image"
                />
              </FormGroup>
            </Form>
          </>
        ) : null}

        {phase === "denied" ? (
          <>
            <Alert variant="danger" isInline title="Cannot start debug container">
              Your account does not have permission to create ephemeral containers (
              <code>pods/ephemeralcontainers</code>) in namespace <strong>{target.namespace}</strong>.
            </Alert>
            <Content component="p" className="pf-v6-u-mt-md">
              Ask a cluster admin to grant <code>create</code> on <code>pods/ephemeralcontainers</code>. The{" "}
              <strong>Terminal</strong> tab uses <code>pods/exec</code> and may still work when Debug does not.
            </Content>
          </>
        ) : null}

        {phase === "starting" ? (
          <>
            <Label color="blue" className="pf-v6-u-mb-md">
              Creating ephemeral container…
            </Label>
            <pre className="ocs-debug-terminal" aria-label="Debug start progress">
              {`Creating ephemeral debug container…\n  pod: ${target.namespace}/${target.name}\n  target: ${container}\n  debug image: ${image}\n\nPulling debug image…`}
            </pre>
          </>
        ) : null}

        {phase === "session" ? (
          <>
            <Label color="blue" className="pf-v6-u-mb-sm">
              Ephemeral container · attached
            </Label>
            <Content component="p" className="pf-v6-u-mb-md">
              Prototype mock — no real cluster session. Exit cleans up the ephemeral container in the real
              product.
            </Content>
            <pre className="ocs-debug-terminal ocs-debug-terminal--session" aria-label="Debug terminal output">
              {sessionLines.join("\n")}
            </pre>
          </>
        ) : null}

        {phase === "pull-fail" ? (
          <>
            <Alert variant="danger" isInline title="Image pull failed">
              Could not pull debug image <code>{image}</code>. Check the image name, tag, and that the cluster
              can reach the registry.
            </Alert>
            <pre className="ocs-debug-terminal pf-v6-u-mt-md" aria-label="Image pull error">
              {`Error: ErrImagePull\nFailed to pull image "${image}": rpc error: code = NotFound\ndesc = failed to pull and unpack image: not found\n\npod: ${target.namespace}/${target.name}\ntarget container: ${container}`}
            </pre>
            <Content component="p" className="pf-v6-u-mt-md">
              Try again with a valid image such as <code>{DEFAULT_DEBUG_IMAGE}</code>, or cancel and return to
              the pod.
            </Content>
          </>
        ) : null}
      </ModalBody>
      <ModalFooter>
        {phase === "form" ? (
          <>
            <Button variant="primary" onClick={() => setPhase("starting")}>
              Start debug
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </>
        ) : null}
        {phase === "denied" ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : null}
        {phase === "starting" ? (
          <Button variant="secondary" isDisabled>
            Cancel
          </Button>
        ) : null}
        {phase === "session" ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : null}
        {phase === "pull-fail" ? (
          <>
            <Button variant="primary" onClick={() => setPhase("starting")}>
              Try again
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImage(DEFAULT_DEBUG_IMAGE);
                setPhase("form");
              }}
            >
              Change image
            </Button>
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
          </>
        ) : null}
      </ModalFooter>
    </Modal>
  );
}

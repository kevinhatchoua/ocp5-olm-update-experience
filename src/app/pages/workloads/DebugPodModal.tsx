import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Content,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";
import type { PodRecord } from "./podListData";
import { getPodDetail } from "./podDetailData";
import { PODS } from "./podListData";
import { CONSOLE_PROJECTS } from "../../components/NamespaceBar";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";

export const DEFAULT_DEBUG_IMAGE = "registry.redhat.io/rhel9/support-tools:latest";

/** Cluster projects for --to-namespace (exclude "All projects"). */
function debugNamespaceOptions(podNamespace: string): string[] {
  const fromConsole = CONSOLE_PROJECTS.filter((p) => p !== "All projects");
  const fromPods = PODS.map((p) => p.namespace);
  const fromAdmin = [
    "default",
    "kube-system",
    "kube-public",
    "openshift-console",
    "openshift-monitoring",
    "my-application",
  ];
  return Array.from(new Set([podNamespace, ...fromConsole, ...fromPods, ...fromAdmin])).sort((a, b) =>
    a.localeCompare(b),
  );
}

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

type ContainerOption = { name: string; image: string; kind: "app" | "sidecar" | "init" };

function containersFor(target: DebugPodTarget): ContainerOption[] {
  const detail = getPodDetail(target.namespace, target.name);
  if (detail?.containers.length) {
    return detail.containers.map((c, index) => ({
      name: c.name,
      image: c.image,
      kind: c.name.startsWith("init-") || c.state === "Completed" ? "init" : index === 0 ? "app" : "sidecar",
    }));
  }
  const appName = target.pod?.image.split(":")[0].split("/").pop() ?? "app";
  return [
    { name: appName, image: target.pod?.image ?? "", kind: "app" },
    { name: "istio-proxy", image: "registry.redhat.io/openshift-service-mesh/proxyv2-rhel9:2.6", kind: "sidecar" },
    { name: "log-shipper", image: "quay.io/openshift-logging/vector:0.37", kind: "sidecar" },
    { name: "init-config", image: "registry.access.redhat.com/ubi9/ubi-minimal:latest", kind: "init" },
  ];
}

function isDistroless(target: DebugPodTarget, containerName: string) {
  if (target.pod?.distroless || target.pod?.status === "CrashLoopBackOff") return true;
  const detail = getPodDetail(target.namespace, target.name);
  const c = detail?.containers.find((x) => x.name === containerName);
  return /ubi-micro|distroless|hardened/i.test(c?.image ?? target.pod?.image ?? "");
}

function imageWillFail(image: string) {
  if (!image.trim()) return false;
  return !/support-tools|ubi9\/support|toolbox|centos|busybox/i.test(image);
}

function containerLabel(c: ContainerOption) {
  const kind =
    c.kind === "init" ? "init" : c.kind === "sidecar" ? "sidecar" : "app";
  return `${c.name} (${kind})${c.image ? ` — ${c.image}` : ""}`;
}

export default function DebugPodModal({ target, isOpen, onClose }: DebugPodModalProps) {
  const { permission } = usePrototypeDemo();
  const containers = useMemo(() => (target ? containersFor(target) : []), [target]);
  const namespaceOptions = useMemo(
    () => (target ? debugNamespaceOptions(target.namespace) : []),
    [target],
  );
  const [phase, setPhase] = useState<DebugPhase>("form");
  const [container, setContainer] = useState("");
  const [image, setImage] = useState(DEFAULT_DEBUG_IMAGE);
  const [command, setCommand] = useState("/bin/sh");
  const [asUser, setAsUser] = useState("");
  const [toNamespace, setToNamespace] = useState("");
  const [oneContainer, setOneContainer] = useState(true);
  const [preservePod, setPreservePod] = useState(false);
  const [shareProcesses, setShareProcesses] = useState(true);
  const [keepProbes, setKeepProbes] = useState(false);
  const [sessionLines, setSessionLines] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !target) {
      setPhase("form");
      setImage(DEFAULT_DEBUG_IMAGE);
      setCommand("/bin/sh");
      setAsUser("");
      setToNamespace("");
      setOneContainer(true);
      setPreservePod(false);
      setShareProcesses(true);
      setKeepProbes(false);
      setSessionLines([]);
      return;
    }
    setContainer(containers[0]?.name ?? "container");
    const options = debugNamespaceOptions(target.namespace);
    setToNamespace(options.includes(target.namespace) ? target.namespace : options[0] ?? target.namespace);
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
        `  target: ${container}  (-c / --container)`,
        image.trim()
          ? `  debug image: ${image}  (--image)`
          : "  debug image: (cluster default)  (--image omitted)",
        `  command: ${command || "/bin/sh"}`,
        asUser ? `  as user: ${asUser}  (--as-user)` : "  as user: (container default)",
        toNamespace && toNamespace !== target.namespace
          ? `  to-namespace: ${toNamespace}  (--to-namespace)`
          : `  namespace: ${target.namespace}`,
        `  one-container: ${oneContainer}  (--one-container)`,
        `  preserve-pod: ${preservePod}  (--preserve-pod)`,
        `  share processes: ${shareProcesses}`,
        `  keep probes: ${keepProbes}`,
        "",
        distroless
          ? "Note: target workload looks distroless/hardened — Terminal would fail with “sh: not found”."
          : "Note: This image has a shell — Terminal also works. Debug provides support-tools in an ephemeral container.",
        "",
        "Attached to debug container.",
        `${command.includes("bash") ? "bash" : "sh"}-5.1# `,
      ]);
      setPhase("session");
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [
    phase,
    target,
    container,
    image,
    command,
    asUser,
    toNamespace,
    oneContainer,
    preservePod,
    shareProcesses,
    keepProbes,
  ]);

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
      variant={phase === "session" || phase === "form" ? "large" : "medium"}
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
              <strong>{target.namespace}</strong>). Fields map to common{" "}
              <code>oc debug</code> / <code>kubectl debug</code> flags.
            </Content>
            <Alert variant="info" isInline title="Debug vs Terminal" className="pf-v6-u-mt-md pf-v6-u-mb-md">
              Use <strong>Terminal</strong> when the container has a shell. Use <strong>Debug</strong> for
              distroless or hardened images, or when a container is crash looping.
            </Alert>
            <Form>
              <FormGroup label="Target container" isRequired fieldId="debug-pod-container">
                <FormSelect
                  id="debug-pod-container"
                  value={container}
                  onChange={(_e, v) => setContainer(v)}
                  aria-label="Target container"
                >
                  {containers.map((c) => (
                    <FormSelectOption key={c.name} value={c.name} label={containerLabel(c)} />
                  ))}
                </FormSelect>
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Maps to <code>-c</code> / <code>--container</code>. Includes app, sidecar, and init
                      containers from the pod.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label="Debug image" fieldId="debug-pod-image">
                <TextInput
                  id="debug-pod-image"
                  value={image}
                  onChange={(_e, v) => setImage(v)}
                  aria-label="Debug image"
                  placeholder={DEFAULT_DEBUG_IMAGE}
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Optional. Maps to <code>--image</code>. Leave empty to use the cluster default, or enter a
                      custom image with the tools you need (for example support-tools).
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label="Command" fieldId="debug-pod-command">
                <TextInput
                  id="debug-pod-command"
                  value={command}
                  onChange={(_e, v) => setCommand(v)}
                  aria-label="Debug command"
                  placeholder="/bin/sh"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Maps to args after <code>--</code> (for example <code>/bin/bash</code> or{" "}
                      <code>/bin/env</code>).
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label="Run as user" fieldId="debug-pod-as-user">
                <TextInput
                  id="debug-pod-as-user"
                  value={asUser}
                  onChange={(_e, v) => setAsUser(v)}
                  aria-label="Run as user"
                  placeholder="e.g. 1000 (optional)"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Maps to <code>--as-user</code>. Leave empty to use the container default.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label="Debug namespace" fieldId="debug-pod-to-namespace">
                <FormSelect
                  id="debug-pod-to-namespace"
                  value={toNamespace}
                  onChange={(_e, v) => setToNamespace(v)}
                  aria-label="Debug namespace"
                >
                  {namespaceOptions.map((ns) => (
                    <FormSelectOption
                      key={ns}
                      value={ns}
                      label={ns === target.namespace ? `${ns} (pod namespace)` : ns}
                    />
                  ))}
                </FormSelect>
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Maps to <code>--to-namespace</code> when different from the pod namespace. Lists
                      projects available on this cluster.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label="Options" fieldId="debug-pod-options">
                <Checkbox
                  id="debug-pod-one-container"
                  label={
                    <>
                      Run only the selected container (<code>--one-container</code>)
                    </>
                  }
                  isChecked={oneContainer}
                  onChange={(_e, checked) => setOneContainer(checked)}
                />
                <Checkbox
                  id="debug-pod-preserve-pod"
                  label={
                    <>
                      Keep debug pod after exit (<code>--preserve-pod</code>)
                    </>
                  }
                  isChecked={preservePod}
                  onChange={(_e, checked) => setPreservePod(checked)}
                  className="pf-v6-u-mt-sm"
                />
                <Checkbox
                  id="debug-pod-share-processes"
                  label="Share process namespace with target container"
                  isChecked={shareProcesses}
                  onChange={(_e, checked) => setShareProcesses(checked)}
                  className="pf-v6-u-mt-sm"
                />
                <Checkbox
                  id="debug-pod-keep-probes"
                  label={
                    <>
                      Keep original probes (<code>--keep-liveness</code> / <code>--keep-readiness</code>)
                    </>
                  }
                  isChecked={keepProbes}
                  onChange={(_e, checked) => setKeepProbes(checked)}
                  className="pf-v6-u-mt-sm"
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
              {`Creating ephemeral debug container…\n  pod: ${target.namespace}/${target.name}\n  target: ${container}\n  debug image: ${image.trim() || "(cluster default)"}\n  command: ${command || "/bin/sh"}\n\n${image.trim() ? "Pulling debug image…" : "Starting debug container…"}`}
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
            <Button variant="link" onClick={onClose}>
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

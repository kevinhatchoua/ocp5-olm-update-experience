import type { PodRecord } from "./podListData";
import { getPodByKey } from "./podListData";

export type PodContainer = {
  name: string;
  image: string;
  state: string;
  ready: boolean;
  lastState: string;
  restarts: number;
  started: string;
  finished: string;
  exitCode: string;
};

export type PodDetail = PodRecord & {
  labels: string[];
  nodeSelector: string;
  tolerations: string;
  annotations: string;
  creationTimestamp: string;
  ownerDisplay: string;
  restartPolicy: string;
  activeDeadlineSeconds: string;
  podIp: string;
  hostIp: string;
  node: string;
  imagePullSecret: string;
  podDisruptionBudget: string;
  receivingTraffic: string;
  qosClass: string;
  priority: string;
  containers: PodContainer[];
  volumes: string[];
};

const defaultLabels = (pod: PodRecord): string[] => {
  const hash = pod.name.split("-").pop() ?? "unknown";
  const app = pod.owner.name.replace(/-[a-z0-9]+$/i, "") || pod.owner.name;
  return [`app=${app}`, `pod-template-hash=${hash}`];
};

export const getPodDetail = (namespace: string, name: string): PodDetail | undefined => {
  const pod = getPodByKey(namespace, name);
  if (!pod) {
    return undefined;
  }

  const containerName = pod.image.split(":")[0].split("/").pop() ?? pod.name;
  const isCrashLoop = pod.status === "CrashLoopBackOff";
  const waiting = isCrashLoop ? "CrashLoopBackOff" : pod.status === "Running" ? "Running" : pod.status;

  return {
    ...pod,
    labels: defaultLabels(pod),
    nodeSelector: "—",
    tolerations: "—",
    annotations: "12 annotations",
    creationTimestamp: pod.created,
    ownerDisplay: `${pod.owner.kind}/${pod.owner.name}`,
    restartPolicy: "Always restart",
    activeDeadlineSeconds: "—",
    podIp: `10.128.${(name.length % 200) + 10}.${(namespace.length % 200) + 1}`,
    hostIp: "10.0.24.42",
    node: "ip-10-0-24-42.us-east-2.compute.internal",
    imagePullSecret: "—",
    podDisruptionBudget: "—",
    receivingTraffic: pod.status === "Running" ? "Yes" : "No",
    qosClass: "Burstable",
    priority: "0",
    containers: [
      {
        name: containerName,
        image: pod.image,
        state: waiting,
        ready: pod.ready.startsWith("1/"),
        lastState: isCrashLoop ? "Terminated (exit 1)" : pod.restarts > 0 ? "Terminated" : "—",
        restarts: pod.restarts,
        started: pod.created,
        finished: isCrashLoop ? "Aug 21, 2026, 9:29 PM" : "—",
        exitCode: isCrashLoop ? "1" : "—",
      },
      {
        name: "istio-proxy",
        image: "registry.redhat.io/openshift-service-mesh/proxyv2-rhel9:2.6",
        state: pod.status === "Running" || isCrashLoop ? "Running" : waiting,
        ready: true,
        lastState: "—",
        restarts: 0,
        started: pod.created,
        finished: "—",
        exitCode: "—",
      },
      {
        name: "log-shipper",
        image: "quay.io/openshift-logging/vector:0.37",
        state: "Running",
        ready: true,
        lastState: "—",
        restarts: 0,
        started: pod.created,
        finished: "—",
        exitCode: "—",
      },
      {
        name: "init-config",
        image: "registry.access.redhat.com/ubi9/ubi-minimal:latest",
        state: "Completed",
        ready: false,
        lastState: "Terminated (exit 0)",
        restarts: 0,
        started: pod.created,
        finished: pod.created,
        exitCode: "0",
      },
    ],
    volumes: ["kube-api-access-abc12", "default-token-xyz89"],
  };
};

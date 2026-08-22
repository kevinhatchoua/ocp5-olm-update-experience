/**
 * Cluster update planning workflow (prototype).
 * Preflight validation is intentionally separate from an in-progress update.
 */

import {
  CLUSTER_CHANNEL,
  CLUSTER_PATCH_VERSION,
  CLUSTER_MINOR_BLOCKED,
} from "../constants/clusterVersionDemo";

export type PreflightPhase = "idle" | "validating" | "passed" | "failed";

const TARGET_VERSION_KEY = "ocs-demo-update-target-version";
const TARGET_CHANNEL_KEY = "ocs-demo-update-target-channel";
const PREFLIGHT_PHASE_KEY = "ocs-demo-preflight-phase";

export const UPDATE_CHANNELS = ["stable-5.0", "simple", "fast-5.0", "candidate-5.0"] as const;
export type UpdateChannel = (typeof UPDATE_CHANNELS)[number];

export function readUpdateInProgress(): { version: string; startedAt: string | number } | null {
  try {
    const raw = localStorage.getItem("clusterUpdateInProgress");
    if (!raw) return null;
    return JSON.parse(raw) as { version: string; startedAt: string | number };
  } catch {
    return null;
  }
}

export function isUpdateActivelyRunning(): boolean {
  return readUpdateInProgress() !== null;
}

export function readTargetVersion(): string {
  try {
    return sessionStorage.getItem(TARGET_VERSION_KEY) || "";
  } catch {
    return "";
  }
}

export function writeTargetVersion(version: string): void {
  try {
    sessionStorage.setItem(TARGET_VERSION_KEY, version);
  } catch {
    /* ignore */
  }
}

export function readTargetChannel(): string {
  try {
    return sessionStorage.getItem(TARGET_CHANNEL_KEY) || CLUSTER_CHANNEL;
  } catch {
    return CLUSTER_CHANNEL;
  }
}

export function writeTargetChannel(channel: string): void {
  try {
    sessionStorage.setItem(TARGET_CHANNEL_KEY, channel);
  } catch {
    /* ignore */
  }
}

export function readPreflightPhase(): PreflightPhase {
  try {
    const value = sessionStorage.getItem(PREFLIGHT_PHASE_KEY);
    if (value === "validating" || value === "passed" || value === "failed" || value === "idle") {
      return value;
    }
  } catch {
    /* ignore */
  }
  return "idle";
}

export function writePreflightPhase(phase: PreflightPhase): void {
  try {
    sessionStorage.setItem(PREFLIGHT_PHASE_KEY, phase);
  } catch {
    /* ignore */
  }
}

/** Clear preflight only — never clears an in-progress update. */
export function resetPreflightState(): void {
  writePreflightPhase("idle");
}

export function canRunPreflight(version: string): boolean {
  return Boolean(version) && version !== CLUSTER_MINOR_BLOCKED && !isUpdateActivelyRunning();
}

export function preflightBannerTitle(version: string, channel: string): string {
  return `Pre-flight AI Validation for Upgrade to OCP ${version} (${channel})`;
}

export const DEFAULT_PLAN_VERSION = CLUSTER_PATCH_VERSION;
export const DEFAULT_PLAN_CHANNEL = CLUSTER_CHANNEL;

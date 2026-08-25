import type { NetResourceKind } from "../networkTopologyData";

/** Short badges analogous to D / J / APPL in console topology. */
export const KIND_BADGE: Record<NetResourceKind, string> = {
  bridge: "BR",
  interface: "IF",
  tunnel: "TN",
  port: "PT",
  cudn: "CUDN",
  udn: "UDN",
};

export const WORKER_BADGE = "WN";
export const LANE_BADGE = "NET";

/** Badge fill colors via PF global tokens (accepted by DefaultNode badgeColor). */
export const KIND_BADGE_COLOR: Record<NetResourceKind, string> = {
  bridge: "var(--pf-t--global--color--brand--default)",
  interface: "var(--pf-t--global--color--status--success--default)",
  tunnel: "var(--pf-t--global--color--purple--default, var(--pf-t--global--icon--color--brand--default))",
  port: "var(--pf-t--global--color--status--warning--default)",
  cudn: "var(--pf-t--global--color--purple--default, var(--pf-t--global--icon--color--brand--default))",
  udn: "var(--pf-t--global--color--status--info--default)",
};

const ON_BRAND = "var(--pf-t--global--text--color--on-brand--regular, #fff)";
const ON_WARNING = "var(--pf-t--global--text--color--status--on-warning--default, var(--pf-t--global--text--color--regular))";
const ON_SUCCESS = "var(--pf-t--global--text--color--status--on-success--default, #fff)";

/** Per-fill text so warning/yellow badges are not white-on-yellow. */
export const KIND_BADGE_TEXT: Record<NetResourceKind, string> = {
  bridge: ON_BRAND,
  interface: ON_SUCCESS,
  tunnel: ON_BRAND,
  port: ON_WARNING,
  cudn: ON_BRAND,
  udn: ON_BRAND,
};

export const LANE_BADGE_TEXT = ON_BRAND;
export const WORKER_BADGE_TEXT = ON_SUCCESS;
export const WORKER_BADGE_COLOR = "var(--pf-t--global--color--status--success--default)";
export const LANE_BADGE_COLOR = "var(--pf-t--global--color--brand--default)";

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

/**
 * PatternFly 6 nonstatus blue Label tokens: light blue fill, black on-blue text.
 */
export const TYPE_BADGE_COLOR = "var(--pf-t--global--color--nonstatus--blue--default, #b9dafc)";
export const TYPE_BADGE_TEXT = "var(--pf-t--global--text--color--nonstatus--on-blue--default, #151515)";
export const TYPE_BADGE_BORDER = "var(--pf-t--global--border--color--nonstatus--blue--default, #004d99)";

export const KIND_BADGE_COLOR: Record<NetResourceKind, string> = {
  bridge: TYPE_BADGE_COLOR,
  interface: TYPE_BADGE_COLOR,
  tunnel: TYPE_BADGE_COLOR,
  port: TYPE_BADGE_COLOR,
  cudn: TYPE_BADGE_COLOR,
  udn: TYPE_BADGE_COLOR,
};

export const KIND_BADGE_TEXT: Record<NetResourceKind, string> = {
  bridge: TYPE_BADGE_TEXT,
  interface: TYPE_BADGE_TEXT,
  tunnel: TYPE_BADGE_TEXT,
  port: TYPE_BADGE_TEXT,
  cudn: TYPE_BADGE_TEXT,
  udn: TYPE_BADGE_TEXT,
};

export const LANE_BADGE_TEXT = TYPE_BADGE_TEXT;
export const WORKER_BADGE_TEXT = TYPE_BADGE_TEXT;
export const WORKER_BADGE_COLOR = TYPE_BADGE_COLOR;
export const LANE_BADGE_COLOR = TYPE_BADGE_COLOR;

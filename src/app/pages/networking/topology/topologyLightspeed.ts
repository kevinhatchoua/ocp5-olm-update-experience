export const TOPOLOGY_OLS_PREFIX = "ols-topology";

export type TopologyLightspeedScenario =
  | "mtu"
  | "bond"
  | "config-failed"
  | "observe"
  | "create"
  | "delete-impact"
  | "unhealthy-overview"
  | "yaml-review"
  | "general";

/** Build a deterministic LightSpeed context key for the topology prototype. */
export function topologyLightspeedContext(
  scenario: TopologyLightspeedScenario,
  ...segments: string[]
): string {
  const safe = segments.map((s) => encodeURIComponent(s));
  return [TOPOLOGY_OLS_PREFIX, scenario, ...safe].join(":");
}

export function parseTopologyLightspeedContext(context: string): {
  scenario: TopologyLightspeedScenario;
  segments: string[];
} | null {
  if (!context.startsWith(`${TOPOLOGY_OLS_PREFIX}:`)) return null;
  const parts = context.split(":");
  const scenario = parts[1] as TopologyLightspeedScenario;
  const segments = parts.slice(2).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  return { scenario, segments };
}

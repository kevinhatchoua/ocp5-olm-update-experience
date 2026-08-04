import { useMemo } from "react";
import { useLocation } from "react-router";

const HUB_PROTOTYPES_URL =
  import.meta.env.VITE_HUB_PROTOTYPES_URL?.trim() ||
  "https://core-openshift-demo.vercel.app/team/openshift";

/** Path → short context label shown next to the PROTOTYPE badge. */
function contextLabelForPath(pathname: string): string {
  const p = pathname || "/";
  if (p.startsWith("/ecosystem/software-catalog")) return "Ecosystem → Software Catalog";
  if (p.startsWith("/ecosystem/installed-operators")) return "Ecosystem → Installed Operators";
  if (p.startsWith("/ecosystem")) return "Ecosystem";
  if (p.startsWith("/administration/cluster-update")) return "Administration → Cluster Update";
  if (p.startsWith("/administration/cluster-settings")) return "Administration → Cluster Settings";
  if (p.startsWith("/virtualization")) return "Virtualization";
  if (p.startsWith("/networking")) return "Networking";
  if (p.startsWith("/workloads")) return "Workloads";
  if (p.startsWith("/compute")) return "Compute";
  if (p === "/" || p.startsWith("/overview")) return "Overview";
  return "OpenShift prototype";
}

/**
 * White Hub return bar — same chrome as console HTML captures.
 * Do not use PatternFly Banner status="warning" (yellow/orange) for this.
 */
export default function BackToPrototypesBanner() {
  const { pathname } = useLocation();
  const contextLabel = useMemo(() => contextLabelForPath(pathname), [pathname]);

  return (
    <div className="ocs-back-to-prototypes-banner" role="region" aria-label="Prototype navigation">
      <a className="ocs-back-to-prototypes-banner__link" href={HUB_PROTOTYPES_URL}>
        ← Back to prototypes
      </a>
      <div className="ocs-back-to-prototypes-banner__meta">
        <span className="ocs-back-to-prototypes-banner__badge">Prototype</span>
        <span className="ocs-back-to-prototypes-banner__context">{contextLabel}</span>
        <span className="ocs-back-to-prototypes-banner__note">· Links and data are not live</span>
      </div>
    </div>
  );
}

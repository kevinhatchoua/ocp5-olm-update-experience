import { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { Content, PageSection, Spinner, Title } from "@patternfly/react-core";

const MOCK_ORIGIN =
  (import.meta.env.VITE_CONSOLE_MOCK_ORIGIN as string | undefined)?.replace(/\/$/, "") ||
  "https://openshift-console-mock.vercel.app";

type LaunchTarget = { mockPath: string; feature: string; label: string };

/** Platform nav paths that open the live console-mock prototypes (GitOps / Debug Pod). */
const LAUNCH_BY_PATH: Record<string, LaunchTarget> = {
  "/gitops": {
    mockPath: "/gitops/rollouts",
    feature: "hpux-1943-rollout-actions",
    label: "GitOps Rollouts",
  },
  "/gitops/rollouts": {
    mockPath: "/gitops/rollouts",
    feature: "hpux-1943-rollout-actions",
    label: "GitOps Rollouts",
  },
  "/gitops/argocd": {
    mockPath: "/gitops/argocd",
    feature: "hpux-1943-rollout-actions",
    label: "Argo CD",
  },
  "/gitops/applications": {
    mockPath: "/gitops/applications",
    feature: "hpux-1943-rollout-actions",
    label: "Applications",
  },
  "/gitops/applicationsets": {
    mockPath: "/gitops/applicationsets",
    feature: "hpux-1943-rollout-actions",
    label: "ApplicationSets",
  },
};

function launchUrl(target: LaunchTarget): string {
  const url = new URL(target.mockPath, `${MOCK_ORIGIN}/`);
  url.searchParams.set("feature", target.feature);
  return url.toString();
}

/** Build a console-mock URL for callers outside this launch page (e.g. a banner link). */
export function buildConsoleMockUrl(mockPath: string, feature: string): string {
  return launchUrl({ mockPath, feature, label: "" });
}

/**
 * Hands off to the console mock for GitOps / Pod Debug — those overlays live there.
 * Keeps one nav surface on the platform prototype while preserving the working demos.
 */
export default function ConsoleMockLaunchPage() {
  const { pathname } = useLocation();
  const target = useMemo(() => {
    const exact = LAUNCH_BY_PATH[pathname];
    if (exact) return exact;
    if (pathname.startsWith("/gitops")) return LAUNCH_BY_PATH["/gitops/rollouts"];
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!target) return;
    window.location.replace(launchUrl(target));
  }, [target]);

  if (!target) {
    return (
      <PageSection>
        <Title headingLevel="h1">Prototype not found</Title>
        <Content className="pf-v6-u-mt-md">No console-mock launch target for this path.</Content>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Title headingLevel="h1">Opening {target.label}</Title>
      <Content className="pf-v6-u-mt-md pf-v6-u-mb-md">
        Taking you to the live console mock for this prototype…
      </Content>
      <Spinner aria-label={`Opening ${target.label}`} />
      <Content className="pf-v6-u-mt-md">
        <a href={launchUrl(target)}>Continue manually</a>
      </Content>
    </PageSection>
  );
}

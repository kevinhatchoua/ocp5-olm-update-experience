import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  Button,
  Content,
  Divider,
  MenuToggle,
  Popover,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import PatternFlyThemeControls from "./PatternFlyThemeControls";
import { useClusterUpdateDemoVariant } from "../contexts/ClusterUpdateDemoContext";
import {
  usePrototypeDemo,
  type DemoPermission,
  type GitOpsDesignOption,
  type GitOpsScenario,
} from "../contexts/PrototypeDemoContext";
import { isUpdateActivelyRunning } from "../lib/clusterUpdateWorkflow";

function areaFromPath(pathname: string) {
  if (pathname.startsWith("/gitops")) return "gitops";
  if (pathname.startsWith("/workloads/pods")) return "pods";
  if (pathname.startsWith("/administration/cluster-update") || pathname.startsWith("/administration/cluster-settings")) {
    return "cluster-update";
  }
  return "general";
}

export default function PrototypeDemoMenu() {
  const { pathname } = useLocation();
  const area = areaFromPath(pathname);
  const [open, setOpen] = useState(false);
  const demo = usePrototypeDemo();
  const { demoVariant, setDemoVariant, performClusterUpdateDemoReset, startClusterUpdateDemo } =
    useClusterUpdateDemoVariant();
  const [updateInProgress, setUpdateInProgress] = useState(isUpdateActivelyRunning);

  useEffect(() => {
    setUpdateInProgress(isUpdateActivelyRunning());
    const id = window.setInterval(() => setUpdateInProgress(isUpdateActivelyRunning()), 1000);
    return () => window.clearInterval(id);
  }, [pathname]);

  const body = (
    <div className="ocs-prototype-demo-menu">
      <Content component="p" className="ocs-prototype-demo-menu__heading">
        Prototype controls
      </Content>
      <Content component="small" className="ocs-prototype-demo-menu__hint">
        Demo-only — does not change a live cluster.
      </Content>

      <Divider />
      <PatternFlyThemeControls idPrefix="prototype-theme" />

      <Divider />
      <div className="ocs-prototype-demo-menu__section">
        <Content component="p" className="ocs-prototype-demo-menu__label">
          Permission
        </Content>
        <ToggleGroup aria-label="Demo permission" isCompact>
          {(
            [
              ["edit", "Can act"],
              ["view", "View only"],
              ["no-access", "No access"],
            ] as [DemoPermission, string][]
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={demo.permission === id}
              onChange={() => demo.setPermission(id)}
            />
          ))}
        </ToggleGroup>
      </div>

      {area === "gitops" ? (
        <>
          <Divider />
          <div className="ocs-prototype-demo-menu__section">
            <Content component="p" className="ocs-prototype-demo-menu__label">
              Rollout actions
            </Content>
            <ToggleGroup aria-label="Rollout design option" isCompact>
              {(
                [
                  ["option-a", "Sticky toolbar"],
                  ["option-b", "First-row kebab"],
                ] as [GitOpsDesignOption, string][]
              ).map(([id, label]) => (
                <ToggleGroupItem
                  key={id}
                  text={label}
                  isSelected={demo.gitopsOption === id}
                  onChange={() => demo.setGitopsOption(id)}
                />
              ))}
            </ToggleGroup>
          </div>
          <div className="ocs-prototype-demo-menu__section">
            <Content component="p" className="ocs-prototype-demo-menu__label">
              Scenario
            </Content>
            <ToggleGroup aria-label="Rollout scenario" isCompact>
              {(
                [
                  ["paused", "Paused"],
                  ["healthy", "Healthy"],
                  ["scaling-down", "Aborting"],
                ] as [GitOpsScenario, string][]
              ).map(([id, label]) => (
                <ToggleGroupItem
                  key={id}
                  text={label}
                  isSelected={demo.gitopsScenario === id}
                  onChange={() => demo.setGitopsScenario(id)}
                />
              ))}
            </ToggleGroup>
          </div>
        </>
      ) : null}

      {area === "cluster-update" ? (
        <>
          <Divider />
          <div className="ocs-prototype-demo-menu__section">
            <Content component="p" className="ocs-prototype-demo-menu__label">
              Cluster update experience
            </Content>
            <ToggleGroup aria-label="Cluster update experience" isCompact>
              <ToggleGroupItem
                text="Agent-led"
                isSelected={demoVariant === "agent-only"}
                onChange={() => setDemoVariant("agent-only")}
              />
              <ToggleGroupItem
                text="Manual updates"
                isSelected={demoVariant === "manual-and-agent"}
                onChange={() => setDemoVariant("manual-and-agent")}
              />
            </ToggleGroup>
          </div>
          <div className="ocs-prototype-demo-menu__section">
            <Switch
              id="prototype-update-in-progress"
              label="Update in progress"
              isChecked={updateInProgress}
              onChange={(_e, checked) => {
                if (checked) {
                  startClusterUpdateDemo();
                  setUpdateInProgress(true);
                } else {
                  performClusterUpdateDemoReset();
                  setUpdateInProgress(false);
                }
              }}
            />
          </div>
          <Button variant="link" isInline onClick={() => performClusterUpdateDemoReset()}>
            Reset update demo
          </Button>
        </>
      ) : null}

      {area === "general" ? (
        <div className="ocs-prototype-demo-menu__section">
          <Switch
            id="prototype-update-in-progress-general"
            label="Update in progress"
            isChecked={updateInProgress}
            onChange={(_e, checked) => {
              if (checked) {
                startClusterUpdateDemo();
                setUpdateInProgress(true);
              } else {
                performClusterUpdateDemoReset();
                setUpdateInProgress(false);
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <Popover
      isVisible={open}
      shouldClose={() => setOpen(false)}
      position="bottom-end"
      hasAutoWidth
      bodyContent={body}
      aria-label="Prototype demo controls"
    >
      <MenuToggle
        isExpanded={open}
        onClick={() => setOpen((v) => !v)}
        icon={<CogIcon />}
        variant="secondary"
        className="ocs-prototype-demo-menu__toggle"
        aria-label="Prototype controls"
      >
        Prototype controls
      </MenuToggle>
    </Popover>
  );
}

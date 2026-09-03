import { Button, Flex, Icon, Label, Popover } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import type { PodRecord, PodStatus } from "./podListData";

type PodStatusDisplayProps = {
  pod: Pick<PodRecord, "name" | "status">;
  onDebug?: () => void;
  onViewLogs?: () => void;
  onViewEvents?: () => void;
  asLabel?: boolean;
};

export default function PodStatusDisplay({
  pod,
  onDebug,
  onViewLogs,
  onViewEvents,
  asLabel = false,
}: PodStatusDisplayProps) {
  const { status } = pod;

  if (status === "CrashLoopBackOff") {
    const trigger = (
      <button type="button" className="ocs-pod-status-trigger" onClick={(e) => e.stopPropagation()}>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <ExclamationCircleIcon />
          </Icon>
          {asLabel ? (
            <Label color="red" isCompact>
              CrashLoopBackOff
            </Label>
          ) : (
            <span className="ocs-pod-status-trigger__text">CrashLoopBackOff</span>
          )}
        </Flex>
      </button>
    );

    return (
      <Popover
        headerContent="CrashLoopBackOff"
        bodyContent={(hide) => (
          <div className="ocs-pod-status-popover">
            <p>back-off 5m0s restarting failed container {pod.name}</p>
            <div className="ocs-pod-status-popover__actions">
              {onDebug ? (
                <Button
                  variant="link"
                  isInline
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    hide();
                    onDebug();
                  }}
                >
                  Debug
                </Button>
              ) : null}
              {onViewLogs ? (
                <Button
                  variant="link"
                  isInline
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    hide();
                    onViewLogs();
                  }}
                >
                  View logs
                </Button>
              ) : null}
              {onViewEvents ? (
                <Button
                  variant="link"
                  isInline
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    hide();
                    onViewEvents();
                  }}
                >
                  View events
                </Button>
              ) : (
                <Button
                  variant="link"
                  isInline
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    hide();
                  }}
                >
                  View events
                </Button>
              )}
            </div>
          </div>
        )}
      >
        {trigger}
      </Popover>
    );
  }

  return statusInner(status, asLabel);
}

function statusInner(status: PodStatus, asLabel: boolean) {
  switch (status) {
    case "Running":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="success" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          {asLabel ? (
            <Label color="green" isCompact>
              {status}
            </Label>
          ) : (
            <span>{status}</span>
          )}
        </Flex>
      );
    case "Pending":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="warning" aria-hidden>
            <ClockIcon />
          </Icon>
          {asLabel ? (
            <Label color="orange" isCompact>
              {status}
            </Label>
          ) : (
            <span>{status}</span>
          )}
        </Flex>
      );
    case "Failed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <TimesCircleIcon />
          </Icon>
          {asLabel ? (
            <Label color="red" isCompact>
              {status}
            </Label>
          ) : (
            <span>{status}</span>
          )}
        </Flex>
      );
    case "Succeeded":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="info" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          {asLabel ? (
            <Label color="blue" isCompact>
              {status}
            </Label>
          ) : (
            <span>{status}</span>
          )}
        </Flex>
      );
    default:
      return <span>{status}</span>;
  }
}

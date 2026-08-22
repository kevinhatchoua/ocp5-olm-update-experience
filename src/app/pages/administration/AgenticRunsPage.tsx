import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Alert,
  Button,
  Content,
  Flex,
  Label,
  Switch,
  Title,
  Tooltip,
} from "@patternfly/react-core";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import QuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { LIGHTSPEED_AUTONOMOUS_FEATURES_DISCLAIMER } from "../../components/lightspeed/LightspeedLegalCopy";
import {
  AGENTIC_RUNS_LIST_PATH,
  agenticRunPath,
} from "../../constants/agenticUpdateRuns";
import { useUpdatePlans } from "../../lib/updatePlansStore";
import { UpdatePlanActionsKebab } from "../../components/cluster-update/ActiveUpdatePlansTable";

type RunFilters = { name: string };

function ResourceKindLabel({ abbrev, color }: { abbrev: string; color: "blue" | "green" }) {
  return (
    <Label color={color} isCompact className="ocs-resource-label">
      {abbrev}
    </Label>
  );
}

export default function AgenticRunsPage() {
  const [capabilitiesEnabled, setCapabilitiesEnabled] = useState(false);
  const plans = useUpdatePlans();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RunFilters>({
    initialFilters: { name: "" },
  });

  const rows = useMemo(() => {
    const query = (filters.name ?? "").trim().toLowerCase();
    if (!query) return plans;
    return plans.filter((run) => run.id.toLowerCase().includes(query));
  }, [filters.name, plans]);

  return (
    <div className="ocs-app-page-outer flex-1 min-w-0 min-h-0 overflow-y-auto">
      <Breadcrumbs items={[{ label: "Agentic runs" }]}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <Title headingLevel="h1" size="2xl" id="main-title">
                Agentic runs
              </Title>
              <Label color="orange" isCompact>
                Dev preview
              </Label>
            </Flex>
            <FavoriteButton name="Agentic runs" path={AGENTIC_RUNS_LIST_PATH} />
          </Flex>

          <Alert isInline variant="custom" customIcon={<InfoCircleIcon />} title={LIGHTSPEED_AUTONOMOUS_FEATURES_DISCLAIMER} />

          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Content component="p">Agentic capabilities</Content>
              <Tooltip content="When enabled, OpenShift Lightspeed can start autonomous analysis and remediation runs on this cluster.">
                <Button variant="plain" icon={<QuestionCircleIcon />} aria-label="About agentic capabilities" />
              </Tooltip>
            </Flex>
            <Switch
              id="agentic-capabilities"
              isChecked={capabilitiesEnabled}
              onChange={(_event, checked) => setCapabilitiesEnabled(checked)}
              aria-label="Agentic capabilities"
            />
          </Flex>

            <DataView ouiaId="agentic-runs-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
              <DataViewToolbar
                ouiaId="agentic-runs-dv-toolbar"
                id="agentic-runs-dv-toolbar"
                className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<RunFilters>
                    values={filters}
                    onChange={
                      ((_filterId: string, partial: Partial<Record<"name", unknown>>) =>
                        onSetFilters(partial as Partial<RunFilters>)) as never
                    }
                    breakpoint="xl"
                    midContent={null}
                  >
                    <DataViewTextFilter
                      title="Name"
                      filterId="name"
                      placeholder="Search by name..."
                      style={{ minWidth: "16rem", maxWidth: "100%" }}
                    />
                  </IoDataViewFiltersWithMidActions>
                }
              />

              <OcsPrototypeListTable ariaLabel="Agentic runs">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Namespace">
                      <PlainTableHeader label="Namespace" />
                    </Th>
                    <Th dataLabel="Trigger domain">
                      <PlainTableHeader label="Trigger domain" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Tokens consumed">
                      <PlainTableHeader label="Tokens consumed" />
                    </Th>
                    <Th dataLabel="Created">
                      <PlainTableHeader label="Created" />
                    </Th>
                    <Th modifier="fitContent" screenReaderText="Actions" />
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} dataLabel="Empty state">
                        <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                          No agentic runs match your filters.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    rows.map((run) => (
                      <Tr key={run.id}>
                        <Td dataLabel="Name">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <ResourceKindLabel abbrev="AR" color="blue" />
                            <Button
                              variant="link"
                              isInline
                              component={(props) => <Link {...props} to={agenticRunPath(run.id)} />}
                            >
                              {run.id}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Namespace">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <ResourceKindLabel abbrev="NS" color="green" />
                            <Button
                              variant="link"
                              isInline
                              component={(props) => <Link {...props} to="/administration/namespaces" />}
                            >
                              {run.namespace}
                            </Button>
                          </Flex>
                        </Td>
                        <Td dataLabel="Trigger domain">
                          <Label isCompact>{run.triggerDomain}</Label>
                        </Td>
                        <Td dataLabel="Status">
                          <Label
                            color={
                              run.status === "Completed"
                                ? "green"
                                : run.status === "Failed"
                                  ? "red"
                                  : run.status === "Cancelled"
                                    ? "grey"
                                    : "blue"
                            }
                            isCompact
                          >
                            {run.status}
                          </Label>
                        </Td>
                        <Td dataLabel="Tokens consumed">{run.tokensConsumed}</Td>
                        <Td dataLabel="Created">
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <ClockIcon aria-hidden className="ocs-pods-list__created-icon" />
                            <Content component="small">{run.created}</Content>
                          </Flex>
                        </Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <UpdatePlanActionsKebab run={run} includeViewDetails />
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </OcsPrototypeListTable>
            </DataView>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

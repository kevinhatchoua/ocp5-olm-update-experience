import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import type { NodeGpuMetrics } from "./nodeGpuMetricsData";

function gpuDeviceName(device: NodeGpuMetrics["devices"][number]) {
  return device.label;
}

type NodeDetailsGpuMetricsProps = {
  metrics: NodeGpuMetrics;
};

export default function NodeDetailsGpuMetrics({ metrics }: NodeDetailsGpuMetricsProps) {
  const hasLeftSummary = Boolean(metrics.count || metrics.model);
  const hasRightSummary = Boolean(metrics.capacity || metrics.allocatable);

  return (
    <section className="ocs-node-details__panel" aria-label="GPU metrics">
      <Title headingLevel="h2" size="xl" className="ocs-node-gpu-metrics__title">
        GPU metrics
      </Title>

      {(hasLeftSummary || hasRightSummary) && (
        <div className="ocs-node-details__columns ocs-node-gpu-metrics__summary">
          {hasLeftSummary && (
            <div className="ocs-node-details__column">
              <DescriptionList isHorizontal isCompact className="ocs-node-details__dl" aria-label="GPU summary">
                {metrics.count && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU count</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.count}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {metrics.model && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU model</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.model}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </div>
          )}
          {hasRightSummary && (
            <div className="ocs-node-details__column">
              <DescriptionList isHorizontal isCompact className="ocs-node-details__dl" aria-label="GPU capacity summary">
                {metrics.capacity && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU capacity</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.capacity}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {metrics.allocatable && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU allocatable</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.allocatable}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </div>
          )}
        </div>
      )}

      {metrics.devices.length > 0 && (
        <div className="ocs-node-gpu-metrics__table-wrap">
          <OcsNamedResourceDataView
            ouiaId="node-gpu-devices-data-view"
            ariaLabel="GPU metrics per device"
            itemsLabel="GPU devices"
            items={metrics.devices}
            getName={gpuDeviceName}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="GPU device">
                      <PlainTableHeader label="GPU device" />
                    </Th>
                    <Th dataLabel="Utilization">
                      <PlainTableHeader label="Utilization" />
                    </Th>
                    <Th dataLabel="Temperature">
                      <PlainTableHeader label="Temperature" />
                    </Th>
                    <Th dataLabel="Power usage">
                      <PlainTableHeader label="Power usage" />
                    </Th>
                    <Th dataLabel="FB memory used">
                      <PlainTableHeader label="FB memory used" />
                    </Th>
                    <Th dataLabel="FB memory free">
                      <PlainTableHeader label="FB memory free" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((device) => (
                    <Tr key={device.id}>
                      <Td dataLabel="GPU device">
                        <Content component="small">{device.label}</Content>
                      </Td>
                      <Td dataLabel="Utilization">
                        <Content component="small">{device.utilization}</Content>
                      </Td>
                      <Td dataLabel="Temperature">
                        <Content component="small">{device.temperature}</Content>
                      </Td>
                      <Td dataLabel="Power usage">
                        <Content component="small">{device.power}</Content>
                      </Td>
                      <Td dataLabel="FB memory used">
                        <Content component="small">{device.fbUsed}</Content>
                      </Td>
                      <Td dataLabel="FB memory free">
                        <Content component="small">{device.fbFree}</Content>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        </div>
      )}
    </section>
  );
}

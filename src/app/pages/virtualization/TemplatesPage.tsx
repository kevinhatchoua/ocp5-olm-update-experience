import { Button, Flex, Label } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { TEMPLATES } from "./virtualizationMockData";
import { VirtListEmptyPanel, VirtResourceTableShell } from "./virtualizationShared";

function templateName(row: (typeof TEMPLATES)[number]) {
  return row.name;
}

export default function TemplatesPage() {
  if (TEMPLATES.length === 0) {
    return (
      <VirtResourceTableShell title="Templates" path="/virtualization/templates" createLabel="Create Template">
        <VirtListEmptyPanel resource="Template" createLabel="Create Template" />
      </VirtResourceTableShell>
    );
  }

  return (
    <VirtResourceTableShell title="Templates" path="/virtualization/templates" createLabel="Create Template">
      <OcsNamedResourceDataView
        ouiaId="templates-data-view"
        ariaLabel="Templates"
        itemsLabel="templates"
        items={TEMPLATES}
        getName={templateName}
      >
        {(rows) => (
          <>
            <Thead>
              <Tr>
                <Th dataLabel="Name">
                  <PlainTableHeader label="Name" />
                </Th>
                <Th dataLabel="Namespace">
                  <PlainTableHeader label="Namespace" />
                </Th>
                <Th dataLabel="Operating system">
                  <PlainTableHeader label="Operating system" />
                </Th>
                <Th dataLabel="Workload">
                  <PlainTableHeader label="Workload" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.name}>
                  <Td dataLabel="Name">
                    <Button variant="link" isInline>
                      {row.name}
                    </Button>
                  </Td>
                  <Td dataLabel="Namespace">
                    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                      <Label color="green" isCompact className="ocs-resource-label">
                        NS
                      </Label>
                      {row.namespace}
                    </Flex>
                  </Td>
                  <Td dataLabel="Operating system">{row.os}</Td>
                  <Td dataLabel="Workload">{row.workload}</Td>
                </Tr>
              ))}
            </Tbody>
          </>
        )}
      </OcsNamedResourceDataView>
    </VirtResourceTableShell>
  );
}

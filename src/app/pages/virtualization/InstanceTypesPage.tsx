import { Button } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { INSTANCE_TYPES } from "./virtualizationMockData";
import { VirtResourceTableShell } from "./virtualizationShared";

function instanceTypeName(row: (typeof INSTANCE_TYPES)[number]) {
  return row.name;
}

export default function InstanceTypesPage() {
  return (
    <VirtResourceTableShell title="InstanceTypes" path="/virtualization/instancetypes">
      <OcsNamedResourceDataView
        ouiaId="instance-types-data-view"
        ariaLabel="InstanceTypes"
        itemsLabel="instance types"
        items={INSTANCE_TYPES}
        getName={instanceTypeName}
      >
        {(rows) => (
          <>
            <Thead>
              <Tr>
                <Th dataLabel="Name">
                  <PlainTableHeader label="Name" />
                </Th>
                <Th dataLabel="Series">
                  <PlainTableHeader label="Series" />
                </Th>
                <Th dataLabel="CPU">
                  <PlainTableHeader label="CPU" />
                </Th>
                <Th dataLabel="Memory">
                  <PlainTableHeader label="Memory" />
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
                  <Td dataLabel="Series">{row.series}</Td>
                  <Td dataLabel="CPU">{row.cpu}</Td>
                  <Td dataLabel="Memory">{row.memory}</Td>
                </Tr>
              ))}
            </Tbody>
          </>
        )}
      </OcsNamedResourceDataView>
    </VirtResourceTableShell>
  );
}

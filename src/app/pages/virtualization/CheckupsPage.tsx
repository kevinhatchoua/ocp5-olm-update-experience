import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { VirtResourceTableShell } from "./virtualizationShared";

const CHECKUPS = [
  { name: "kubevirt-vm", description: "Validate VirtualMachine scheduling and storage" },
  { name: "kubevirt-storage", description: "Validate storage access for VMs" },
];

function checkupName(row: (typeof CHECKUPS)[number]) {
  return row.name;
}

export default function CheckupsPage() {
  return (
    <VirtResourceTableShell title="Checkups" path="/virtualization/checkups">
      <OcsNamedResourceDataView
        ouiaId="checkups-data-view"
        ariaLabel="Checkups"
        itemsLabel="checkups"
        items={CHECKUPS}
        getName={checkupName}
      >
        {(rows) => (
          <>
            <Thead>
              <Tr>
                <Th dataLabel="Name">
                  <PlainTableHeader label="Name" />
                </Th>
                <Th dataLabel="Description">
                  <PlainTableHeader label="Description" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.name}>
                  <Td dataLabel="Name">{row.name}</Td>
                  <Td dataLabel="Description">{row.description}</Td>
                </Tr>
              ))}
            </Tbody>
          </>
        )}
      </OcsNamedResourceDataView>
    </VirtResourceTableShell>
  );
}

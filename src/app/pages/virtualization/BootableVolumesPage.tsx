import { Button } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { BOOT_VOLUMES } from "./virtualizationMockData";
import { VirtResourceTableShell } from "./virtualizationShared";

function bootVolumeName(row: (typeof BOOT_VOLUMES)[number]) {
  return row.name;
}

export default function BootableVolumesPage() {
  return (
    <VirtResourceTableShell
      title="Bootable volumes"
      path="/virtualization/bootablevolumes"
      createLabel="Create BootableVolume"
    >
      <OcsNamedResourceDataView
        ouiaId="bootable-volumes-data-view"
        ariaLabel="Bootable volumes"
        itemsLabel="bootable volumes"
        items={BOOT_VOLUMES}
        getName={bootVolumeName}
      >
        {(rows) => (
          <>
            <Thead>
              <Tr>
                <Th dataLabel="Name">
                  <PlainTableHeader label="Name" />
                </Th>
                <Th dataLabel="Operating system">
                  <PlainTableHeader label="Operating system" />
                </Th>
                <Th dataLabel="Storage class">
                  <PlainTableHeader label="Storage class" />
                </Th>
                <Th dataLabel="Size">
                  <PlainTableHeader label="Size" />
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
                  <Td dataLabel="Operating system">{row.operatingSystem}</Td>
                  <Td dataLabel="Storage class">{row.storageClass}</Td>
                  <Td dataLabel="Size">{row.size}</Td>
                </Tr>
              ))}
            </Tbody>
          </>
        )}
      </OcsNamedResourceDataView>
    </VirtResourceTableShell>
  );
}

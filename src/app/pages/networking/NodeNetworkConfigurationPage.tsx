import { useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownList, Flex, MenuToggle } from "@patternfly/react-core";
import {
  DataViewTextFilter,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { useToast } from "../../contexts/ToastContext";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import NodeNetworkConfigurationWizard from "./NodeNetworkConfigurationWizard";
import NodeNmStatePanel from "./NodeNmStatePanel";
import { NetworkingPageShell } from "./networkingShared";
import { useNodeNetworkConfigurationCreate } from "./useNodeNetworkConfigurationCreate";

type NncFilters = { name: string };

export default function NodeNetworkConfigurationPage() {
  const { filters, onSetFilters } = useDataViewFilters<NncFilters>({
    filters: { name: "" },
  });
  const { pushToast, dismissToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);

  const {
    showFormWizard,
    openFormWizard,
    closeFormWizard,
    activeStep,
    setActiveStep,
    physicalNetworkName,
    setPhysicalNetworkName,
    isCreating,
    handleCreateConfiguration,
  } = useNodeNetworkConfigurationCreate(pushToast, dismissToast);

  return (
    <>
      <NetworkingPageShell
        title="Node network configuration"
        path="/networking/node-network-configuration"
        createButton={
          showFormWizard ? undefined : (
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
              <Dropdown
                isOpen={createOpen}
                onOpenChange={(open) => setCreateOpen(open)}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setCreateOpen((o) => !o)} variant="primary">
                    Create
                  </MenuToggle>
                )}
                popperProps={{ position: "right" }}
              >
                <DropdownList>
                  <DropdownItem
                    itemId="from-form"
                    onClick={() => {
                      setCreateOpen(false);
                      openFormWizard();
                    }}
                  >
                    From Form
                  </DropdownItem>
                  <DropdownItem itemId="with-yaml">With YAML</DropdownItem>
                </DropdownList>
              </Dropdown>
              <IoDataViewFiltersWithMidActions<NncFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
              >
                <DataViewTextFilter
                  title="Name"
                  filterId="name"
                  placeholder="Filter"
                  style={{ minWidth: "12rem" }}
                />
              </IoDataViewFiltersWithMidActions>
            </Flex>
          )
        }
      >
        {showFormWizard ? (
          <NodeNetworkConfigurationWizard
            activeStep={activeStep}
            physicalNetworkName={physicalNetworkName}
            onActiveStepChange={setActiveStep}
            onPhysicalNetworkNameChange={setPhysicalNetworkName}
            onClose={closeFormWizard}
            onCreate={handleCreateConfiguration}
            isCreating={isCreating}
          />
        ) : (
          <NodeNmStatePanel nameFilter={filters.name} />
        )}
      </NetworkingPageShell>
    </>
  );
}

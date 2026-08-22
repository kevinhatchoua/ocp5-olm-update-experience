import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../dataView/OcsPrototypeListTable";
import {
  agenticRunPath,
  type AgenticAnalysisPhase,
  type AgenticUpdateRun,
} from "../../constants/agenticUpdateRuns";
import {
  deleteUpdatePlan,
  downloadUpdatePlanReport,
  useUpdatePlans,
} from "../../lib/updatePlansStore";

export function AnalysisPhaseLabel({ phase }: { phase: AgenticAnalysisPhase }) {
  const color =
    phase === "Analysed" ? "green" : phase === "Failed" ? "red" : phase === "Cancelled" ? "grey" : "blue";
  const text = phase === "Analysed" ? "Analyzed" : phase;
  return (
    <Label color={color} isCompact>
      {text}
    </Label>
  );
}

export function AnalyzingLabel() {
  return <AnalysisPhaseLabel phase="Analyzing" />;
}

export function NotRecommendedLabel() {
  return (
    <Label color="red" isCompact>
      NOT RECOMMENDED
    </Label>
  );
}

function runId(run: AgenticUpdateRun) {
  return run.id;
}

export function UpdatePlanActionsKebab({
  run,
  includeViewDetails = false,
}: {
  run: AgenticUpdateRun;
  includeViewDetails?: boolean;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        onSelect={() => setOpen(false)}
        popperProps={{ position: "right" }}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            variant="plain"
            aria-label={`Actions for ${run.id}`}
            onClick={() => setOpen((value) => !value)}
            icon={<EllipsisVIcon />}
          />
        )}
      >
        <DropdownList>
          {includeViewDetails ? (
            <DropdownItem itemId="view" onClick={() => navigate(agenticRunPath(run.id))}>
              View details
            </DropdownItem>
          ) : null}
          <DropdownItem itemId="download" onClick={() => downloadUpdatePlanReport(run)}>
            Download report
          </DropdownItem>
          <DropdownItem itemId="delete" isDanger onClick={() => setConfirmDelete(true)}>
            Delete report
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      <Modal
        variant="small"
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby={`delete-plan-${run.id}-title`}
      >
        <ModalHeader title="Delete update plan report?" labelId={`delete-plan-${run.id}-title`} />
        <ModalBody>
          This removes <strong>{run.id}</strong> from Update plans. This prototype record cannot be recovered.
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            onClick={() => {
              deleteUpdatePlan(run.id);
              setConfirmDelete(false);
            }}
          >
            Delete
          </Button>
          <Button variant="link" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export function ActiveUpdatePlansTable({
  runs,
}: {
  runs?: AgenticUpdateRun[];
}) {
  const storedRuns = useUpdatePlans();
  const items = runs ?? storedRuns;

  return (
    <OcsNamedResourceDataView
      ouiaId="active-update-plans-data-view"
      ariaLabel="Active update plans"
      itemsLabel="update plans"
      items={items}
      getName={runId}
    >
      {(rows) => (
        <>
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <PlainTableHeader label="Name" />
              </Th>
              <Th dataLabel="Target Version">
                <PlainTableHeader label="Target Version" />
              </Th>
              <Th dataLabel="Phase">
                <PlainTableHeader label="Phase" />
              </Th>
              <Th dataLabel="Update Type">
                <PlainTableHeader label="Update Type" />
              </Th>
              <Th dataLabel="Age">
                <PlainTableHeader label="Age" />
              </Th>
              <Th modifier="fitContent" screenReaderText="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((run) => (
              <Tr key={run.id}>
                <Td dataLabel="Name">
                  <Button variant="link" isInline component={(props) => <Link {...props} to={`${agenticRunPath(run.id)}?tab=report`} />}>
                    {run.id}
                  </Button>
                </Td>
                <Td dataLabel="Target Version">{run.targetVersion}</Td>
                <Td dataLabel="Phase">
                  <AnalysisPhaseLabel phase={run.phase} />
                </Td>
                <Td dataLabel="Update Type">{run.updateType}</Td>
                <Td dataLabel="Age">{run.age}</Td>
                <Td dataLabel="Actions" isActionCell hasAction>
                  <UpdatePlanActionsKebab run={run} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </>
      )}
    </OcsNamedResourceDataView>
  );
}

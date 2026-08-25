import { useState } from "react";
import { MenuToggle, Select, SelectList, SelectOption } from "@patternfly/react-core";

export const CONSOLE_PROJECTS = [
  "All projects",
  "default",
  "openshift-ovn-kubernetes",
  "openshift-nmstate",
  "payments",
];

/** OCP namespace bar: `Project: <name> ▾` above breadcrumbs, not a secondary button. */
export default function NamespaceBar() {
  const [project, setProject] = useState("All projects");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ocs-ocp-namespace-bar-strip">
      <Select
        isOpen={isOpen}
        selected={project}
        onSelect={(_e, value) => {
          setProject(String(value));
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            variant="plainText"
            className="ocs-ocp-namespace-toggle"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
            aria-label="Project"
          >
            Project: {project}
          </MenuToggle>
        )}
      >
        <SelectList>
          {CONSOLE_PROJECTS.map((option) => (
            <SelectOption key={option} value={option}>
              {option}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}

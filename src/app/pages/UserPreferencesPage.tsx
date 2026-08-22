import { useState } from "react";
import {
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Sidebar,
  SidebarContent,
  SidebarPanel,
  Title,
} from "@patternfly/react-core";
import PatternFlyThemeControls from "../components/PatternFlyThemeControls";

type PrefTab = "general" | "language";

const LAST_VIEWED = "last-viewed";

/**
 * OpenShift-aligned User Preferences (General + Language).
 * Theme uses PatternFly 6 tiers: Theme, Color scheme, Contrast mode.
 */
export default function UserPreferencesPage() {
  const [activeTab, setActiveTab] = useState<PrefTab>("general");
  const [perspective, setPerspective] = useState(LAST_VIEWED);
  const [project, setProject] = useState(LAST_VIEWED);
  const [topology, setTopology] = useState(LAST_VIEWED);
  const [editMethod, setEditMethod] = useState(LAST_VIEWED);
  const [language, setLanguage] = useState("browser-default");

  return (
    <div className="ocs-app-page-outer">
      <Title headingLevel="h1" className="pf-v6-u-mb-sm">
        User Preferences
      </Title>
      <Content component="p" className="pf-v6-u-mb-lg">
        Set your individual preferences for the console experience. Any changes will be autosaved.
      </Content>

      <Sidebar hasGutter hasBorder>
        <SidebarPanel width={{ default: "width_25" }}>
          <nav aria-label="User preference categories">
            <ul className="pf-v6-c-jump-links pf-m-vertical" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {(
                [
                  ["general", "General"],
                  ["language", "Language"],
                ] as const
              ).map(([id, label]) => (
                <li key={id} style={{ marginBottom: "0.25rem" }}>
                  <button
                    type="button"
                    className="pf-v6-c-button pf-m-link"
                    aria-current={activeTab === id ? "page" : undefined}
                    onClick={() => setActiveTab(id)}
                    style={{
                      justifyContent: "flex-start",
                      width: "100%",
                      borderInlineStart:
                        activeTab === id
                          ? "3px solid var(--pf-t--global--border--color--brand--default)"
                          : "3px solid transparent",
                      borderRadius: 0,
                      paddingInlineStart: "0.75rem",
                      fontWeight: activeTab === id ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </SidebarPanel>
        <SidebarContent>
          {activeTab === "general" ? (
            <Form isWidthLimited>
              <FormGroup label="Appearance" fieldId="user-pref-appearance">
                <PatternFlyThemeControls idPrefix="user-pref-theme" />
                <Content component="small" className="pf-v6-u-mt-sm">
                  Theme, color scheme, and contrast mode apply immediately and persist for this prototype.
                  High contrast and glass are mutually exclusive.
                </Content>
              </FormGroup>

              <FormGroup label="Perspective" fieldId="user-pref-perspective">
                <FormSelect
                  id="user-pref-perspective"
                  value={perspective}
                  onChange={(_e, value) => setPerspective(value)}
                  aria-label="Perspective"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="admin" label="Administrator" />
                  <FormSelectOption value="dev" label="Developer" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  If a perspective is not selected, the console defaults to the last viewed.
                </Content>
              </FormGroup>

              <FormGroup label="Project" fieldId="user-pref-project">
                <FormSelect
                  id="user-pref-project"
                  value={project}
                  onChange={(_e, value) => setProject(value)}
                  aria-label="Project"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="all" label="All Projects" />
                  <FormSelectOption value="default" label="default" />
                  <FormSelectOption value="openshift" label="openshift" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  If a project is not selected, the console defaults to the last viewed.
                </Content>
              </FormGroup>

              <FormGroup label="Topology" fieldId="user-pref-topology">
                <FormSelect
                  id="user-pref-topology"
                  value={topology}
                  onChange={(_e, value) => setTopology(value)}
                  aria-label="Topology"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="graph" label="Graph" />
                  <FormSelectOption value="list" label="List" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  If a topology view is not selected, the console defaults to the last viewed.
                </Content>
              </FormGroup>

              <FormGroup label="Create/Edit resource method" fieldId="user-pref-edit-method">
                <FormSelect
                  id="user-pref-edit-method"
                  value={editMethod}
                  onChange={(_e, value) => setEditMethod(value)}
                  aria-label="Create/Edit resource method"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="form" label="Form" />
                  <FormSelectOption value="yaml" label="YAML" />
                </FormSelect>
              </FormGroup>
            </Form>
          ) : (
            <Form isWidthLimited>
              <FormGroup label="Language" fieldId="user-pref-language">
                <FormSelect
                  id="user-pref-language"
                  value={language}
                  onChange={(_e, value) => setLanguage(value)}
                  aria-label="Language"
                >
                  <FormSelectOption value="browser-default" label="Browser default" />
                  <FormSelectOption value="en" label="English" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  Language changes apply after you reload the console.
                </Content>
              </FormGroup>
            </Form>
          )}
        </SidebarContent>
      </Sidebar>
    </div>
  );
}

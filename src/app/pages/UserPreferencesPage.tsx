import { useEffect, useState } from "react";
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
import {
  applyThemeToDocument,
  readThemePreferences,
  writeThemePreferences,
  type ColorTheme,
} from "@/lib/documentTheme";

type PrefTab = "general" | "language";

const LAST_VIEWED = "last-viewed";

/**
 * OpenShift-aligned User Preferences (General + Language).
 * Theme changes apply immediately and persist like the real console.
 */
export default function UserPreferencesPage() {
  const [activeTab, setActiveTab] = useState<PrefTab>("general");
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => readThemePreferences().colorTheme);
  const [perspective, setPerspective] = useState(LAST_VIEWED);
  const [project, setProject] = useState(LAST_VIEWED);
  const [topology, setTopology] = useState(LAST_VIEWED);
  const [editMethod, setEditMethod] = useState(LAST_VIEWED);
  const [language, setLanguage] = useState("browser-default");

  useEffect(() => {
    const prefs = readThemePreferences();
    setColorTheme(prefs.colorTheme);
  }, []);

  const persistTheme = (nextTheme: ColorTheme) => {
    setColorTheme(nextTheme);
    const current = readThemePreferences();
    const next = { ...current, colorTheme: nextTheme };
    writeThemePreferences(next);
    applyThemeToDocument(next);
  };

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
              <FormGroup label="Theme" fieldId="user-pref-theme">
                <FormSelect
                  id="user-pref-theme"
                  value={colorTheme}
                  onChange={(_e, value) => persistTheme(value as ColorTheme)}
                  aria-label="Theme"
                >
                  <FormSelectOption value="system" label="System default" />
                  <FormSelectOption value="light" label="Light" />
                  <FormSelectOption value="dark" label="Dark" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  The console uses this theme each time you log in. System default follows your operating system
                  setting.
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

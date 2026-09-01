/**
 * Guided Create wizards (P4 / GITOPS-10917) — prototype entry points.
 * Full multi-step wizards can replace these stubs; Create buttons on list pages
 * navigate here so the UX surface exists and is prioritised over YAML-only create.
 */
import { useNavigate, useSearchParams } from "react-router";
import {
  Button,
  Content,
  Flex,
  Form,
  FormGroup,
  TextInput,
  Title,
  Wizard,
  WizardStep,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useToast } from "../../contexts/ToastContext";

const KIND_LABEL: Record<string, string> = {
  application: "Application",
  applicationset: "ApplicationSet",
  appproject: "AppProject",
  rollout: "Rollout",
  argocd: "Argo CD",
  imageupdater: "ImageUpdater",
};

export default function GitOpsCreateWizardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pushToast } = useToast();
  const kind = (params.get("kind") || "application").toLowerCase();
  const label = KIND_LABEL[kind] ?? "Application";
  const listPath =
    kind === "rollout"
      ? "/gitops/rollouts"
      : kind === "applicationset"
        ? "/gitops/applicationsets"
        : kind === "appproject"
          ? "/gitops/appprojects"
          : kind === "argocd"
            ? "/gitops/argocd"
            : kind === "imageupdater"
              ? "/gitops/imageupdaters"
              : "/gitops/applications";

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: `Create ${label}` },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Title headingLevel="h1" size="2xl">
            Create {label}
          </Title>
          <Content component="p">
            Guided create wizard (GITOPS-10917 P4). Replaces/supplements YAML-template create for {label}.
          </Content>
          <Wizard
            height={420}
            title={`Create ${label}`}
            onClose={() => navigate(listPath)}
            footer={{
              nextButtonText: "Next",
              backButtonText: "Back",
              cancelButtonText: "Cancel",
              onClose: () => navigate(listPath),
            }}
          >
            <WizardStep id="basics" name="Basics" footer={{ nextButtonText: "Next" }}>
              <Form>
                <FormGroup label="Name" isRequired fieldId="gitops-create-name">
                  <TextInput id="gitops-create-name" name="name" defaultValue={`demo-${kind}`} />
                </FormGroup>
                <FormGroup label="Namespace" isRequired fieldId="gitops-create-ns">
                  <TextInput id="gitops-create-ns" name="namespace" defaultValue="argocd" />
                </FormGroup>
              </Form>
            </WizardStep>
            <WizardStep id="source" name="Source" footer={{ nextButtonText: "Next" }}>
              <Form>
                <FormGroup label="Repository URL" fieldId="gitops-create-repo">
                  <TextInput
                    id="gitops-create-repo"
                    name="repo"
                    defaultValue="https://github.com/argoproj/argocd-example-apps.git"
                  />
                </FormGroup>
                <FormGroup label="Path" fieldId="gitops-create-path">
                  <TextInput id="gitops-create-path" name="path" defaultValue="guestbook" />
                </FormGroup>
              </Form>
            </WizardStep>
            <WizardStep
              id="review"
              name="Review"
              footer={{
                nextButtonText: "Create",
                onNext: () => {
                  pushToast({
                    variant: "success",
                    title: `Created ${label} (prototype)`,
                  });
                  navigate(listPath);
                },
              }}
            >
              <Content component="p">
                Review configuration and create. This prototype records success via toast and returns to the list.
              </Content>
              <Button
                variant="link"
                onClick={() => {
                  pushToast({ variant: "success", title: `Created ${label} (prototype)` });
                  navigate(listPath);
                }}
              >
                Create {label}
              </Button>
            </WizardStep>
          </Wizard>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button, Content, Flex, Title } from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import Breadcrumbs from "../Breadcrumbs";

type Crumb = { label: string; path?: string };

type ResourceCreatePageShellProps = {
  breadcrumbs: Crumb[];
  title: string;
  description?: string;
  listPath: string;
  children: ReactNode;
  canCreate?: boolean;
  onCreate: () => void;
  yamlText?: string;
  showDownload?: boolean;
};

function downloadYaml(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ResourceCreatePageShell({
  breadcrumbs,
  title,
  description,
  listPath,
  children,
  canCreate = true,
  onCreate,
  yamlText,
  showDownload = false,
}: ResourceCreatePageShellProps) {
  const safeFilename = title.replace(/^Create\s+/i, "").replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();

  return (
    <div className="ocs-app-page-outer ocs-resource-create-page w-full">
      <Breadcrumbs items={breadcrumbs}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <div>
            <Title headingLevel="h1" size="2xl">
              {title}
            </Title>
            {description ? (
              <Content component="p" className="pf-v6-u-mt-sm pf-v6-u-color-200">
                {description}
              </Content>
            ) : null}
          </div>

          <div className="ocs-pods-list__panel ocs-resource-create-page__form">{children}</div>

          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex gap={{ default: "gapSm" }}>
              <Button variant="primary" isDisabled={!canCreate} onClick={onCreate}>
                Create
              </Button>
              <Button variant="secondary" component={Link} to={listPath}>
                Cancel
              </Button>
            </Flex>
            {showDownload && yamlText ? (
              <Button
                variant="secondary"
                icon={<DownloadIcon />}
                onClick={() => downloadYaml(`${safeFilename || "resource"}.yaml`, yamlText)}
              >
                Download
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button, Content, Flex, Title } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { gitopsDetailPath } from "./gitopsData";
import { GitOpsEditDeleteMenu, ResourceName } from "./gitopsShared";

type Column = { key: string; label: string };

type GitOpsSimpleListPageProps<T extends { name: string; ns: string }> = {
  title: string;
  path: string;
  createLabel: string;
  kind: "Application" | "ApplicationSet" | "ArgoCD" | "AppProject" | "ImageUpdater" | "Promotion";
  detailKind: "applications" | "applicationsets" | "argocd" | "appprojects" | "imageupdaters" | "promotions";
  items: T[];
  columns: Column[];
  renderCell: (item: T, key: string) => ReactNode;
  footnote?: ReactNode;
};

export function GitOpsSimpleListPage<T extends { name: string; ns: string }>({
  title,
  path,
  createLabel,
  kind,
  detailKind,
  items,
  columns,
  renderCell,
  footnote,
}: GitOpsSimpleListPageProps<T>) {
  const navigate = useNavigate();
  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: title, path },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                {title}
              </Title>
              <FavoriteButton name={title} path={path} />
            </Flex>
            <Button
              variant="primary"
              onClick={() => {
                const kindParam =
                  kind === "ApplicationSet"
                    ? "applicationset"
                    : kind === "AppProject"
                      ? "appproject"
                      : kind === "ImageUpdater"
                        ? "imageupdater"
                        : kind === "Promotion"
                          ? "promotion"
                          : "application";
                navigate(`/gitops/create?kind=${kindParam}`);
              }}
            >
              {createLabel}
            </Button>
          </Flex>

          <OcsNamedResourceDataView
            ouiaId={`gitops-${detailKind}-data-view`}
            ariaLabel={title}
            itemsLabel={title.toLowerCase()}
            items={items}
            getName={(item) => item.name}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    {columns.map((col) => (
                      <Th key={col.key} dataLabel={col.label}>
                        <PlainTableHeader label={col.label} />
                      </Th>
                    ))}
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((item) => {
                    const href = gitopsDetailPath(detailKind, item.ns, item.name);
                    return (
                      <Tr key={`${item.ns}/${item.name}`} onClick={() => navigate(href)}>
                        {columns.map((col) => (
                          <Td key={col.key} dataLabel={col.label}>
                            {col.key === "name" ? (
                              <ResourceName kind={kind} name={item.name} to={href} />
                            ) : col.key === "namespace" ? (
                              <ResourceName kind="Namespace" name={item.ns} />
                            ) : (
                              renderCell(item, col.key)
                            )}
                          </Td>
                        ))}
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <GitOpsEditDeleteMenu kind={kind} name={item.name} />
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
          {footnote ? (
            <Content component="small" className="pf-v6-u-color-200">
              {footnote}
            </Content>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

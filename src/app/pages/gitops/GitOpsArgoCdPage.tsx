import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Gallery,
  GalleryItem,
  Label,
  SearchInput,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import ThLargeIcon from "@patternfly/react-icons/dist/esm/icons/th-large-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  ARGO_INSTANCES,
  findArgoCd,
  gitopsDetailPath,
  instanceKeyOf,
  type ArgoCdRecord,
} from "./gitopsData";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName } from "./gitopsShared";

const CARD_THRESHOLD = 6;

export default function GitOpsArgoCdPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"all" | "Healthy" | "Degraded">("all");
  const [view, setView] = useState<"cards" | "list" | "auto">("auto");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARGO_INSTANCES.filter((inst) => {
      if (phase !== "all" && inst.status !== phase) return false;
      if (!q) return true;
      const blob = `${inst.name} ${inst.ns} ${inst.server} ${inst.version}`.toLowerCase();
      return blob.includes(q);
    });
  }, [query, phase]);

  const resolvedView = view === "auto" ? (filtered.length > CARD_THRESHOLD ? "list" : "cards") : view;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "ArgoCD Instances", path: "/gitops/argocd" },
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
                ArgoCD Instances
              </Title>
              <FavoriteButton name="ArgoCD Instances" path="/gitops/argocd" />
            </Flex>
            <Button variant="primary" onClick={() => navigate("/gitops/create?kind=argocd")}>
              Create Argo CD
            </Button>
          </Flex>

          <Toolbar id="gitops-argocd-toolbar">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Filter instances"
                  placeholder="Filter instances..."
                  value={query}
                  onChange={(_e, v) => setQuery(v)}
                  onClear={() => setQuery("")}
                />
              </ToolbarItem>
              <ToolbarItem>
                <ToggleGroup aria-label="Phase filter">
                  {(["all", "Healthy", "Degraded"] as const).map((p) => (
                    <ToggleGroupItem
                      key={p}
                      text={p === "all" ? "All phases" : p}
                      isSelected={phase === p}
                      onChange={() => setPhase(p)}
                    />
                  ))}
                </ToggleGroup>
              </ToolbarItem>
              <ToolbarItem>
                <ToggleGroup aria-label="Instance view">
                  <ToggleGroupItem
                    icon={<ThLargeIcon />}
                    aria-label="Card view"
                    isSelected={resolvedView === "cards"}
                    onChange={() => setView("cards")}
                  />
                  <ToggleGroupItem
                    icon={<ListIcon />}
                    aria-label="List view"
                    isSelected={resolvedView === "list"}
                    onChange={() => setView("list")}
                  />
                </ToggleGroup>
              </ToolbarItem>
              <ToolbarItem variant="label">
                {filtered.length} of {ARGO_INSTANCES.length} instances
                {filtered.length > CARD_THRESHOLD ? " — list view recommended" : ""}
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {resolvedView === "cards" ? (
            <Gallery hasGutter minWidths={{ default: "320px" }}>
              {filtered.map((inst) => (
                <GalleryItem key={instanceKeyOf(inst)}>
                  <InstanceCard inst={inst} onOpen={() => navigate(gitopsDetailPath("argocd", inst.ns, inst.name))} />
                </GalleryItem>
              ))}
            </Gallery>
          ) : (
            <OcsNamedResourceDataView
              ouiaId="gitops-argocd-data-view"
              ariaLabel="ArgoCD Instances"
              itemsLabel="instances"
              items={filtered}
              getName={(item) => item.name}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="Namespace">
                        <PlainTableHeader label="Namespace" />
                      </Th>
                      <Th dataLabel="Status">
                        <PlainTableHeader label="Status" />
                      </Th>
                      <Th dataLabel="App count">
                        <PlainTableHeader label="App count" />
                      </Th>
                      <Th dataLabel="Version">
                        <PlainTableHeader label="Version" />
                      </Th>
                      <Th dataLabel="Created">
                        <PlainTableHeader label="Created" />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((inst) => {
                      const href = gitopsDetailPath("argocd", inst.ns, inst.name);
                      return (
                        <Tr key={instanceKeyOf(inst)} onClick={() => navigate(href)}>
                          <Td dataLabel="Name">
                            <ResourceName kind="ArgoCD" name={inst.name} to={href} />
                          </Td>
                          <Td dataLabel="Namespace">
                            <ResourceName kind="Namespace" name={inst.ns} />
                          </Td>
                          <Td dataLabel="Status">
                            <HealthStatus status={inst.status === "Healthy" ? "Healthy" : "Degraded"} />
                          </Td>
                          <Td dataLabel="App count">{inst.applications}</Td>
                          <Td dataLabel="Version">{inst.version}</Td>
                          <Td dataLabel="Created">{inst.created}</Td>
                          <Td dataLabel="Actions" isActionCell hasAction>
                            <GitOpsEditDeleteMenu kind="ArgoCD" name={inst.name} />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          )}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

function InstanceCard({ inst, onOpen }: { inst: ArgoCdRecord; onOpen: () => void }) {
  const available = inst.status === "Healthy";
  return (
    <Card isClickable>
      <CardHeader
        actions={{
          actions: (
            <span
              style={{ position: "relative", zIndex: 2 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <GitOpsEditDeleteMenu kind="ArgoCD" name={inst.name} />
            </span>
          ),
        }}
        selectableActions={{
          onClickAction: onOpen,
          selectableActionAriaLabel: `Open ${inst.name}`,
        }}
      >
        <CardTitle>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <span>{inst.name}</span>
            <Label color={available ? "green" : "red"} isCompact>
              {available ? "Available" : "Degraded"}
            </Label>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Namespace</DescriptionListTerm>
            <DescriptionListDescription>{inst.ns}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>App count</DescriptionListTerm>
            <DescriptionListDescription>
              {inst.applications === "0" ? (
                "0"
              ) : (
                <Label color="blue" isCompact>
                  {inst.applications}
                </Label>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Resource requests</DescriptionListTerm>
            <DescriptionListDescription>
              CPU: {inst.cpu}, Memory: {inst.memory}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>URL</DescriptionListTerm>
            <DescriptionListDescription>
              <Button
                variant="link"
                isInline
                component="a"
                href={inst.server}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {inst.server.replace(/^https:\/\//, "")}
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created</DescriptionListTerm>
            <DescriptionListDescription>{inst.created}</DescriptionListDescription>
          </DescriptionListGroup>
          {inst.successfulSyncs > 0 ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Successful syncs</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color="green" isCompact>
                  {inst.successfulSyncs}
                </Label>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          <DescriptionListGroup>
            <DescriptionListTerm>Failed syncs (24h)</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color={inst.failedSyncs24h > 0 ? "red" : "green"} isCompact>
                {inst.failedSyncs24h}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster connectivity</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color={inst.clusterConnectivity.startsWith("1") ? "green" : "orange"} isCompact>
                {inst.clusterConnectivity}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Repo pending requests</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color={inst.repoPending > 0 ? "orange" : "green"} isCompact>
                {inst.repoPending}
              </Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
      <CardFooter>
        <Flex gap={{ default: "gapXs" }} flexWrap={{ default: "wrap" }}>
          {(Object.keys(inst.components) as Array<keyof typeof inst.components>).map((comp) => (
            <Label key={comp} color={inst.components[comp] === "Healthy" ? "green" : "red"} isCompact>
              {comp}
            </Label>
          ))}
        </Flex>
      </CardFooter>
    </Card>
  );
}

export function GitOpsArgoCdDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findArgoCd(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/argocd" listTitle="ArgoCD Instances" />;
  return (
    <GitOpsSimpleDetailPage
      kindLabel="Argo CD"
      listPath="/gitops/argocd"
      listTitle="ArgoCD Instances"
      resourceKind="ArgoCD"
      detailKind="argocd"
      title={rec.name}
      ns={rec.ns}
      status={rec.status}
      extraActions={[
        { id: "sync", label: "Refresh" },
        { id: "open-ui", label: "Open Argo CD UI" },
      ]}
      fields={[
        { term: "Name", value: rec.name },
        { term: "Namespace", value: rec.ns },
        { term: "Server", value: rec.server },
        { term: "Version", value: rec.version },
        { term: "Applications", value: rec.applications },
        { term: "CPU", value: rec.cpu },
        { term: "Memory", value: rec.memory },
        { term: "Cluster connectivity", value: rec.clusterConnectivity },
        { term: "Created", value: rec.created },
      ]}
      footnote={
        <Content component="small">
          Component health:{" "}
          {(Object.keys(rec.components) as Array<keyof typeof rec.components>)
            .map((c) => `${c}=${rec.components[c]}`)
            .join(" · ")}
        </Content>
      }
    />
  );
}

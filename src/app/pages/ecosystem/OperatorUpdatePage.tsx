import { useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { Info, ExternalLink, AlertTriangle, CheckCircle } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function OperatorUpdatePage() {
  const { operatorId, operatorName: routeOperatorName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreVersions, setShowMoreVersions] = useState(false);

  const locationState = location.state as { returnTo?: string; operatorName?: string; operatorData?: any } | null;
  const fromClusterUpdate = !!locationState?.returnTo;
  const opData = locationState?.operatorData;

  const operator = opData ? {
    id: operatorId || routeOperatorName,
    name: opData.name,
    currentVersion: opData.version,
    currentChannel: opData.channel,
    targetVersion: opData.updateAvailable,
    targetChannel: opData.channel,
    provider: opData.source === "Built-in" ? "Red Hat" : opData.source || "Red Hat",
    updateStrategy: opData.autoUpdate ? "Automatic" : "Manual",
    updateChannel: opData.channel,
    versions: {
      [opData.channel]: [
        { version: opData.version, status: "current" },
        { version: opData.updateAvailable, status: "target" },
      ],
    },
    relatedOperators: [] as { name: string; status: string; version: string }[],
  } : {
    id: operatorId,
    name: "Abot Operator-v3.0.0",
    currentVersion: "3.0.0",
    currentChannel: "Stable-4.5",
    targetVersion: "3.1.0",
    targetChannel: "Stable-4.5",
    provider: "Refactz Technologies Pvt Ltd",
    updateStrategy: "Manual",
    updateChannel: "stable-4.5",
    versions: {
      "Stable-4.5": [
        { version: "3.0.0", status: "current" },
        { version: "3.0.2", status: "available" },
        { version: "3.0.3", status: "available" },
        { version: "3.0.4", status: "available" },
        { version: "3.0.5", status: "available" },
        { version: "3.1.0", status: "target" },
      ],
      "stable-5.0": [
        { version: "4.0.0", status: "blocked", reason: "Requires cluster update" },
        { version: "4.8.1", status: "future" },
      ],
    },
    relatedOperators: [
      { name: "PostgreSQL", status: "Installed", version: "1.8.0" },
      { name: "PostgreSQL", status: "Pending update", version: "2.1.3" },
      { name: "Kafka Operator", status: "Not Installed", version: "3.0.0" },
      { name: "OpenShift Logging", status: "Not Installed", version: "4.1.0" },
    ],
  };

  const handleApproveUpdate = () => {
    if (fromClusterUpdate && locationState?.returnTo) {
      navigate(locationState.returnTo, {
        state: { updatedOperator: locationState.operatorName, newVersion: operator.targetVersion }
      });
    } else {
      navigate(`/ecosystem/software-catalog/${operator.id}/installing`);
    }
  };

  const handlePreviewUpdate = () => {
    alert("Preview update functionality");
  };

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={fromClusterUpdate ? [
            { label: "Administration", path: "/administration/cluster-settings" },
            { label: "Cluster Update", path: "/administration/cluster-settings" },
            { label: `Update ${operator.name}` },
          ] : [
            { label: "Ecosystem", path: "/ecosystem" },
            { label: "Installed Operators", path: "/ecosystem/installed-operators" },
            { label: operator.name, path: `/ecosystem/software-catalog/${operator.id}` },
          ]}
        >

        <div className="mb-[24px]">
          <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px] mb-[8px]">
            {operator.name}
          </h1>
          <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
            {operator.currentVersion} provided by {operator.provider}
          </p>
        </div>

        {/* Tabs - with Update plan active */}
        <div className="border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] mb-[24px]">
          <div className="flex gap-[24px]">
            <Link
              to={`/ecosystem/software-catalog/${operator.id}`}
              className="pb-[12px] border-b-2 border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white text-[14px] -mb-[1px]"
            >
              Details
            </Link>
            <button className="pb-[12px] border-b-2 border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white text-[14px] -mb-[1px]">
              YAML
            </button>
            <button className="pb-[12px] border-b-2 border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white text-[14px] -mb-[1px]">
              Update plan
            </button>
            <button className="pb-[12px] border-b-2 border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white text-[14px] -mb-[1px]">
              Events
            </button>
            <button className="pb-[12px] border-b-2 border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white text-[14px] -mb-[1px]">
              KubApp
            </button>
          </div>
        </div>

        <div className="flex gap-[24px]">
          {/* Main Content */}
          <div className="flex-1">
            {/* Update Alert */}
            <div className="bg-[#e7f6fd] dark:bg-[rgba(43,154,243,0.15)] border-l-4 border-[#2b9af3] dark:border-[#73bcf7] rounded-[8px] p-[16px] mb-[24px]">
              <div className="flex items-start gap-[12px]">
                <Info className="size-[20px] text-[#2b9af3] dark:text-[#73bcf7] shrink-0 mt-[2px]" />
                <p className="text-[14px] text-[#151515] dark:text-white font-semibold">
                  New version available
                </p>
              </div>
            </div>

            {/* Update Selection */}
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] mb-[24px]">
              <div className="grid grid-cols-2 gap-[24px] mb-[24px]">
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Current channel</p>
                  <div className="flex items-center gap-[12px]">
                    <div className="px-[16px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] text-[14px] text-[#151515] dark:text-white">
                      {operator.currentChannel}
                    </div>
                    <span className="text-[#4d4d4d] dark:text-[#b0b0b0]">→</span>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Target version</p>
                  <select className="w-full px-[16px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] text-[14px] text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7]">
                    <option>{operator.targetChannel}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[24px]">
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Current version</p>
                  <div className="flex items-center gap-[12px]">
                    <div className="px-[16px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] text-[14px] text-[#151515] dark:text-white">
                      {operator.currentVersion}
                    </div>
                    <span className="text-[#4d4d4d] dark:text-[#b0b0b0]">→</span>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Target version</p>
                  <select className="w-full px-[16px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] text-[14px] text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7]">
                    <option>{operator.targetVersion}</option>
                  </select>
                </div>
              </div>

              <div className="mt-[16px]">
                <a
                  href="https://docs.openshift.com/container-platform/latest/operators/admin/olm-upgrading-operators.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold flex items-center gap-[4px]"
                >
                  View release notes
                  <ExternalLink className="size-[14px]" />
                </a>
              </div>
            </div>

            {/* Update Path Visualization */}
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] mb-[24px]">
              <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white mb-[16px]">
                {operator.currentChannel}
              </h3>
              <div className="mb-[8px]">
                <p className="text-[14px] text-[#151515] dark:text-white font-semibold">
                  {operator.currentVersion} (Current)
                </p>
              </div>

              {/* Version Path */}
              <div className="relative pl-[24px] mb-[24px]">
                {/* Vertical Line */}
                <div className="absolute left-[8px] top-[8px] bottom-[8px] w-[2px] bg-gradient-to-b from-[#3e8635] via-[#0066cc] to-[#0066cc]"></div>

                {/* Versions */}
                <div className="space-y-[16px]">
                  <div className="flex items-center gap-[12px]">
                    <div className="absolute left-0 size-[16px] bg-[#3e8635] dark:bg-[#5ba352] rounded-full border-4 border-white dark:border-[#1f1f1f]"></div>
                    <div className="ml-[16px]">
                      <p className="text-[14px] text-[#151515] dark:text-white">3.0.2</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <div className="absolute left-0 size-[16px] bg-white dark:bg-[rgba(255,255,255,0.05)] border-2 border-[#0066cc] dark:border-[#4dabf7] rounded-full"></div>
                    <div className="ml-[16px]">
                      <p className="text-[14px] text-[#151515] dark:text-white">3.0.3</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <div className="absolute left-0 size-[16px] bg-white dark:bg-[rgba(255,255,255,0.05)] border-2 border-[#0066cc] dark:border-[#4dabf7] rounded-full"></div>
                    <div className="ml-[16px]">
                      <p className="text-[14px] text-[#151515] dark:text-white">3.0.4</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <div className="absolute left-0 size-[16px] bg-white dark:bg-[rgba(255,255,255,0.05)] border-2 border-[#0066cc] dark:border-[#4dabf7] rounded-full"></div>
                    <div className="ml-[16px]">
                      <p className="text-[14px] text-[#151515] dark:text-white">3.0.5</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <div className="absolute left-0 size-[16px] bg-[#0066cc] dark:bg-[#4dabf7] rounded-full border-4 border-white dark:border-[#1f1f1f]"></div>
                    <div className="ml-[16px]">
                      <p className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] font-semibold">3.1.0</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocked version path */}
              <div className="relative pl-[24px] pt-[24px] border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
                <div className="absolute left-[8px] top-[32px] bottom-[8px] w-[2px] bg-[#c9190b] opacity-30"></div>

                <div className="space-y-[16px]">
                  <div className="flex items-center gap-[12px]">
                    <div className="absolute left-0 size-[16px] bg-[#c9190b] dark:bg-[#ff6b6b] rounded-full border-4 border-white dark:border-[#1f1f1f] opacity-50"></div>
                    <div className="ml-[16px]">
                      <div className="flex items-center gap-[8px]">
                        <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">4.0.0</p>
                        <span className="px-[8px] py-[2px] bg-[#c9190b] dark:bg-[rgba(255,107,107,0.15)] text-white dark:text-[#ff6b6b] rounded-[4px] text-[11px] font-semibold">
                          Blocked
                        </span>
                      </div>
                      <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                        <Link to="/administration/cluster-settings" className="text-[#0066cc] dark:text-[#4dabf7] hover:underline">
                          Requires cluster update
                        </Link>
                      </p>
                    </div>
                  </div>
                  {!showMoreVersions && (
                    <button
                      onClick={() => setShowMoreVersions(true)}
                      className="ml-[16px] text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold"
                    >
                      + 8 more
                    </button>
                  )}
                  {showMoreVersions && (
                    <div className="flex items-center gap-[12px]">
                      <div className="absolute left-0 size-[16px] bg-white dark:bg-[rgba(255,255,255,0.05)] border-2 border-[#4d4d4d] rounded-full opacity-50"></div>
                      <div className="ml-[16px]">
                        <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">4.8.1</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Related Operators — PatternFly Data View + table (https://www.patternfly.org/extensions/data-view/overview) */}
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px]">
              <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white mb-[16px]">
                Related Operators
              </h3>
              <OcsNamedResourceDataView
                ouiaId="operator-update-related-operators-dv"
                ariaLabel="Related operators"
                itemsLabel="operators"
                items={operator.relatedOperators}
                getName={(relatedOp) => relatedOp.name}
              >
                {(rows) => (
                  <>
                      <Thead>
                        <Tr>
                          <Th dataLabel="Name">
                            <PlainTableHeader label="Name" />
                          </Th>
                          <Th dataLabel="Status">
                            <PlainTableHeader label="Status" />
                          </Th>
                          <Th dataLabel="Version">
                            <PlainTableHeader label="Version" />
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rows.map((relatedOp, index) => (
                          <Tr key={index}>
                            <Td dataLabel="Name">
                              <Link
                                to="#"
                                className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline"
                              >
                                {relatedOp.name}
                              </Link>
                            </Td>
                            <Td dataLabel="Status">
                              {relatedOp.status === "Installed" && (
                                <span className="flex items-center gap-[6px] text-[13px] text-[#3e8635] dark:text-[#5ba352]">
                                  <CheckCircle className="size-[14px]" />
                                  {relatedOp.status}
                                </span>
                              )}
                              {relatedOp.status === "Pending update" && (
                                <span className="flex items-center gap-[6px] text-[13px] text-[#f0ab00] dark:text-[#f4c145]">
                                  <AlertTriangle className="size-[14px]" />
                                  {relatedOp.status}
                                </span>
                              )}
                              {relatedOp.status === "Not Installed" && (
                                <span className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                                  {relatedOp.status}
                                </span>
                              )}
                            </Td>
                            <Td dataLabel="Version">
                              <span className="text-[14px] text-[#151515] dark:text-white">{relatedOp.version}</span>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                  </>
                )}
              </OcsNamedResourceDataView>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-[280px] shrink-0">
            <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px]">
              <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[16px] text-[#151515] dark:text-white mb-[16px]">
                Update strategy
              </h3>
              <div className="mb-[16px]">
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Update approval</p>
                <div className="flex items-center gap-[8px]">
                  <p className="text-[14px] text-[#151515] dark:text-white">{operator.updateStrategy}</p>
                  <button className="text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]">
                    ✎
                  </button>
                </div>
              </div>

              <div className="mb-[16px]">
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Update channel</p>
                <div className="flex items-center gap-[8px]">
                  <p className="text-[14px] text-[#151515] dark:text-white">{operator.updateChannel}</p>
                  <button className="text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]">
                    ✎
                  </button>
                </div>
              </div>

              <div className="mb-[24px]">
                <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Version</p>
                <p className="text-[14px] text-[#151515] dark:text-white">{operator.currentVersion}</p>
              </div>

              <div className="mb-[24px]">
                <h4 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[14px] text-[#151515] dark:text-white mb-[12px]">
                  Manage Subscription
                </h4>
                <Link
                  to="#"
                  className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline flex items-center gap-[4px]"
                >
                  Manage in OpenShift Cluster Management
                  <ExternalLink className="size-[14px]" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[12px] mt-[24px] sticky bottom-[24px] app-glass-panel p-[16px]">
          <button
            onClick={handleApproveUpdate}
            className="px-[24px] py-[12px] bg-[#0066cc] hover:bg-[#004080] dark:bg-[#4dabf7] dark:hover:bg-[#339af0] text-white rounded-[8px] font-semibold text-[14px] transition-colors"
          >
            Approve update
          </button>
          <button
            onClick={handlePreviewUpdate}
            className="px-[24px] py-[12px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white rounded-[8px] font-semibold text-[14px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          >
            Preview update
          </button>
          <Link
            to="#"
            className="px-[24px] py-[12px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold text-[14px] flex items-center"
          >
            Link
          </Link>
        </div>
        </Breadcrumbs>
    </div>
  );
}

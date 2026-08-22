import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function OperatorInstallingPage() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Configuring resource xyz");
  const [timeLeft, setTimeLeft] = useState("About 23 min left");

  // Mock operator data
  const operator = {
    id: operatorId,
    name: "Business Automation",
    provider: "Red Hat",
  };

  const resources = [
    {
      name: "odl-cluster-operator.v4.19.0-rhmodl",
      kind: "ClusterServiceVersion",
      status: "unknown",
      apiVersion: "operators.coreos.com/v1alpha1",
    },
    {
      name: "openshift-trusted-cabundle",
      kind: "ConfigMap",
      status: "unknown",
      apiVersion: "core/v1",
    },
    {
      name: "ramen-dr-cluster-operator-config",
      kind: "ClusterRole",
      status: "unknown",
      apiVersion: "rbac.authorization.k8s.io/v1",
    },
    {
      name: "ramen-dr-cluster-operator-metrics-service",
      kind: "ConfigMap",
      status: "unknown",
      apiVersion: "core/v1",
    },
    {
      name: "ramen-dr-cluster-operator-metrics-service",
      kind: "ConfigMap",
      status: "unknown",
      apiVersion: "core/v1",
    },
    {
      name: "drclusterconfigs.ramendr.openshift.io",
      kind: "CustomResourceDefini­tion",
      status: "unknown",
      apiVersion: "apiextensions.k8s.io/v1",
    },
    {
      name: "drclusterconfigs.ramendr.openshift.io",
      kind: "CustomResourceDefini­tion",
      status: "unknown",
      apiVersion: "apiextensions.k8s.io/v1",
    },
  ];

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Navigate to completion page after installation
          setTimeout(() => {
            navigate(`/ecosystem/software-catalog/${operator.id}/installed`);
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [navigate, operator.id]);

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Ecosystem", path: "/ecosystem" },
            { label: "Software Catalog", path: "/ecosystem/software-catalog" },
          ]}
        >

        <div className="max-w-[800px] mx-auto mt-[80px]">
          {/* Installation Card */}
          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[24px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)] p-[32px] mb-[32px]">
            <div className="flex items-start gap-[16px] mb-[24px]">
              <div className="size-[48px] bg-[#1f1f1f] dark:bg-white rounded-[8px] flex items-center justify-center shrink-0">
                <span className="text-[24px]">📦</span>
              </div>
              <div className="flex-1">
                <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[20px] text-[#151515] dark:text-white mb-[4px]">
                  Installing {operator.name}
                </h2>
                <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                  Provided by {operator.provider}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-[16px]">
              <div className="h-[8px] bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0066cc] dark:bg-[#4dabf7] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-[24px]">
              <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                {currentStep}
              </p>
              <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                {progress}%
              </p>
            </div>

            {progress < 100 && (
              <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[24px]">
                {timeLeft}
              </p>
            )}

            <div className="flex gap-[12px]">
              <Link
                to="/ecosystem/installed-operators"
                className="px-[16px] py-[8px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold text-[14px] flex items-center"
              >
                Manage Installed Operators
              </Link>
              <Link
                to="/ecosystem/software-catalog"
                className="px-[16px] py-[8px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold text-[14px] flex items-center"
              >
                Back to Software Catalog
              </Link>
              <button className="px-[16px] py-[8px] text-[#c9190b] dark:text-[#ff6b6b] hover:underline font-semibold text-[14px]">
                Cancel installation
              </button>
            </div>
          </div>

          {/* Status overview — PatternFly Data View + table */}
          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px]">
            <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white mb-[16px]">
              Status overview
            </h3>
            <OcsNamedResourceDataView
              ouiaId="operator-installing-status-dv"
              ariaLabel="Installation resources"
              itemsLabel="resources"
              items={resources}
              getName={(resource) => resource.name}
            >
              {(rows) => (
                <>
                    <Thead>
                      <Tr>
                        <Th dataLabel="Name">
                          <PlainTableHeader label="Name" />
                        </Th>
                        <Th dataLabel="Kind">
                          <PlainTableHeader label="Kind" />
                        </Th>
                        <Th dataLabel="Status">
                          <PlainTableHeader label="Status" />
                        </Th>
                        <Th dataLabel="API version">
                          <PlainTableHeader label="API version" />
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {rows.map((resource, index) => (
                        <Tr key={index}>
                          <Td dataLabel="Name">
                            <div className="flex items-center gap-[8px]">
                              <span className="px-[8px] py-[2px] bg-[#0066cc] dark:bg-[#4dabf7] text-white rounded-[4px] text-[11px] font-semibold">
                                PR
                              </span>
                              <Link
                                to="#"
                                className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline"
                              >
                                {resource.name}
                              </Link>
                            </div>
                          </Td>
                          <Td dataLabel="Kind">{resource.kind}</Td>
                          <Td dataLabel="Status">{resource.status}</Td>
                          <Td dataLabel="API version">{resource.apiVersion}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          </div>
        </div>
        </Breadcrumbs>
    </div>
  );
}

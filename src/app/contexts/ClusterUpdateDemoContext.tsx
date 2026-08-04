import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import type { ClusterUpdateDemoVariant } from "../components/AiAssessmentSection";

export const CLUSTER_UPDATE_DEMO_VARIANT_KEY = "ocp5-cluster-update-demo-variant";

function readVariant(): ClusterUpdateDemoVariant {
  try {
    /** Session-scoped: persists while navigating in-session; defaults to manual updates. */
    const raw = sessionStorage.getItem(CLUSTER_UPDATE_DEMO_VARIANT_KEY);
    if (raw === "manual-and-agent") return "manual-and-agent";
    if (raw === "agent-only") return "agent-only";
  } catch {
    /* ignore */
  }
  return "manual-and-agent";
}

type ClusterUpdateDemoContextValue = {
  demoVariant: ClusterUpdateDemoVariant;
  setDemoVariant: (v: ClusterUpdateDemoVariant) => void;
  /** Increments when masthead Reset demo runs — Cluster Update page resets local prototype state. */
  clusterUpdateDemoResetEpoch: number;
  /** Clears in-progress flag, bumps epoch, navigates to Cluster Update plan. Always available (masthead). */
  performClusterUpdateDemoReset: () => void;
};

const ClusterUpdateDemoContext = createContext<ClusterUpdateDemoContextValue | null>(null);

export function ClusterUpdateDemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [demoVariant, setDemoVariantState] = useState<ClusterUpdateDemoVariant>(() => readVariant());
  const [clusterUpdateDemoResetEpoch, setClusterUpdateDemoResetEpoch] = useState(0);

  const setDemoVariant = useCallback((v: ClusterUpdateDemoVariant) => {
    setDemoVariantState(v);
    try {
      sessionStorage.setItem(CLUSTER_UPDATE_DEMO_VARIANT_KEY, v === "agent-only" ? "agent-only" : "manual-and-agent");
    } catch {
      /* ignore */
    }
  }, []);

  // Prototype demo controls (:9000 bridge) → keep React state in sync without reload.
  useEffect(() => {
    const onVariant = (ev: Event) => {
      const detail = (ev as CustomEvent<{ demoVariant?: string }>).detail;
      const next = detail?.demoVariant;
      if (next === "agent-only" || next === "manual-and-agent") {
        setDemoVariant(next);
      }
    };
    const onSwitcher = (ev: Event) => {
      const detail = (ev as CustomEvent<{ option?: string; area?: string }>).detail;
      if (!detail) return;
      if (detail.area && detail.area !== "administration" && detail.area !== "ecosystem") return;
      if (detail.option === "agent-only" || detail.option === "manual-and-agent") {
        setDemoVariant(detail.option);
      }
    };
    document.addEventListener("platform-demo-variant", onVariant as EventListener);
    document.addEventListener("demo-switcher-change", onSwitcher as EventListener);
    return () => {
      document.removeEventListener("platform-demo-variant", onVariant as EventListener);
      document.removeEventListener("demo-switcher-change", onSwitcher as EventListener);
    };
  }, [setDemoVariant]);

  const performClusterUpdateDemoReset = useCallback(() => {
    try {
      localStorage.removeItem("clusterUpdateInProgress");
      sessionStorage.setItem(CLUSTER_UPDATE_DEMO_VARIANT_KEY, "agent-only");
    } catch {
      /* ignore */
    }
    setDemoVariantState("agent-only");
    setClusterUpdateDemoResetEpoch((n) => n + 1);
    navigate("/administration/cluster-update", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      demoVariant,
      setDemoVariant,
      clusterUpdateDemoResetEpoch,
      performClusterUpdateDemoReset,
    }),
    [demoVariant, setDemoVariant, clusterUpdateDemoResetEpoch, performClusterUpdateDemoReset]
  );

  return <ClusterUpdateDemoContext.Provider value={value}>{children}</ClusterUpdateDemoContext.Provider>;
}

export function useClusterUpdateDemoVariant(): ClusterUpdateDemoContextValue {
  const ctx = useContext(ClusterUpdateDemoContext);
  if (!ctx) {
    throw new Error("useClusterUpdateDemoVariant must be used within ClusterUpdateDemoProvider");
  }
  return ctx;
}

import { Outlet } from "react-router";
import { ChatProvider } from "../contexts/ChatContext";
import { PermissionsProvider } from "../contexts/PermissionsContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import { ClusterUpdateDemoProvider } from "../contexts/ClusterUpdateDemoContext";
import { PrototypeDemoProvider } from "../contexts/PrototypeDemoContext";
import { ToastProvider } from "../contexts/ToastContext";
import LightSpeedGlobalMount from "./LightSpeedGlobalMount";

export default function RootLayout() {
  return (
    <ToastProvider>
      <PermissionsProvider>
        <ChatProvider>
          <FavoritesProvider>
            <ClusterUpdateDemoProvider>
              <PrototypeDemoProvider>
                <Outlet />
                <LightSpeedGlobalMount />
              </PrototypeDemoProvider>
            </ClusterUpdateDemoProvider>
          </FavoritesProvider>
        </ChatProvider>
      </PermissionsProvider>
    </ToastProvider>
  );
}
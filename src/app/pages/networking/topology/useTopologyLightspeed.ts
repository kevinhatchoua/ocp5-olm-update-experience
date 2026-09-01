import { useCallback } from "react";
import { useChat } from "../../../contexts/ChatContext";

/** Open LightSpeed with a topology-scoped context (preloads a contextual AI response). */
export function useTopologyLightspeed() {
  const { setIsOpen, setContext, clearMessages } = useChat();

  const openTopologyLightspeed = useCallback(
    (contextKey: string) => {
      clearMessages();
      setContext(contextKey);
      setIsOpen(true);
    },
    [clearMessages, setContext, setIsOpen]
  );

  return { openTopologyLightspeed };
}

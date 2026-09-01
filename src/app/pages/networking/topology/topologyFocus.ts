import type { Visualization } from "@patternfly/react-topology";

/** Pan the canvas only when the selection is off-screen — never change zoom level. */
export function focusTopologySelection(
  controller: Visualization,
  selectedId: string | null,
  { offset = 80, minimumVisible = 120 }: { offset?: number; minimumVisible?: number } = {}
) {
  if (!selectedId) {
    return;
  }

  try {
    const node = controller.getNodeById(selectedId);
    if (!node) {
      return;
    }
    controller.getGraph().panIntoView(node, { offset, minimumVisible });
  } catch {
    /* graph may not be ready */
  }
}

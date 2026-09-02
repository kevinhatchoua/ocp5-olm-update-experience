import PrototypeResourceDetailPage from "./PrototypeResourceDetailPage";
import type { PrototypeListKey } from "../lib/prototypeListStore";

export function createPrototypeResourceDetailPage(listKey: PrototypeListKey) {
  return function PrototypeResourceDetailRoute() {
    return <PrototypeResourceDetailPage listKey={listKey} />;
  };
}

import PrototypeGenericCreatePage from "./PrototypeGenericCreatePage";

export function createResourceCreatePage(kind: string) {
  return function ResourceCreateRoutePage() {
    return <PrototypeGenericCreatePage forcedKind={kind} />;
  };
}

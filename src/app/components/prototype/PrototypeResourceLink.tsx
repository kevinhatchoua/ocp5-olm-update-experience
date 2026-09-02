import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button, type ButtonProps } from "@patternfly/react-core";
import {
  prototypeDetailPath,
  type PrototypeListKey,
} from "../../lib/prototypeListStore";

type PrototypeResourceLinkProps = Omit<ButtonProps, "component" | "to"> & {
  listKey: PrototypeListKey;
  name: string;
  namespace?: string;
  children?: ReactNode;
};

export default function PrototypeResourceLink({
  listKey,
  name,
  namespace = "default",
  children,
  ...buttonProps
}: PrototypeResourceLinkProps) {
  const ns = listKey === "namespaces" || listKey === "crds" || listKey === "migrationpolicies" ? "" : namespace;
  return (
    <Button
      variant="link"
      isInline
      component={Link}
      to={prototypeDetailPath(listKey, ns, name)}
      {...buttonProps}
    >
      {children ?? name}
    </Button>
  );
}

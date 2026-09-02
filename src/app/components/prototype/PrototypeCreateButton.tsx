import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button, type ButtonProps } from "@patternfly/react-core";
import { prototypeCreatePath } from "./prototypeCreatePaths";

type PrototypeCreateButtonProps = Omit<ButtonProps, "onClick" | "children"> & {
  children: ReactNode;
};

export default function PrototypeCreateButton({
  children,
  variant = "primary",
  ...buttonProps
}: PrototypeCreateButtonProps) {
  const label = String(children);
  const createTo = prototypeCreatePath(label);

  return (
    <Button variant={variant} component={Link} to={createTo} {...buttonProps}>
      {children}
    </Button>
  );
}

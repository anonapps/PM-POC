import type { ComponentPropsWithRef } from "react";

export type ActionButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "danger";
};

/** Native button semantics and existing classes; sizing belongs to its current context. */
export function ActionButton({ variant = "primary", className, ...props }: ActionButtonProps) {
  const classes = variant === "primary" ? className : className ? `${variant} ${className}` : variant;
  return <button {...props} className={classes} />;
}

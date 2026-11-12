"use client";
import { useRowActionFeedback } from "./row-action-feedback";
import type { ComponentPropsWithRef } from "react";

export type ActionButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "danger";
};

/** Native button semantics and existing classes; sizing belongs to its current context. */
export function ActionButton({ variant = "primary", className, ...props }: ActionButtonProps) {
  const feedback=useRowActionFeedback();
  const classes = variant === "primary" ? className : className ? `${variant} ${className}` : variant;
  return <button {...props} onClick={event=>{const action=()=>props.onClick?.(event);if(feedback)feedback(event.currentTarget,action);else action();}} className={classes} />;
}

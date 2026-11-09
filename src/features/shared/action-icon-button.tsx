"use client";
import { Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithRef, ReactElement } from "react";

/** HeroUI owns hover/focus, Escape dismissal, portal positioning and viewport flipping. */
export function ActionTooltip({ label, children }: { label: string; children: ReactElement }) {
  return <Tooltip content={label} delay={300} closeDelay={0} disableAnimation
    placement="top" shouldFlip classNames={{ base: "action-tooltip-layer", content: "app-tooltip action-tooltip" }}>
    {children}
  </Tooltip>;
}

export type ActionIconButtonProps = Omit<ComponentPropsWithRef<"button">, "children" | "title"> & {
  icon: LucideIcon;
  label: string;
  count?: number;
  /** Preserve the accepted embedded density of creation-panel Close controls. */
  compact?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

/** Pure presentation: callers retain native type, event propagation, commands and disabled policy. */
export function ActionIconButton({ icon: Icon, label, count, compact = false, variant, className, ...props }: ActionIconButtonProps) {
  const name = count === undefined ? label : `${label} (${count})`;
  const button = <button {...props} aria-label={props["aria-label"] ?? name}
      className={`action-icon-button${compact ? " action-icon-button--compact" : ""}${variant === "danger" ? " danger" : ""}${className ? ` ${className}` : ""}`}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" focusable="false" />
      {count !== undefined && <span className="action-icon-badge" aria-hidden="true">{count}</span>}
    </button>;
  return <ActionTooltip label={name}>{props.disabled
    ? <span className="disabled-action-trigger" tabIndex={0}>{button}</span>
    : button}</ActionTooltip>;
}

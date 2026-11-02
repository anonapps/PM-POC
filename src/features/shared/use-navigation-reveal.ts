"use client";
import { useLayoutEffect, type RefObject } from "react";
import type { NavigationTarget } from "../shell/shell";
import { revealRecordElement } from "./navigation-reveal";

/** Shared by Search and Warnings, including portalled baseline management. */
export function useNavigationReveal(root: RefObject<HTMLElement | null>, target?: NavigationTarget) {
  const id = target?.entityId, request = target?.requestId;
  useLayoutEffect(() => {
    if (!id || !root.current) return;
    let frame = 0;
    const attempt = () => {
      const scopes = [root.current!, ...document.querySelectorAll<HTMLElement>('[role="dialog"]')];
      const record = scopes.flatMap(scope => [...scope.querySelectorAll<HTMLElement>('[data-navigation-id]')]).find(node => node.dataset.navigationId === id);
      if (!record) return false;
      frame = requestAnimationFrame(() => { if (record.isConnected) revealRecordElement(record); });
      return true;
    };
    const observer = new MutationObserver(() => { if (attempt()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    if (attempt()) observer.disconnect();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [root, id, request]);
}

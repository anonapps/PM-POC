"use client";
import { useSyncExternalStore } from "react";
import type { ProjectStore } from "../../application";

/** Read the current project and refresh selection lists on every committed change. */
export function useProjectState(store: ProjectStore) {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

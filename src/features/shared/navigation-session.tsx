"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type SetStateAction } from "react";
import type { ProjectStore } from "../../application";
import type { ModuleName } from "../shell/shell";

export function createNavigationSession(owner?: ProjectStore) {
  const values = new Map<string, unknown>();
  return {
    owner,
    values,
    prepareNavigation(from: ModuleName, to: ModuleName) {
      // Preserve destination preferences for Search journeys. Ordinary page
      // navigation retains the existing reset behavior; Search itself survives.
      if (from === to || from === "Search" || to === "Search") return;
      for (const key of values.keys()) if (!key.startsWith("search.")) values.delete(key);
    },
  };
}
const Scope = createContext("standalone");
export function NavigationPreferenceScope({name,children}:{name:ModuleName;children:ReactNode}) {
  return <Scope.Provider value={name}>{children}</Scope.Provider>;
}
const Context = createContext<ReturnType<typeof createNavigationSession> | null>(null);
export function NavigationSessionProvider({ store, children }: { store: ProjectStore; children: ReactNode }) {
  const session = useMemo(() => createNavigationSession(store), [store]);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export const useNavigationSession = () => useContext(Context);

/** Transient presentation state only: scoped to this open ProjectStore. */
export function useNavigationPreference<T>(preference: string, initial: T) {
  const scope=useContext(Scope);
  const key=preference.startsWith("search.")?preference:`${scope}.${preference}`;
  const session = useNavigationSession();
  const read = () => session?.values.has(key) ? session.values.get(key) as T : initial;
  const [slot, setSlot] = useState(() => ({ session, key, value: read() }));
  if (slot.session !== session) setSlot({ session, key, value: read() });
  const value = slot.session === session && slot.key === key ? slot.value : read();
  const setValue = useCallback((next: SetStateAction<T>) => {
    const current = session?.values.has(key) ? session.values.get(key) as T : value;
    const updated = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
    // Save synchronously: a result click can unmount Search in the same event.
    session?.values.set(key, updated);
    setSlot({ session, key, value: updated });
  }, [session, key, value]);
  return [value, setValue] as const;
}

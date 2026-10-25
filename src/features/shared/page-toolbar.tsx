import type { ReactNode } from "react";

/** Equal outer tracks centre search against the page, independently of actions. */
export function PageToolbar({children}:{children:ReactNode}) {
  return <div className="title-row page-toolbar">{children}</div>;
}

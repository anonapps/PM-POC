"use client";

import { TitleTooltipProvider } from "../features/shared/title-tooltip-provider";
import { HeroUIProvider } from "@heroui/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <HeroUIProvider disableAnimation>{children}<TitleTooltipProvider/></HeroUIProvider>;
}

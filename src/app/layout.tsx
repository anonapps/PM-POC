import type { Metadata } from "next";

import "./globals.css";
import "./design-system.css";
import "./heroui-experiment.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Project Management POC",
  description: "A local-first project management proof of concept.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="heroui-experiment"><Providers>{children}</Providers></body>
    </html>
  );
}

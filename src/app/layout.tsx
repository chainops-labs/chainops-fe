import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChainOps Deployment Console",
  description: "GitOps deployment, incident response, and MTTR operations console.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
};

export default RootLayout;

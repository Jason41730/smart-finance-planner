import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "智選理財家 - Smart Finance Planner",
  description: "LLM 驅動的全端智能記帳與財務規劃服務",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}


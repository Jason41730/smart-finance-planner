"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { userStorage } from "@/lib/storage";
import Layout from "@/components/layout/Layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = userStorage.getCurrentUser();
    if (!user) {
      router.push("/login");
    }
  }, [router]);

  return <>{children}</>;
}


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { userStorage } from "@/lib/storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = userStorage.getCurrentUser();
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}


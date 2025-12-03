"use client";

import { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { userStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import type { User as UserType } from "@/types";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(userStorage.getCurrentUser());
  }, []);

  const handleLogout = () => {
    userStorage.setCurrentUser(null);
    setUser(null);
    router.push("/login");
  };

  // 避免 hydration 錯誤，在客戶端掛載前不渲染用戶相關內容
  if (!mounted) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          )}
        </div>
        {user && (
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            登出
          </Button>
        )}
      </div>
    </header>
  );
}


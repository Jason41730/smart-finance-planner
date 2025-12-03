"use client";

import { LogOut, User } from "lucide-react";
import { userStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";

export default function Header() {
  const router = useRouter();
  const user = userStorage.getCurrentUser();

  const handleLogout = () => {
    userStorage.setCurrentUser(null);
    router.push("/login");
  };

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


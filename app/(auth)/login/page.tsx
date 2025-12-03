"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userStorage } from "@/lib/storage";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const loginSchema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    
    // Mock authentication - check localStorage
    const storedUsers = localStorage.getItem("smart_finance_users");
    const users: Array<{ email: string; password: string; id: string; name: string }> = 
      storedUsers ? JSON.parse(storedUsers) : [];

    const user = users.find((u) => u.email === data.email && u.password === data.password);

    if (user) {
      userStorage.setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: new Date(),
      });
      router.push("/dashboard");
    } else {
      setError("電子郵件或密碼錯誤");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">登入</h1>
        <p className="text-gray-600 mb-6">歡迎回到智選理財家</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="電子郵件"
            type="email"
            placeholder="your@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="密碼"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登入中..." : "登入"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">還沒有帳號？</span>{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            立即註冊
          </Link>
        </div>
      </Card>
    </div>
  );
}


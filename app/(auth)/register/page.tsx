"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const registerSchema = z
  .object({
    name: z.string().min(2, "姓名至少需要 2 個字元"),
    email: z.string().email("請輸入有效的電子郵件"),
    password: z.string().min(6, "密碼至少需要 6 個字元"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError("");

    try {
      // 註冊使用者
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "註冊失敗，請稍後再試");
        return;
      }

      // 註冊成功後自動登入
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("註冊成功，但登入失敗，請手動登入");
      }
    } catch (error) {
      setError("註冊失敗，請稍後再試");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">註冊</h1>
        <p className="text-gray-600 mb-6">建立您的智選理財家帳號</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="姓名"
            type="text"
            placeholder="張三"
            error={errors.name?.message}
            {...register("name")}
          />

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

          <Input
            label="確認密碼"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "註冊中..." : "註冊"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">已經有帳號？</span>{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            立即登入
          </Link>
        </div>
      </Card>
    </div>
  );
}


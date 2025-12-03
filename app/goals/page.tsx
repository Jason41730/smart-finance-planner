"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userStorage, goalsStorage } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import type { FinancialGoal } from "@/types";
import { Plus, Edit, Trash2, Target } from "lucide-react";

const goalSchema = z.object({
  goalName: z.string().min(1, "請輸入目標名稱"),
  targetAmount: z.number().min(1, "目標金額必須大於 0"),
  currentSavedAmount: z.number().min(0, "目前儲蓄不能為負數"),
  targetDate: z.string().min(1, "請選擇目標日期"),
});

type GoalForm = z.infer<typeof goalSchema>;

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
  });

  useEffect(() => {
    const user = userStorage.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    loadGoals();
  }, [router]);

  const loadGoals = () => {
    const user = userStorage.getCurrentUser();
    if (user) {
      const userGoals = goalsStorage.getAll(user.id);
      setGoals(userGoals);
    }
  };

  const onSubmit = (data: GoalForm) => {
    const user = userStorage.getCurrentUser();
    if (!user) return;

    if (editingGoal) {
      goalsStorage.update(editingGoal.id, {
        ...data,
        targetDate: new Date(data.targetDate),
      });
    } else {
      goalsStorage.create({
        userId: user.id,
        goalName: data.goalName,
        targetAmount: data.targetAmount,
        currentSavedAmount: data.currentSavedAmount,
        targetDate: new Date(data.targetDate),
      });
    }

    reset();
    setIsModalOpen(false);
    setEditingGoal(null);
    loadGoals();
  };

  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    reset({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      currentSavedAmount: goal.currentSavedAmount,
      targetDate: new Date(goal.targetDate).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此目標嗎？")) {
      goalsStorage.delete(id);
      loadGoals();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">財務目標</h1>
            <p className="text-gray-600 mt-1">設定並追蹤您的財務目標</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            新增目標
          </Button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">尚無財務目標</p>
              <p className="text-gray-400 text-sm mb-4">
                開始設定您的第一個財務目標吧！
              </p>
              <Button onClick={() => setIsModalOpen(true)}>建立目標</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = (goal.currentSavedAmount / goal.targetAmount) * 100;
              const daysRemaining = Math.ceil(
                (new Date(goal.targetDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <Card key={goal.id}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {goal.goalName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          目標日期: {formatDate(goal.targetDate)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(goal)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">進度</span>
                        <span className="font-medium text-gray-900">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {formatCurrency(goal.currentSavedAmount)} /{" "}
                          {formatCurrency(goal.targetAmount)}
                        </span>
                        <span className="text-gray-500">
                          還需 {formatCurrency(goal.targetAmount - goal.currentSavedAmount)}
                        </span>
                      </div>
                    </div>

                    {daysRemaining > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          距離目標日期還有 <span className="font-medium">{daysRemaining}</span> 天
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGoal(null);
            reset();
          }}
          title={editingGoal ? "編輯目標" : "新增目標"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="目標名稱"
              type="text"
              placeholder="例如：購買新筆電"
              error={errors.goalName?.message}
              {...register("goalName")}
            />

            <Input
              label="目標金額"
              type="number"
              step="0.01"
              placeholder="50000"
              error={errors.targetAmount?.message}
              {...register("targetAmount", { valueAsNumber: true })}
            />

            <Input
              label="目前儲蓄"
              type="number"
              step="0.01"
              placeholder="0"
              error={errors.currentSavedAmount?.message}
              {...register("currentSavedAmount", { valueAsNumber: true })}
            />

            <Input
              label="目標日期"
              type="date"
              error={errors.targetDate?.message}
              {...register("targetDate")}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingGoal ? "更新" : "新增"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingGoal(null);
                  reset();
                }}
              >
                取消
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}


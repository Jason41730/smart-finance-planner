"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { userStorage, goalsStorage } from "@/lib/storage";
import { fetchRecords } from "@/lib/apiClient";
import { generateMockGoals } from "@/lib/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format, subDays } from "date-fns";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import LineChart from "@/components/charts/LineChart";
import PieChart from "@/components/charts/PieChart";
import type { AccountRecord, FinancialGoal } from "@/types";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  const loadData = async () => {
    const user = userStorage.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      // 從 API 載入記錄（包含 LINE Bot 記錄）
      const userRecords = await fetchRecords();
      setRecords(userRecords);

      // Goals 仍使用 localStorage（未來也會遷移）
      let userGoals = goalsStorage.getAll(user.id);
      if (userGoals.length === 0) {
        const mockGoals = generateMockGoals(user.id);
        mockGoals.forEach((goal) => goalsStorage.create(goal));
        userGoals = goalsStorage.getAll(user.id);
      }
      setGoals(userGoals);
    } catch (error) {
      console.error('Failed to load data:', error);
      // 如果 API 失敗，顯示錯誤訊息
      if (error instanceof Error && error.message === 'Unauthorized') {
        router.push('/login');
      }
    }
  };

  useEffect(() => {
    loadData();

    // 當頁面獲得焦點時重新載入數據（用戶從其他頁面返回時）
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 使用 useMemo 實時計算統計數據（當 records 變化時自動更新）
  const stats = useMemo(() => {
    const totalExpense = records
      .filter((r) => !r.type || r.type === "expense") // 沒有 type 的舊記錄視為支出
      .reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = records
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [records]);

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, "MM/dd");
  });

  const lineChartData = last7Days.map((dateStr) => {
    const dayRecords = records.filter(
      (r) => format(new Date(r.date), "MM/dd") === dateStr
    );
    return {
      date: dateStr,
      income: dayRecords
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0),
      expense: dayRecords
        .filter((r) => !r.type || r.type === "expense") // 兼容舊記錄
        .reduce((sum, r) => sum + r.amount, 0),
    };
  });

  const categoryData = records
    .filter((r) => !r.type || r.type === "expense") // 兼容舊記錄
    .reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  const recentRecords = records.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">儀表板</h1>
          <p className="text-gray-600 mt-1">查看您的財務概況</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總收入</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總支出</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalExpense)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">餘額</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.balance)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="收支趨勢">
            <LineChart data={lineChartData} />
          </Card>

          <Card title="支出類別">
            <PieChart data={pieChartData} />
          </Card>
        </div>

        {/* Goals and Recent Records */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="財務目標">
            <div className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">尚無目標</p>
              ) : (
                goals.map((goal) => {
                  const progress = (goal.currentSavedAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{goal.goalName}</h4>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(goal.currentSavedAmount)} / {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        進度: {progress.toFixed(1)}%
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card title="最新記帳記錄">
            <div className="space-y-3">
              {recentRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">尚無記錄</p>
              ) : (
                recentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{record.description}</p>
                      <p className="text-sm text-gray-500">
                        {record.category} • {formatDate(record.date)}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-semibold ${
                        record.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {record.type === "income" ? "+" : "-"}
                      {formatCurrency(record.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userStorage, plansStorage, recordsStorage, goalsStorage } from "@/lib/storage";
import { generateMockPlan } from "@/lib/mockData";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { LLMPlan } from "@/types";
import { TrendingUp, Loader2, Lightbulb } from "lucide-react";

export default function PlanningPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<LLMPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Session 檢查由 layout.tsx 處理
    loadLatestPlan();
  }, [router]);

  const loadLatestPlan = () => {
    const user = userStorage.getCurrentUser();
    if (user) {
      const latestPlan = plansStorage.getLatest(user.id);
      setPlan(latestPlan);
    }
  };

  const handleGeneratePlan = async () => {
    const user = userStorage.getCurrentUser();
    if (!user) return;

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if we have records and goals
    const records = recordsStorage.getAll(user.id);
    const goals = goalsStorage.getAll(user.id);

    if (records.length === 0 || goals.length === 0) {
      alert("請先建立記帳記錄和財務目標，才能生成規劃建議");
      setIsLoading(false);
      return;
    }

    // Generate mock plan (in real app, this would call LLM API)
    const mockPlan = generateMockPlan(user.id);
    plansStorage.create(mockPlan);
    loadLatestPlan();

    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">財務規劃</h1>
          <p className="text-gray-600 mt-1">獲得個人化的財務建議</p>
        </div>

        {/* Generate Plan Button */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                生成財務規劃建議
              </h3>
              <p className="text-sm text-gray-600">
                基於您的記帳記錄和財務目標，AI 將為您生成個人化的財務規劃建議
              </p>
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  開始分析
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Plan Display */}
        {plan ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card title="規劃摘要">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                <p className="text-gray-700 leading-relaxed">{plan.planSummary}</p>
              </div>
            </Card>

            {/* Detailed Plan */}
            <Card title="詳細規劃報告">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {plan.planDetail}
                </pre>
              </div>
            </Card>

            {/* Behavior Adjustments */}
            {plan.assumptions.behaviorAdjustments && (
              <Card title="行為調整建議">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plan.assumptions.behaviorAdjustments.map((adjustment, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {adjustment.behavior}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        每週減少: NT$ {adjustment.reduction.toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-blue-700">
                        可提前 {adjustment.daysSaved} 天達成目標
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Note */}
            <Card>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>注意：</strong>此規劃報告為示範版本，使用模擬數據生成。
                  實際版本將連接 LLM API 進行真實的財務分析。
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">尚未生成財務規劃</p>
              <p className="text-gray-400 text-sm mb-4">
                點擊上方按鈕開始生成您的個人化財務規劃建議
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}


import type { AccountRecord, FinancialGoal, LLMPlan } from "@/types";
import { format, subDays, subMonths } from "date-fns";

const categories = [
  "飲食",
  "交通",
  "購物",
  "娛樂",
  "醫療",
  "教育",
  "其他",
];

const descriptions = [
  "午餐",
  "晚餐",
  "早餐",
  "咖啡",
  "手搖飲",
  "捷運",
  "計程車",
  "油費",
  "衣服",
  "書籍",
  "電影",
  "健身房",
  "藥品",
  "學費",
];

export function generateMockRecords(userId: string, count: number = 30): AccountRecord[] {
  const records: AccountRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = subDays(now, Math.floor(Math.random() * 30));
    const amount = Math.floor(Math.random() * 2000) + 50;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    records.push({
      id: crypto.randomUUID(),
      userId,
      amount,
      category,
      description,
      source: "web" as const,
      date,
      createdAt: date,
    });
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateMockGoals(userId: string): FinancialGoal[] {
  const now = new Date();
  return [
    {
      id: crypto.randomUUID(),
      userId,
      goalName: "購買新筆電",
      targetAmount: 50000,
      currentSavedAmount: 25000,
      targetDate: new Date(now.getFullYear(), now.getMonth() + 3, 1),
      createdAt: subMonths(now, 2),
    },
    {
      id: crypto.randomUUID(),
      userId,
      goalName: "旅遊基金",
      targetAmount: 30000,
      currentSavedAmount: 12000,
      targetDate: new Date(now.getFullYear(), now.getMonth() + 6, 1),
      createdAt: subMonths(now, 1),
    },
  ];
}

export function generateMockPlan(userId: string): LLMPlan {
  return {
    id: crypto.randomUUID(),
    userId,
    planSummary: "根據您的消費習慣分析，若每週減少 2 次外食和 3 次手搖飲，可提前 43 天達成購買新筆電的目標。",
    planDetail: `
## 財務規劃分析報告

### 當前狀況
- 目標：購買新筆電 (NT$ 50,000)
- 目前儲蓄：NT$ 25,000
- 還需：NT$ 25,000
- 預計達成時間：3 個月後

### 消費習慣分析
根據過去 30 天的記帳記錄：
- 平均每週外食支出：NT$ 1,200
- 平均每週手搖飲支出：NT$ 350
- 平均每週總支出：NT$ 3,500

### 建議調整方案

#### 方案一：減少外食
- 每週減少 2 次外食（約 NT$ 400）
- 每月可多存：NT$ 1,600
- 可提前達成時間：約 15 天

#### 方案二：減少手搖飲
- 每週減少 3 次手搖飲（約 NT$ 150）
- 每月可多存：NT$ 600
- 可提前達成時間：約 6 天

#### 方案三：綜合調整（推薦）
- 每週減少 2 次外食 + 3 次手搖飲
- 每月可多存：NT$ 2,200
- 可提前達成時間：約 43 天

### 執行建議
1. 設定每週預算上限，追蹤實際支出
2. 使用記帳 App 即時提醒
3. 每月檢視進度，適時調整策略
    `,
    assumptions: {
      weeklySpending: 3500,
      savingsRate: 0.3,
      behaviorAdjustments: [
        {
          behavior: "減少外食",
          reduction: 400,
          daysSaved: 15,
        },
        {
          behavior: "減少手搖飲",
          reduction: 150,
          daysSaved: 6,
        },
        {
          behavior: "綜合調整",
          reduction: 550,
          daysSaved: 43,
        },
      ],
    },
    createdAt: new Date(),
  };
}


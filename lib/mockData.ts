import type { AccountRecord, FinancialGoal, LLMPlan } from "@/types";
import { format, subDays, subMonths } from "date-fns";

const expenseCategories = [
  "飲食",
  "交通",
  "購物",
  "娛樂",
  "醫療",
  "教育",
  "其他",
];

const incomeCategories = ["薪資", "獎金", "投資", "兼職", "禮金", "其他收入"];

// 描述和類別的對應關係
const expenseItems: Array<{ description: string; category: string }> = [
  // 飲食
  { description: "午餐", category: "飲食" },
  { description: "晚餐", category: "飲食" },
  { description: "早餐", category: "飲食" },
  { description: "咖啡", category: "飲食" },
  { description: "手搖飲", category: "飲食" },
  { description: "便利商店", category: "飲食" },
  // 交通
  { description: "捷運", category: "交通" },
  { description: "計程車", category: "交通" },
  { description: "油費", category: "交通" },
  { description: "停車費", category: "交通" },
  { description: "公車", category: "交通" },
  // 購物
  { description: "衣服", category: "購物" },
  { description: "日用品", category: "購物" },
  { description: "3C產品", category: "購物" },
  // 娛樂
  { description: "電影", category: "娛樂" },
  { description: "KTV", category: "娛樂" },
  { description: "遊戲", category: "娛樂" },
  // 醫療
  { description: "藥品", category: "醫療" },
  { description: "看診", category: "醫療" },
  // 教育
  { description: "書籍", category: "教育" },
  { description: "學費", category: "教育" },
  { description: "線上課程", category: "教育" },
  // 其他
  { description: "健身房", category: "其他" },
  { description: "水電費", category: "其他" },
  { description: "電話費", category: "其他" },
];

const incomeDescriptions = [
  "月薪",
  "年終獎金",
  "股票分紅",
  "兼職收入",
  "紅包",
  "投資收益",
  "副業收入",
];

export function generateMockRecords(userId: string, count: number = 30): AccountRecord[] {
  const records: AccountRecord[] = [];
  const now = new Date();

  // 生成 70% 支出，30% 收入
  const expenseCount = Math.floor(count * 0.7);
  const incomeCount = count - expenseCount;

  // 生成支出記錄
  for (let i = 0; i < expenseCount; i++) {
    const date = subDays(now, Math.floor(Math.random() * 30));
    const amount = Math.floor(Math.random() * 2000) + 50;
    // 隨機選擇一個項目，確保描述和類別匹配
    const item = expenseItems[Math.floor(Math.random() * expenseItems.length)];

    records.push({
      id: crypto.randomUUID(),
      userId,
      type: "expense",
      amount,
      category: item.category,
      description: item.description,
      source: "web" as const,
      date,
      createdAt: date,
    });
  }

  // 生成收入記錄
  for (let i = 0; i < incomeCount; i++) {
    const date = subDays(now, Math.floor(Math.random() * 30));
    const amount = Math.floor(Math.random() * 20000) + 5000; // 收入金額較大
    const category =
      incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
    const description =
      incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)];

    records.push({
      id: crypto.randomUUID(),
      userId,
      type: "income",
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


export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AccountRecord {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  source: "web" | "line" | "ocr";
  imageUrl?: string;
  date: Date;
  createdAt: Date;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentSavedAmount: number;
  targetDate: Date;
  createdAt: Date;
}

export interface LLMPlan {
  id: string;
  userId: string;
  planSummary: string;
  planDetail: string;
  assumptions: {
    weeklySpending?: number;
    savingsRate?: number;
    behaviorAdjustments?: Array<{
      behavior: string;
      reduction: number;
      daysSaved: number;
    }>;
  };
  createdAt: Date;
}


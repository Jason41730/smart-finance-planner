import type { User, AccountRecord, FinancialGoal, LLMPlan } from "@/types";

const STORAGE_KEYS = {
  USER: "smart_finance_user",
  RECORDS: "smart_finance_records",
  GOALS: "smart_finance_goals",
  PLANS: "smart_finance_plans",
} as const;

// User storage
export const userStorage = {
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null): void => {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },
};

// Records storage
export const recordsStorage = {
  getAll: (userId: string): AccountRecord[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: AccountRecord[] = data ? JSON.parse(data) : [];
    return allRecords.filter((r) => r.userId === userId);
  },

  getById: (id: string, userId: string): AccountRecord | null => {
    const records = recordsStorage.getAll(userId);
    return records.find((r) => r.id === id) || null;
  },

  create: (record: Omit<AccountRecord, "id" | "createdAt">): AccountRecord => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: AccountRecord[] = data ? JSON.parse(data) : [];

    const newRecord: AccountRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    allRecords.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(allRecords));
    return newRecord;
  },

  update: (id: string, updates: Partial<AccountRecord>): AccountRecord | null => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: AccountRecord[] = data ? JSON.parse(data) : [];

    const index = allRecords.findIndex((r) => r.id === id);
    if (index === -1) return null;

    allRecords[index] = { ...allRecords[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(allRecords));
    return allRecords[index];
  },

  delete: (id: string): boolean => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: AccountRecord[] = data ? JSON.parse(data) : [];

    const filtered = allRecords.filter((r) => r.id !== id);
    if (filtered.length === allRecords.length) return false;

    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
    return true;
  },
};

// Goals storage
export const goalsStorage = {
  getAll: (userId: string): FinancialGoal[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    const allGoals: FinancialGoal[] = data ? JSON.parse(data) : [];
    return allGoals.filter((g) => g.userId === userId);
  },

  getById: (id: string, userId: string): FinancialGoal | null => {
    const goals = goalsStorage.getAll(userId);
    return goals.find((g) => g.id === id) || null;
  },

  create: (goal: Omit<FinancialGoal, "id" | "createdAt">): FinancialGoal => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    const allGoals: FinancialGoal[] = data ? JSON.parse(data) : [];

    const newGoal: FinancialGoal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    allGoals.push(newGoal);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(allGoals));
    return newGoal;
  },

  update: (id: string, updates: Partial<FinancialGoal>): FinancialGoal | null => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    const allGoals: FinancialGoal[] = data ? JSON.parse(data) : [];

    const index = allGoals.findIndex((g) => g.id === id);
    if (index === -1) return null;

    allGoals[index] = { ...allGoals[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(allGoals));
    return allGoals[index];
  },

  delete: (id: string): boolean => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    const allGoals: FinancialGoal[] = data ? JSON.parse(data) : [];

    const filtered = allGoals.filter((g) => g.id !== id);
    if (filtered.length === allGoals.length) return false;

    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
    return true;
  },
};

// Plans storage
export const plansStorage = {
  getAll: (userId: string): LLMPlan[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.PLANS);
    const allPlans: LLMPlan[] = data ? JSON.parse(data) : [];
    return allPlans.filter((p) => p.userId === userId);
  },

  getLatest: (userId: string): LLMPlan | null => {
    const plans = plansStorage.getAll(userId);
    if (plans.length === 0) return null;
    return plans.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  },

  create: (plan: Omit<LLMPlan, "id" | "createdAt">): LLMPlan => {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available");
    }

    const data = localStorage.getItem(STORAGE_KEYS.PLANS);
    const allPlans: LLMPlan[] = data ? JSON.parse(data) : [];

    const newPlan: LLMPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    allPlans.push(newPlan);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(allPlans));
    return newPlan;
  },
};


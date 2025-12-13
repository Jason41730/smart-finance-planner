import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('請設定環境變數 MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 開發環境：使用全域變數避免重複連線
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 生產環境
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// 取得資料庫實例
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('smart-finance');
}

// 資料庫集合名稱
export const COLLECTIONS = {
  USERS: 'users',
  ACCOUNT_RECORDS: 'accountRecords',
  FINANCIAL_GOALS: 'financialGoals',
  LLM_PLANS: 'llmPlans',
  EXPENSES: 'expenses', // LINE Bot 使用的簡化版記帳
} as const;










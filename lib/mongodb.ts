import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('請設定環境變數 MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// 延遲連線：只在實際需要時才連線，避免 build 時嘗試連線
if (process.env.NODE_ENV === 'development') {
  // 開發環境：使用全域變數避免重複連線
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    // 不立即連線，延遲到第一次使用時
    globalWithMongo._mongoClientPromise = Promise.resolve(client).then(c => c.connect());
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 生產環境：延遲連線
  client = new MongoClient(uri, options);
  clientPromise = Promise.resolve(client).then(c => c.connect());
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
  CONVERSATIONS: 'conversations', // 對話歷史
} as const;










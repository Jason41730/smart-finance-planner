import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('請設定環境變數 MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 30000, // 30 秒超時（增加超時時間）
  connectTimeoutMS: 30000, // 連線超時 30 秒
  socketTimeoutMS: 45000, // Socket 超時 45 秒
  maxPoolSize: 10, // 最大連線池大小
  minPoolSize: 1, // 最小連線池大小
  retryWrites: true,
  retryReads: true,
};

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
  try {
    const client = await clientPromise;
    return client.db('smart-finance');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // 提供更清楚的錯誤訊息
    if (error instanceof Error) {
      if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
        throw new Error('MongoDB 認證失敗，請檢查 MONGODB_URI 環境變數中的帳號密碼是否正確');
      }
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        throw new Error('MongoDB 連線失敗，請檢查網路連線和 MONGODB_URI');
      }
      if (error.message.includes('Server selection timed out') || error.message.includes('MongoServerSelectionError')) {
        throw new Error('MongoDB 連線超時，請檢查：1) IP 白名單設定 2) Cluster 狀態 3) MONGODB_URI 格式');
      }
    }
    throw error;
  }
}

// 資料庫集合名稱
export const COLLECTIONS = {
  USERS: 'users',                    // 使用者基本資料
  USER_MAPPINGS: 'userMappings',     // LINE <-> Web 對應關係
  ACCOUNT_RECORDS: 'accountRecords',  // 統一的記帳記錄（收入+支出）
  FINANCIAL_GOALS: 'financialGoals', // 財務目標
  LLM_PLANS: 'llmPlans',            // LLM 生成的規劃
  EXPENSES: 'expenses',              // LINE Bot 使用的簡化版記帳（過渡期，未來會移除）
  CONVERSATIONS: 'conversations',    // 對話歷史
} as const;










/**
 * 統一的記帳資料庫操作
 * 
 * 此模組提供統一的記帳 API，支援：
 * - 收入與支出（type: 'income' | 'expense'）
 * - 多種來源（source: 'web' | 'line' | 'ocr'）
 * - 完整的 CRUD 操作
 * - 靈活的查詢功能
 * 
 * 所有記帳記錄統一儲存在 accountRecords collection
 */

import { getDb, COLLECTIONS } from './mongodb';
import { ObjectId } from 'mongodb';

/**
 * 統一的記帳記錄介面
 */
export interface AccountRecord {
  _id?: ObjectId;           // MongoDB 原生 _id（內部使用）
  id?: string;              // 對外統一使用 string ID（從 _id 轉換）
  userId: string;           // 使用者 ID（可以是 LINE user_id 或 web user_id）
  type: 'income' | 'expense'; // 收入或支出
  amount: number;           // 金額
  category: string | null;  // 類別
  description: string;      // 描述/備註
  date: string;             // YYYY-MM-DD
  ts: string;               // ISO 時間字串（YYYY-MM-DDTHH:MM），用於排序
  source: 'web' | 'line' | 'ocr'; // 記錄來源
  imageUrl?: string;        // 圖片 URL（如果有）
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 查詢篩選條件
 */
export interface AccountRecordFilters {
  type?: 'income' | 'expense';
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD
  category?: string;
  source?: 'web' | 'line' | 'ocr';
  limit?: number;
  offset?: number;
}

/**
 * 從 MongoDB 文件轉換為 AccountRecord
 */
function fromMongoDB(doc: any): AccountRecord {
  return {
    id: doc._id?.toString(),
    userId: doc.userId,
    type: doc.type,
    amount: doc.amount,
    category: doc.category ?? null,
    description: doc.description ?? '',
    date: doc.date,
    ts: doc.ts,
    source: doc.source,
    imageUrl: doc.imageUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * 轉換為 MongoDB 文件格式
 */
function toMongoDB(record: Partial<AccountRecord>): any {
  const { id, ...rest } = record;
  const doc: any = { ...rest };
  
  if (id) {
    doc._id = new ObjectId(id);
  }
  
  return doc;
}

/**
 * 新增記帳記錄
 * 
 * @param userId - 使用者 ID（可以是 LINE user_id 或 web user_id）
 * @param type - 類型：收入或支出
 * @param amount - 金額
 * @param category - 類別（可選）
 * @param description - 描述（可選）
 * @param date - 日期 (YYYY-MM-DD)，預設為今天
 * @param source - 來源，預設為 'web'
 * @param imageUrl - 圖片 URL（可選）
 * @returns 新增的記錄
 */
export async function addAccountRecord(
  userId: string,
  type: 'income' | 'expense',
  amount: number,
  category: string | null = null,
  description: string = '',
  date?: string,
  source: 'web' | 'line' | 'ocr' = 'web',
  imageUrl?: string
): Promise<AccountRecord> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  // 驗證金額
  if (amount <= 0) {
    throw new Error('金額必須大於 0');
  }

  // 處理日期
  const recordDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const timestamp = date 
    ? `${date}T12:00` // 如果只有日期，預設中午
    : new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

  const now = new Date();
  const record: AccountRecord = {
    userId,
    type,
    amount,
    category,
    description,
    date: recordDate,
    ts: timestamp,
    source,
    imageUrl,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(toMongoDB(record));
  return fromMongoDB({ ...record, _id: result.insertedId });
}

/**
 * 取得記帳記錄
 * 
 * @param userId - 使用者 ID
 * @param filters - 篩選條件（可選）
 * @returns 記帳記錄陣列
 */
export async function getAccountRecords(
  userId: string,
  filters?: AccountRecordFilters
): Promise<AccountRecord[]> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  // 建立查詢條件
  const query: any = { userId };

  if (filters?.type) {
    query.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    query.date = {};
    if (filters.startDate) {
      query.date.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.date.$lte = filters.endDate;
    }
  }

  if (filters?.category) {
    query.category = filters.category;
  }

  if (filters?.source) {
    query.source = filters.source;
  }

  // 查詢
  let cursor = collection.find(query).sort({ ts: -1 }); // 由新到舊

  // 分頁
  if (filters?.offset) {
    cursor = cursor.skip(filters.offset);
  }
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }

  const docs = await cursor.toArray();
  return docs.map(fromMongoDB);
}

/**
 * 取得單一記帳記錄
 * 
 * @param recordId - 記錄 ID
 * @param userId - 使用者 ID（用於驗證）
 * @returns 記帳記錄或 null
 */
export async function getAccountRecordById(
  recordId: string,
  userId: string
): Promise<AccountRecord | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  const doc = await collection.findOne({
    _id: new ObjectId(recordId),
    userId,
  });

  return doc ? fromMongoDB(doc) : null;
}

/**
 * 更新記帳記錄
 * 
 * @param recordId - 記錄 ID
 * @param userId - 使用者 ID（用於驗證）
 * @param updates - 要更新的欄位
 * @returns 更新後的記錄或 null
 */
export async function updateAccountRecord(
  recordId: string,
  userId: string,
  updates: Partial<Pick<AccountRecord, 'type' | 'amount' | 'category' | 'description' | 'date' | 'imageUrl'>>
): Promise<AccountRecord | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  // 如果更新日期，也要更新 ts
  const updateDoc: any = { ...updates };
  if (updates.date) {
    updateDoc.ts = `${updates.date}T12:00`;
  }
  updateDoc.updatedAt = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(recordId), userId },
    { $set: updateDoc },
    { returnDocument: 'after' }
  );

  return result ? fromMongoDB(result) : null;
}

/**
 * 刪除記帳記錄
 * 
 * @param recordId - 記錄 ID
 * @param userId - 使用者 ID（用於驗證）
 * @returns 是否成功刪除
 */
export async function deleteAccountRecord(
  recordId: string,
  userId: string
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  const result = await collection.deleteOne({
    _id: new ObjectId(recordId),
    userId,
  });

  return result.deletedCount > 0;
}

/**
 * 查詢日期區間總額
 * 
 * @param userId - 使用者 ID
 * @param startDate - 開始日期 (YYYY-MM-DD)
 * @param endDate - 結束日期 (YYYY-MM-DD)
 * @param type - 類型（可選，預設為所有）
 * @returns 總額
 */
export async function getTotalByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
  type?: 'income' | 'expense'
): Promise<{ total: number; income: number; expense: number }> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  const query: any = {
    userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (type) {
    query.type = type;
  }

  const result = await collection
    .aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ])
    .toArray();

  let income = 0;
  let expense = 0;

  for (const item of result) {
    if (item._id === 'income') {
      income = item.total;
    } else if (item._id === 'expense') {
      expense = item.total;
    }
  }

  return {
    total: type === 'income' ? income : type === 'expense' ? expense : income - expense,
    income,
    expense,
  };
}

/**
 * 取得最近幾筆記錄
 * 
 * @param userId - 使用者 ID
 * @param limit - 筆數，預設為 5
 * @param type - 類型（可選）
 * @returns 記帳記錄陣列
 */
export async function getRecentRecords(
  userId: string,
  limit: number = 5,
  type?: 'income' | 'expense'
): Promise<AccountRecord[]> {
  return getAccountRecords(userId, {
    type,
    limit,
  });
}

/**
 * 清空指定使用者的所有記錄
 * 
 * @param userId - 使用者 ID
 * @returns 刪除的筆數
 */
export async function clearAllRecords(userId: string): Promise<number> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);

  const result = await collection.deleteMany({ userId });
  return result.deletedCount;
}


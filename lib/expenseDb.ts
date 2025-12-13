import { getDb, COLLECTIONS } from './mongodb';
import { ObjectId } from 'mongodb';

export interface ExpenseRecord {
  _id?: ObjectId;
  user_id: string;
  category?: string | null;
  amount: number;
  note: string;
  ts: string; // ISO 時間字串
  createdAt?: Date;
}

/**
 * 新增一筆消費紀錄
 */
export async function addExpense(
  user_id: string,
  amount: number,
  category: string | null = null,
  note: string = '',
  ts?: string
): Promise<{ ok: boolean; ts: string }> {
  const db = await getDb();
  const collection = db.collection<ExpenseRecord>(COLLECTIONS.EXPENSES);

  const timestamp = ts || new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

  const record: ExpenseRecord = {
    user_id,
    category,
    amount,
    note,
    ts: timestamp,
    createdAt: new Date(),
  };

  await collection.insertOne(record);
  return { ok: true, ts: timestamp };
}

/**
 * 查詢日期區間總額
 */
export async function queryTotal(
  user_id: string,
  start_date: string,
  end_date: string
): Promise<{ total: number }> {
  const db = await getDb();
  const collection = db.collection<ExpenseRecord>(COLLECTIONS.EXPENSES);

  const start = new Date(start_date);
  const end = new Date(end_date);
  end.setHours(23, 59, 59, 999); // 包含整天

  const result = await collection
    .aggregate([
      {
        $match: {
          user_id,
          ts: {
            $gte: start.toISOString().slice(0, 10),
            $lte: end.toISOString().slice(0, 10),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])
    .toArray();

  return { total: result[0]?.total || 0.0 };
}

/**
 * 列出最近幾筆消費（新→舊）
 */
export async function listRecentExpenses(
  user_id: string,
  limit: number = 5
): Promise<ExpenseRecord[]> {
  const db = await getDb();
  const collection = db.collection<ExpenseRecord>(COLLECTIONS.EXPENSES);

  const records = await collection
    .find({ user_id })
    .sort({ _id: -1 })
    .limit(limit)
    .toArray();

  return records;
}

/**
 * 列出所有紀錄（舊→新）
 */
export async function listAllExpenses(
  user_id: string
): Promise<ExpenseRecord[]> {
  const db = await getDb();
  const collection = db.collection<ExpenseRecord>(COLLECTIONS.EXPENSES);

  const records = await collection
    .find({ user_id })
    .sort({ _id: 1 })
    .toArray();

  return records;
}

/**
 * 清空指定使用者的所有紀錄
 */
export async function clearExpenses(
  user_id: string
): Promise<{ ok: boolean; deleted: number }> {
  const db = await getDb();
  const collection = db.collection<ExpenseRecord>(COLLECTIONS.EXPENSES);

  const result = await collection.deleteMany({ user_id });
  return { ok: true, deleted: result.deletedCount };
}

/**
 * 刪除該 user 最新的一筆紀錄
 */
export async function deleteLastExpense(
  user_id: string
): Promise<{ ok: boolean; deleted_id?: string; reason?: string }> {
  const db = await getDb();
  const collection = db.collection<ExpenseRecord>(COLLECTIONS.EXPENSES);

  const lastRecord = await collection
    .findOne({ user_id }, { sort: { _id: -1 } });

  if (!lastRecord) {
    return { ok: false, reason: 'no_record' };
  }

  await collection.deleteOne({ _id: lastRecord._id });
  return { ok: true, deleted_id: lastRecord._id?.toString() };
}










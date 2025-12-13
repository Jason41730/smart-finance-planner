/**
 * LINE Bot 記帳 API（向後相容層）
 * 
 * 此模組保持現有 API 不變，內部使用統一的 accountDb
 * 確保 LINE Bot 功能不受影響，同時資料統一儲存到 accountRecords
 * 
 * ⚠️ 過渡期：新資料會寫入 accountRecords，舊資料仍在 expenses
 * 未來會完全遷移到 accountRecords，此模組可保留為 wrapper
 */

import { getDb, COLLECTIONS } from './mongodb';
import { ObjectId } from 'mongodb';
import { 
  addAccountRecord, 
  getAccountRecords, 
  getTotalByDateRange,
  getRecentRecords,
  clearAllRecords,
  type AccountRecord 
} from './accountDb';

// 保持向後相容的介面
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
 * 
 * ⚠️ 注意：此函數現在內部使用統一的 accountDb
 * 資料會寫入 accountRecords collection，source 標記為 'line'
 * 
 * @param user_id - 使用者 ID（LINE user_id）
 * @param amount - 金額
 * @param category - 類別（可選）
 * @param note - 備註（可選）
 * @param ts - ISO 時間字串（可選）
 * @param type - 類型：income 或 expense（可選，預設為 expense）
 * @returns 成功狀態和時間戳記
 */
export async function addExpense(
  user_id: string,
  amount: number,
  category: string | null = null,
  note: string = '',
  ts?: string,
  type: 'income' | 'expense' = 'expense'
): Promise<{ ok: boolean; ts: string }> {
  // 使用統一的 accountDb
  const date = ts ? ts.split('T')[0] : undefined;
  const record = await addAccountRecord(
    user_id,
    type,
    amount,
    category,
    note,
    date,
    'line' // 標記來源為 LINE Bot
  );

  return { ok: true, ts: record.ts };
}

/**
 * 查詢日期區間總額
 * 
 * ⚠️ 注意：現在查詢統一的 accountRecords
 * 只計算支出（expense），符合原本行為
 */
export async function queryTotal(
  user_id: string,
  start_date: string,
  end_date: string
): Promise<{ total: number }> {
  // 使用統一的 accountDb，只查詢支出
  const result = await getTotalByDateRange(
    user_id,
    start_date,
    end_date,
    'expense' // 只計算支出
  );

  return { total: result.expense };
}

/**
 * 列出最近幾筆消費（新→舊）
 * 
 * ⚠️ 注意：現在查詢統一的 accountRecords
 * 轉換為 ExpenseRecord 格式以保持向後相容
 */
export async function listRecentExpenses(
  user_id: string,
  limit: number = 5
): Promise<ExpenseRecord[]> {
  // 使用統一的 accountDb
  const records = await getRecentRecords(user_id, limit);

  // 轉換為 ExpenseRecord 格式（向後相容）
  return records.map(record => ({
    _id: record._id,
    user_id: record.userId,
    category: record.category,
    amount: record.amount,
    note: record.description,
    ts: record.ts,
    createdAt: record.createdAt,
  }));
}

/**
 * 列出所有紀錄（舊→新）
 * 
 * ⚠️ 注意：現在查詢統一的 accountRecords
 */
export async function listAllExpenses(
  user_id: string
): Promise<ExpenseRecord[]> {
  // 使用統一的 accountDb
  const records = await getAccountRecords(user_id);

  // 轉換為 ExpenseRecord 格式（向後相容）
  return records.map(record => ({
    _id: record._id,
    user_id: record.userId,
    category: record.category,
    amount: record.amount,
    note: record.description,
    ts: record.ts,
    createdAt: record.createdAt,
  }));
}

/**
 * 清空指定使用者的所有紀錄
 * 
 * ⚠️ 注意：現在清除統一的 accountRecords
 */
export async function clearExpenses(
  user_id: string
): Promise<{ ok: boolean; deleted: number }> {
  // 使用統一的 accountDb
  const deleted = await clearAllRecords(user_id);
  return { ok: true, deleted };
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










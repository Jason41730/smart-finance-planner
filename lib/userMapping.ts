/**
 * 使用者對應管理
 * 
 * 處理 LINE user_id 與 web user_id 的對應關係
 * 支援雙向綁定，讓使用者可以在 LINE Bot 和網站之間無縫切換
 */

import { getDb, COLLECTIONS } from './mongodb';
import { ObjectId } from 'mongodb';

/**
 * 使用者對應介面
 */
export interface UserMapping {
  _id?: ObjectId;
  web_user_id?: string;    // 網頁版使用者 ID（email 或 UUID）
  line_user_id?: string;   // LINE user_id
  email?: string;          // Email（如果有）
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 從 MongoDB 文件轉換為 UserMapping
 */
function fromMongoDB(doc: any): UserMapping {
  return {
    _id: doc._id,
    web_user_id: doc.web_user_id,
    line_user_id: doc.line_user_id,
    email: doc.email,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * 建立或更新使用者對應
 * 
 * @param webUserId - 網頁版使用者 ID（可選）
 * @param lineUserId - LINE user_id（可選）
 * @param email - Email（可選）
 * @returns 對應記錄
 */
export async function upsertUserMapping(
  webUserId?: string,
  lineUserId?: string,
  email?: string
): Promise<UserMapping> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.USER_MAPPINGS);

  if (!webUserId && !lineUserId) {
    throw new Error('至少需要提供 web_user_id 或 line_user_id');
  }

  // 查詢是否已存在對應關係
  const query: any = {};
  if (webUserId) query.web_user_id = webUserId;
  if (lineUserId) query.line_user_id = lineUserId;

  const existing = await collection.findOne(query);

  const now = new Date();
  const update: any = {
    updatedAt: now,
  };

  if (webUserId) update.web_user_id = webUserId;
  if (lineUserId) update.line_user_id = lineUserId;
  if (email) update.email = email;

  if (existing) {
    // 更新現有記錄
    await collection.updateOne(
      { _id: existing._id },
      { $set: update }
    );
    return fromMongoDB({ ...existing, ...update });
  } else {
    // 建立新記錄
    const newMapping: UserMapping = {
      web_user_id: webUserId,
      line_user_id: lineUserId,
      email,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(newMapping);
    return fromMongoDB({ ...newMapping, _id: result.insertedId });
  }
}

/**
 * 根據任一 user_id 取得所有相關的 user_id
 * 
 * @param userId - 可以是 web_user_id 或 line_user_id
 * @returns 所有相關的 user_id 陣列
 */
export async function getRelatedUserIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.USER_MAPPINGS);

  // 查詢包含此 user_id 的所有對應關係
  const mappings = await collection.find({
    $or: [
      { web_user_id: userId },
      { line_user_id: userId },
    ],
  }).toArray();

  // 收集所有相關的 user_id
  const userIds = new Set<string>();
  userIds.add(userId); // 包含自己

  for (const mapping of mappings) {
    if (mapping.web_user_id) userIds.add(mapping.web_user_id);
    if (mapping.line_user_id) userIds.add(mapping.line_user_id);
  }

  return Array.from(userIds);
}

/**
 * 根據 web_user_id 取得對應的 line_user_id
 * 
 * @param webUserId - 網頁版使用者 ID
 * @returns LINE user_id 或 null
 */
export async function getLineUserIdByWebUserId(webUserId: string): Promise<string | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.USER_MAPPINGS);

  const mapping = await collection.findOne({ web_user_id: webUserId });
  return mapping?.line_user_id || null;
}

/**
 * 根據 line_user_id 取得對應的 web_user_id
 * 
 * @param lineUserId - LINE user_id
 * @returns 網頁版使用者 ID 或 null
 */
export async function getWebUserIdByLineUserId(lineUserId: string): Promise<string | null> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.USER_MAPPINGS);

  const mapping = await collection.findOne({ line_user_id: lineUserId });
  return mapping?.web_user_id || null;
}

/**
 * 解除綁定關係
 * 
 * @param userId - 可以是 web_user_id 或 line_user_id
 * @param targetType - 要解除的類型：'line' 或 'web'
 * @returns 是否成功
 */
export async function unbindUserMapping(
  userId: string,
  targetType: 'line' | 'web'
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection(COLLECTIONS.USER_MAPPINGS);

  const query: any = {};
  if (targetType === 'line') {
    query.line_user_id = userId;
  } else {
    query.web_user_id = userId;
  }

  const update: any = {};
  if (targetType === 'line') {
    update.$unset = { line_user_id: '' };
  } else {
    update.$unset = { web_user_id: '' };
  }
  update.$set = { updatedAt: new Date() };

  const result = await collection.updateOne(query, update);
  return result.modifiedCount > 0;
}


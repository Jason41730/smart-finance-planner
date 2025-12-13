/**
 * API Client
 * 
 * 統一的 API 呼叫工具
 * 處理認證、錯誤處理、資料轉換
 */

import type { AccountRecord } from '@/types';

const API_BASE = '/api';

/**
 * 建立 API URL（不再需要 query parameter，使用 session）
 */
function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * 轉換 API 回傳的 AccountRecord 為前端格式
 */
function transformRecord(record: any): AccountRecord {
  return {
    id: record.id || record._id?.toString(),
    userId: record.userId,
    type: record.type,
    amount: record.amount,
    category: record.category || '',
    description: record.description || '',
    source: record.source || 'web',
    imageUrl: record.imageUrl,
    date: new Date(record.date || record.ts), // 轉換為 Date
    createdAt: new Date(record.createdAt),
  };
}

/**
 * 取得記帳記錄列表
 */
export async function fetchRecords(filters?: {
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  category?: string;
  source?: 'web' | 'line' | 'ocr';
  limit?: number;
}): Promise<AccountRecord[]> {
  const url = buildApiUrl('/records', filters as Record<string, string>);
  const response = await fetch(url, {
    credentials: 'include', // 包含 cookies (session)
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }

  const data = await response.json();
  return data.map(transformRecord);
}

/**
 * 新增記帳記錄
 */
export async function createRecord(record: {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  source?: 'web' | 'line' | 'ocr';
  imageUrl?: string;
}): Promise<AccountRecord> {
  const url = buildApiUrl('/records');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 包含 cookies (session)
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to create record');
  }

  const data = await response.json();
  return transformRecord(data);
}

/**
 * 更新記帳記錄
 */
export async function updateRecord(
  id: string,
  updates: Partial<{
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
    imageUrl: string;
  }>
): Promise<AccountRecord> {
  const url = buildApiUrl(`/records/${id}`);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 包含 cookies (session)
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to update record');
  }

  const data = await response.json();
  return transformRecord(data);
}

/**
 * 刪除記帳記錄
 */
export async function deleteRecord(id: string): Promise<void> {
  const url = buildApiUrl(`/records/${id}`);
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include', // 包含 cookies (session)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Failed to delete record');
  }
}

/**
 * 取得單一記帳記錄
 */
export async function fetchRecordById(id: string): Promise<AccountRecord> {
  const url = buildApiUrl(`/records/${id}`);
  const response = await fetch(url, {
    credentials: 'include', // 包含 cookies (session)
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Record not found');
    }
    throw new Error(`Failed to fetch record: ${response.statusText}`);
  }

  const data = await response.json();
  return transformRecord(data);
}


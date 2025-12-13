/**
 * 記帳記錄 API
 * 
 * 提供統一的記帳記錄 CRUD 操作
 * 支援網頁版和 LINE Bot（透過使用者對應）
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addAccountRecord,
  getAccountRecords,
  getTotalByDateRange,
  type AccountRecord,
  type AccountRecordFilters,
} from '@/lib/accountDb';
import { getRelatedUserIds } from '@/lib/userMapping';
import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * 取得當前使用者 ID（從 NextAuth session）
 */
async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * GET /api/records
 * 取得記帳記錄列表
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 取得所有相關的 user_id（支援使用者對應）
    const relatedUserIds = await getRelatedUserIds(userId);

    // 解析查詢參數
    const searchParams = request.nextUrl.searchParams;
    const filters: AccountRecordFilters = {};

    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as 'income' | 'expense';
    }
    if (searchParams.get('startDate')) {
      filters.startDate = searchParams.get('startDate')!;
    }
    if (searchParams.get('endDate')) {
      filters.endDate = searchParams.get('endDate')!;
    }
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!;
    }
    if (searchParams.get('source')) {
      filters.source = searchParams.get('source') as 'web' | 'line' | 'ocr';
    }
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!, 10);
    }
    if (searchParams.get('offset')) {
      filters.offset = parseInt(searchParams.get('offset')!, 10);
    }

    // 查詢所有相關使用者的記錄
    const allRecords: AccountRecord[] = [];
    for (const uid of relatedUserIds) {
      const records = await getAccountRecords(uid, filters);
      allRecords.push(...records);
    }

    // 排序（由新到舊）
    allRecords.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // 應用 limit（如果有多個 user_id）
    if (filters.limit && allRecords.length > filters.limit) {
      allRecords.splice(filters.limit);
    }

    return NextResponse.json(allRecords);
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/records
 * 新增記帳記錄
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount, category, description, date, source, imageUrl } = body;

    // 驗證必填欄位
    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount' },
        { status: 400 }
      );
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "income" or "expense"' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const record = await addAccountRecord(
      userId,
      type,
      amount,
      category || null,
      description || '',
      date,
      source || 'web',
      imageUrl
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating record:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


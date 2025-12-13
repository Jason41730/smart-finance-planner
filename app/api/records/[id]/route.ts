/**
 * 單一記帳記錄 API
 * 
 * GET /api/records/[id] - 取得單一記錄
 * PUT /api/records/[id] - 更新記錄
 * DELETE /api/records/[id] - 刪除記錄
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAccountRecordById,
  updateAccountRecord,
  deleteAccountRecord,
  type AccountRecord,
} from '@/lib/accountDb';
import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * 取得當前使用者 ID（從 NextAuth session）
 */
async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * GET /api/records/[id]
 * 取得單一記帳記錄
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const record = await getAccountRecordById(id, userId);
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/records/[id]
 * 更新記帳記錄
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { type, amount, category, description, date, imageUrl } = body;

    // 驗證
    if (type && type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "income" or "expense"' },
        { status: 400 }
      );
    }

    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (type) updates.type = type;
    if (amount !== undefined) updates.amount = amount;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (date) updates.date = date;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    const record = await updateAccountRecord(id, userId, updates);
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/records/[id]
 * 刪除記帳記錄
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const success = await deleteAccountRecord(id, userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


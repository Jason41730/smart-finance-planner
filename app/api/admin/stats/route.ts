/**
 * 管理後台統計 API
 * GET /api/admin/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/admin';
import { getDb, COLLECTIONS } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 取得 LINE user_id
    const lineUserId = (session.user as any).lineUserId;
    
    if (!lineUserId) {
      return NextResponse.json(
        { error: 'No LINE user_id found. Please login with LINE first.' },
        { status: 403 }
      );
    }

    if (!isAdmin(lineUserId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const db = await getDb();

    // 總使用者數
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const totalUsers = await usersCollection.countDocuments();

    // 總記帳筆數、總收入、總支出
    const recordsCollection = db.collection(COLLECTIONS.ACCOUNT_RECORDS);
    const totalRecords = await recordsCollection.countDocuments();

    const incomeResult = await recordsCollection.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray();
    const totalIncome = incomeResult[0]?.total || 0;

    const expenseResult = await recordsCollection.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray();
    const totalExpense = expenseResult[0]?.total || 0;

    // 最近 7 天新增記錄
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRecords = await recordsCollection.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    return NextResponse.json({
      totalUsers,
      totalRecords,
      totalIncome,
      totalExpense,
      recentRecords,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


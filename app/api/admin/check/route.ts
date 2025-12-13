/**
 * 檢查管理員權限
 * GET /api/admin/check
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { isAdmin: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 取得 LINE user_id（從 session 或透過 userMapping 查詢）
    const lineUserId = (session.user as any).lineUserId;
    
    if (!lineUserId) {
      return NextResponse.json({
        isAdmin: false,
        error: 'No LINE user_id found. Please login with LINE first.',
        userId: session.user.id,
      });
    }

    const adminStatus = isAdmin(lineUserId);

    return NextResponse.json({
      isAdmin: adminStatus,
      lineUserId,
      webUserId: session.user.id,
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


/**
 * 取得當前使用者的 LINE user_id
 * GET /api/admin/get-line-user-id
 * 
 * 用於協助設定管理後台：顯示當前使用者的 LINE user_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getLineUserIdByWebUserId } from '@/lib/userMapping';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const webUserId = session.user.id;
    
    // 從 session 取得（如果有）
    const lineUserIdFromSession = (session.user as any).lineUserId;
    
    // 或從 userMapping 查詢
    let lineUserId = lineUserIdFromSession;
    if (!lineUserId) {
      lineUserId = await getLineUserIdByWebUserId(webUserId);
    }

    return NextResponse.json({
      webUserId,
      lineUserId: lineUserId || null,
      message: lineUserId 
        ? `您的 LINE user_id 是：${lineUserId}`
        : '未找到 LINE user_id，請先使用 LINE 登入',
    });
  } catch (error) {
    console.error('Error getting LINE user ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


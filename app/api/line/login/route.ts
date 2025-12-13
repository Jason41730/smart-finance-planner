import { NextRequest, NextResponse } from 'next/server';
import { getLineLoginUrl } from '@/lib/lineLogin';

/**
 * 啟動 LINE Login 流程
 * GET /api/line/login
 */
export async function GET(request: NextRequest) {
  try {
    const state = request.nextUrl.searchParams.get('state') || undefined;
    const loginUrl = getLineLoginUrl(state);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('LINE Login error:', error);
    return NextResponse.json(
      { error: 'LINE Login 設定錯誤' },
      { status: 500 }
    );
  }
}


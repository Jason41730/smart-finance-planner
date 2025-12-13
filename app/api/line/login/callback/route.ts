import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { exchangeCodeForToken, getUserProfile } from '@/lib/lineLogin';

/**
 * LINE Login Callback
 * 處理 LINE Login 的回調，驗證 ID token 並建立/更新使用者
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 處理錯誤
    if (error) {
      console.error('LINE Login error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
    }

    // 交換 access token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token } = tokenData;

    // 取得使用者資訊
    const userInfo = await getUserProfile(access_token);
    const { userId, displayName, pictureUrl, email } = userInfo;

    // 儲存或更新使用者到 MongoDB
    const db = await getDb();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOneAndUpdate(
      { lineUserId: userId },
      {
        $set: {
          lineUserId: userId,
          name: displayName,
          email: userInfo.email || null,
          pictureUrl: pictureUrl || null,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 建立 session（簡化版，生產環境應使用 JWT 或 session store）
    // 這裡使用 redirect 帶參數，實際應使用 secure cookie
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('line_user_id', userId);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('LINE Login callback error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}


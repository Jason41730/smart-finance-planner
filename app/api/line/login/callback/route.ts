import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import { exchangeCodeForToken, getUserProfile } from '@/lib/lineLogin';
import { upsertUserMapping, getWebUserIdByLineUserId } from '@/lib/userMapping';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { encode } from 'next-auth/jwt';

/**
 * LINE Login Callback
 * 處理 LINE Login 的回調，建立/更新使用者並建立對應關係
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // 如果是綁定流程，state 會是 web_user_id
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
    const lineUserId = userInfo.userId; // LINE user_id
    const { displayName, pictureUrl, email } = userInfo;

    // 檢查是否已有對應的 web_user_id
    let webUserId = await getWebUserIdByLineUserId(lineUserId);

    if (!webUserId) {
      // 情境 A：綁定流程（state 有 web_user_id）
      if (state) {
        webUserId = state;
      } else {
        // 情境 B：新使用者，建立新的 web_user_id
        webUserId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // 建立/更新使用者對應關係
    await upsertUserMapping(webUserId, lineUserId, email);

    // 儲存或更新使用者到 MongoDB
    const db = await getDb();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // 檢查使用者是否存在
    let user = await usersCollection.findOne({
      $or: [
        { web_user_id: webUserId },
        { email: email || '' },
      ],
    });

    if (!user) {
      // 建立新使用者（沒有密碼，只能用 LINE 登入）
      await usersCollection.insertOne({
        web_user_id: webUserId,
        email: email || null,
        name: displayName,
        pictureUrl: pictureUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // 更新現有使用者（加入 LINE 資訊）
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            web_user_id: webUserId,
            name: displayName,
            email: email || user.email,
            pictureUrl: pictureUrl || user.pictureUrl,
            updatedAt: new Date(),
          },
        }
      );
    }

    // 建立 NextAuth JWT session
    // 因為 LINE Login 沒有密碼，我們需要直接建立 session token
    const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';
    
    // 建立 JWT token（符合 NextAuth 格式）
    const token = await encode({
      token: {
        sub: webUserId, // NextAuth 使用 sub 作為 user id
        id: webUserId,
        email: email || '',
        name: displayName,
        lineUserId: lineUserId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      secret,
    });

    // 設定 NextAuth session cookie
    // NextAuth 在生產環境使用 __Secure- 前綴，開發環境使用普通名稱
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
    
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('LINE Login callback error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}


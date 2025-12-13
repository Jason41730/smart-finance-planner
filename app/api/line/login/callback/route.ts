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

    // 使用臨時 token 方式建立 session
    // 建立一個臨時的認證 token，然後 redirect 到中間處理頁面
    const tempToken = crypto.randomUUID();
    
    // 將使用者資訊暫存（可以用 Redis，這裡簡化用 MongoDB）
    const tempTokensCollection = db.collection('tempAuthTokens');
    await tempTokensCollection.insertOne({
      token: tempToken,
      userId: webUserId,
      email: email || '',
      name: displayName,
      lineUserId: lineUserId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 分鐘後過期
    });

    // Redirect 到中間處理頁面，讓它建立 NextAuth session
    const handlerUrl = new URL('/api/auth/line-callback-handler', request.url);
    handlerUrl.searchParams.set('token', tempToken);
    
    return NextResponse.redirect(handlerUrl);
  } catch (error) {
    console.error('LINE Login callback error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}


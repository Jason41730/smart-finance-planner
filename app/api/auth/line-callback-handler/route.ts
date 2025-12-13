import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { encode } from 'next-auth/jwt';

/**
 * LINE Login Callback Handler
 * 處理 LINE Login 後的 session 建立
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    // 從 MongoDB 取得臨時 token 資訊
    const db = await getDb();
    const tempTokensCollection = db.collection('tempAuthTokens');
    const tempAuth = await tempTokensCollection.findOne({ token });

    if (!tempAuth) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // 檢查是否過期
    if (new Date() > tempAuth.expiresAt) {
      await tempTokensCollection.deleteOne({ token });
      return NextResponse.redirect(new URL('/login?error=token_expired', request.url));
    }

    // 建立 NextAuth JWT token（符合 NextAuth 格式）
    const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    const now = Math.floor(Date.now() / 1000);
    
    // NextAuth JWT token 格式（必須包含 sub, id, iat, exp）
    const jwtToken = await encode({
      token: {
        sub: tempAuth.userId, // 使用者 ID（必須）
        id: tempAuth.userId, // 自訂欄位（必須）
        name: tempAuth.name,
        email: tempAuth.email,
        picture: null,
        lineUserId: tempAuth.lineUserId, // 自訂欄位
        iat: now, // 發行時間（必須）
        exp: now + maxAge, // 過期時間（必須）
        jti: crypto.randomUUID(), // JWT ID（可選）
      },
      secret,
      maxAge,
    });

    // 刪除臨時 token
    await tempTokensCollection.deleteOne({ token });

    // 設定 NextAuth session cookie（使用 NextAuth 標準格式）
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const isSecure = baseUrl.startsWith('https://');
    
    // NextAuth 使用的 cookie 名稱
    const cookieName = isSecure && isProduction
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // 設定 cookie（符合 NextAuth 標準）
    response.cookies.set(cookieName, jwtToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: maxAge,
      path: '/',
      domain: undefined, // 讓瀏覽器自動決定
    });

    // 同時設定另一個可能的 cookie 名稱（NextAuth 4.x 可能使用）
    if (isSecure && isProduction) {
      response.cookies.set('next-auth.session-token', jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('LINE callback handler error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}


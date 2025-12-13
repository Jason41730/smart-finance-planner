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

    // 建立 NextAuth JWT token
    const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production';
    
    const jwtToken = await encode({
      token: {
        sub: tempAuth.userId,
        id: tempAuth.userId,
        email: tempAuth.email,
        name: tempAuth.name,
        lineUserId: tempAuth.lineUserId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      secret,
    });

    // 刪除臨時 token
    await tempTokensCollection.deleteOne({ token });

    // 設定 NextAuth session cookie
    // NextAuth 在生產環境可能使用不同的 cookie 名稱
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
    
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // 設定 cookie（嘗試兩種可能的 cookie 名稱）
    response.cookies.set(cookieName, jwtToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    // 也設定另一個可能的 cookie 名稱（NextAuth 可能使用）
    if (isProduction) {
      response.cookies.set('next-auth.session-token', jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('LINE callback handler error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}


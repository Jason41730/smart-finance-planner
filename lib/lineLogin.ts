/**
 * LINE Login 工具函式
 */

const LINE_LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID;
const LINE_LOGIN_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
const LINE_LOGIN_CALLBACK_URL =
  process.env.LINE_LOGIN_CALLBACK_URL ||
  (typeof window === 'undefined' 
    ? `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/line/login/callback`
    : '/api/line/login/callback');

if (!LINE_LOGIN_CHANNEL_ID || !LINE_LOGIN_CHANNEL_SECRET) {
  console.warn('⚠️ LINE Login 環境變數未設定');
}

/**
 * 產生 LINE Login 授權 URL
 * @param state 可選的 state 參數，用於 CSRF 保護
 * @returns LINE Login 授權 URL
 */
export function getLineLoginUrl(state?: string): string {
  if (!LINE_LOGIN_CHANNEL_ID) {
    throw new Error('LINE_LOGIN_CHANNEL_ID 未設定');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_LOGIN_CHANNEL_ID,
    redirect_uri: LINE_LOGIN_CALLBACK_URL,
    scope: 'profile openid email', // 需要的權限
    state: state || crypto.randomUUID(), // CSRF 保護
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * 用 authorization code 換取 access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  if (!LINE_LOGIN_CHANNEL_ID || !LINE_LOGIN_CHANNEL_SECRET) {
    throw new Error('LINE Login 環境變數未設定');
  }

  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINE_LOGIN_CALLBACK_URL,
      client_id: LINE_LOGIN_CHANNEL_ID,
      client_secret: LINE_LOGIN_CHANNEL_SECRET,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return await response.json();
}

/**
 * 驗證 ID token（簡化版）
 * 生產環境應完整驗證簽章、issuer、audience 等
 */
export async function verifyIdToken(idToken: string): Promise<{
  sub: string; // LINE user ID
  name?: string;
  picture?: string;
  email?: string;
}> {
  // 簡化版：直接使用 access token 取得使用者資訊
  // 生產環境應使用 JWT 驗證庫驗證 id_token
  // 這裡先返回空物件，實際應解析 JWT
  return {} as any;
}

/**
 * 使用 access token 取得使用者資訊
 */
export async function getUserProfile(accessToken: string): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}> {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  const profile = await response.json();

  // 如果有 email scope，需要另外取得
  let email: string | undefined;
  try {
    const emailResponse = await fetch('https://api.line.me/v2/oauth2/v2.1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (emailResponse.ok) {
      const emailData = await emailResponse.json();
      email = emailData.email;
    }
  } catch (error) {
    // Email 可能不在 scope 中，忽略錯誤
    console.warn('Failed to get email:', error);
  }

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    email,
  };
}

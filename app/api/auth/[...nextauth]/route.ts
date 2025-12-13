/**
 * NextAuth.js 設定
 * 
 * 提供認證功能，支援：
 * - Credentials (Email/Password)
 * - LINE Login
 * - Session 管理
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const db = await getDb();
        const usersCollection = db.collection(COLLECTIONS.USERS);

        // 查詢使用者（使用 email 或 web_user_id）
        const user = await usersCollection.findOne({
          $or: [
            { email: credentials.email },
            { web_user_id: credentials.email }, // 也支援用 web_user_id 登入
          ],
        });

        if (!user) {
          return null;
        }

        // 驗證密碼（如果有的話）
        if (user.password) {
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            return null;
          }
        } else {
          // 如果沒有密碼（例如 LINE 使用者），檢查是否為臨時密碼或允許登入
          // 這裡簡化處理：如果沒有密碼，暫時不允許登入（未來可改進）
          return null;
        }

        return {
          id: user.web_user_id || user._id?.toString() || user.email,
          email: user.email || credentials.email,
          name: user.name || user.displayName || 'User',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      
      // 如果是 LINE Login，儲存 line_user_id
      if (account?.provider === 'line') {
        token.lineUserId = account.providerAccountId;
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        if (token.lineUserId) {
          (session.user as any).lineUserId = token.lineUserId as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
});

export const { auth, signIn, signOut } = handler;
export { handler as GET, handler as POST };

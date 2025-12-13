/**
 * 使用者註冊 API
 * 
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { upsertUserMapping } from '@/lib/userMapping';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // 驗證必填欄位
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // 檢查 email 是否已存在
    const existingUser = await usersCollection.findOne({
      email,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // 建立 web_user_id
    const webUserId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立使用者
    const newUser = {
      web_user_id: webUserId,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    // 建立使用者對應（只有 web_user_id，LINE 之後可以綁定）
    await upsertUserMapping(webUserId, undefined, email);

    return NextResponse.json({
      success: true,
      user: {
        id: webUserId,
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


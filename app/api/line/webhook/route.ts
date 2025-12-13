import { NextRequest, NextResponse } from 'next/server';
import { Client, validateSignature, WebhookEvent } from '@line/bot-sdk';
import { chat } from '@/lib/expenseAgent';
import crypto from 'crypto';

// LINE Bot 設定 (Messaging API)
const channelAccessToken = process.env.LINE_MSG_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_MSG_CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
  throw new Error('請設定 LINE_MSG_CHANNEL_ACCESS_TOKEN 和 LINE_MSG_CHANNEL_SECRET');
}

const client = new Client({
  channelAccessToken,
  channelSecret,
});

// LINE webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!channelSecret) {
      return NextResponse.json({ error: 'Channel secret not configured' }, { status: 500 });
    }

    // 驗證簽章
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const events: WebhookEvent[] = JSON.parse(body).events;

    // 處理每個事件
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const userText = event.message.text;

        if (!userId) {
          console.error('Missing user ID');
          continue;
        }

        try {
          console.log('Processing message:', { userId, userText });
          
          // 使用 expense agent 處理訊息
          const replyText = await chat(userText, userId);
          
          console.log('Generated reply:', replyText);

          // 回覆訊息
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: replyText,
          });
        } catch (error) {
          console.error('Error processing message:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // 判斷錯誤類型，提供更友善的錯誤訊息
          let errorMessage = '未知錯誤';
          if (error instanceof Error) {
            if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
              errorMessage = '資料庫連線問題，請檢查 MONGODB_URI 環境變數';
            } else if (error.message.includes('MongoServerError')) {
              errorMessage = '資料庫連線失敗';
            } else {
              errorMessage = error.message;
            }
          }
          
          // 回覆錯誤訊息（不顯示技術細節給使用者）
          try {
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: `記帳系統目前有點問題，晚點再試試看 QQ`,
            });
          } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 只允許 POST
export async function GET() {
  return NextResponse.json({ message: 'LINE Webhook endpoint' });
}


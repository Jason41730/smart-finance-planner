import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { chat } from '@/lib/expenseAgent';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('請設定環境變數 OPENAI_API_KEY');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OCR 識別收據並自動記帳
 * POST /api/upload/ocr
 * Body: { imageUrl: string, userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, userId } = body;

    if (!imageUrl || !userId) {
      return NextResponse.json(
        { error: '請提供 imageUrl 和 userId' },
        { status: 400 }
      );
    }

    // 使用 OpenAI Vision API 識別收據內容
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 或 gpt-4o-mini
      messages: [
        {
          role: 'system',
          content: `你是一個收據識別專家。請從圖片中提取以下資訊：
1. 金額（必填）
2. 類別（飲食、交通、購物、娛樂、醫療、教育、其他）
3. 描述/備註（選填）
4. 日期（如果有的話，格式：YYYY-MM-DD）

請以 JSON 格式回覆：
{
  "amount": 數字,
  "category": "類別名稱",
  "note": "描述",
  "date": "YYYY-MM-DD" 或 null
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '請識別這張收據的內容',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const ocrResult = JSON.parse(response.choices[0].message.content || '{}');

    // 使用 expense agent 自動記帳
    const note = ocrResult.note || '收據識別';
    const dateStr = ocrResult.date ? `，日期 ${ocrResult.date}` : '';
    const userPrompt = `幫我記一筆 ${ocrResult.category || '其他'} ${ocrResult.amount} 元，備註 ${note}${dateStr}`;

    const replyText = await chat(userPrompt, userId);

    return NextResponse.json({
      success: true,
      ocr: ocrResult,
      message: replyText,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'OCR 識別失敗' },
      { status: 500 }
    );
  }
}










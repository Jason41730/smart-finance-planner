import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 上傳圖片到 Cloudinary
 * POST /api/upload
 * Body: FormData with 'file' field
 */
export async function POST(request: NextRequest) {
  try {
    // 檢查環境變數
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: 'Cloudinary 設定不完整' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '請提供檔案' },
        { status: 400 }
      );
    }

    // 轉換為 buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上傳到 Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            folder: 'smart-finance/receipts', // 可選：指定資料夾
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
      width: (result as any).width,
      height: (result as any).height,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '上傳失敗' },
      { status: 500 }
    );
  }
}

// 只允許 POST
export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint' });
}










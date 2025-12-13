'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react';

export default function BindLinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleBindLine = () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    // 跳轉到 LINE Login，帶上 web_user_id 作為 state
    const state = session.user.id;
    window.location.href = `/api/line/login?state=${state}`;
  };

  const hasLineBinding = (session?.user as any)?.lineUserId;

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">載入中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">綁定 LINE 帳號</h1>
          <p className="text-gray-600 mt-1">
            綁定後，您可以在 LINE Bot 和網頁版之間同步記帳資料
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <LinkIcon className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">LINE 帳號綁定</p>
                  <p className="text-sm text-gray-600">
                    {hasLineBinding
                      ? '已綁定 LINE 帳號'
                      : '尚未綁定 LINE 帳號'}
                  </p>
                </div>
              </div>
              {hasLineBinding ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {hasLineBinding ? (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ 您的帳號已綁定 LINE，可以在 LINE Bot 和網頁版之間同步資料。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>綁定後您可以：</strong>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>在 LINE Bot 記帳，網頁版自動同步</li>
                    <li>在網頁版記帳，LINE Bot 可查詢</li>
                    <li>統一管理所有記帳資料</li>
                  </ul>
                </div>

                <Button
                  onClick={handleBindLine}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? '處理中...' : '綁定 LINE 帳號'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">使用說明</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>1. 綁定流程：</strong>
              點擊「綁定 LINE 帳號」按鈕，會跳轉到 LINE 授權頁面，完成授權後自動返回。
            </p>
            <p>
              <strong>2. 資料同步：</strong>
              綁定後，您在 LINE Bot 或網頁版的記帳資料會自動同步到另一個平台。
            </p>
            <p>
              <strong>3. 解除綁定：</strong>
              如需解除綁定，請聯繫客服或刪除帳號。
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


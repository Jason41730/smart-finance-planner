'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, DollarSign, TrendingUp, FileText, RefreshCw, Copy } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalRecords: number;
  totalIncome: number;
  totalExpense: number;
  recentRecords: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'loading') {
      return;
    }

    // 檢查是否為管理員
    checkAdminStatus();
    fetchStats();
  }, [status, session, router]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check');
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
        if (!data.isAdmin) {
          setError('您沒有權限訪問管理後台。請確認您的 User ID 已加入 ADMIN_USER_IDS 環境變數。');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('沒有權限訪問管理後台。');
        } else {
          setError(`載入失敗：${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('載入統計資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">載入中...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <div className="p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">管理後台</h1>
              <p className="text-red-600 mb-4">{error || '您沒有權限訪問此頁面'}</p>
              <p className="text-sm text-gray-600 mb-4">
                如需訪問管理後台，請確認：
              </p>
              <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
                <li>1. 使用 LINE 登入（管理後台只支援 LINE user_id）</li>
                <li>2. 您的 LINE User ID 已加入 <code className="bg-gray-100 px-1 rounded">ADMIN_USER_IDS</code> 環境變數</li>
                <li>3. 環境變數格式：<code className="bg-gray-100 px-1 rounded">ADMIN_USER_IDS=U1234567890abcdef,U0987654321fedcba</code></li>
                <li>4. 已重新部署應用程式</li>
              </ul>
              <div className="mt-4">
                <Button onClick={() => window.location.href = '/api/line/login'}>
                  使用 LINE 登入
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理後台</h1>
            <p className="text-gray-600 mt-1">系統統計與管理</p>
          </div>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重新整理
          </Button>
        </div>

        {error && (
          <Card>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {stats && (
          <>
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總使用者數</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總記帳筆數</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalRecords}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總收入</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ${stats.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">總支出</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      ${stats.totalExpense.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* 詳細資訊 */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">系統資訊</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">最近 7 天新增記錄：</span>
              <span className="font-medium">{stats.recentRecords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">淨收支：</span>
              <span className={`font-medium ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(stats.totalIncome - stats.totalExpense).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* 顯示當前使用者的 LINE user_id（協助設定） */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">我的 LINE User ID</h2>
          <GetLineUserId />
        </Card>
          </>
        )}
      </div>
    </Layout>
  );
}

// 取得 LINE user_id 組件
function GetLineUserId() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/get-line-user-id')
      .then(res => res.json())
      .then(data => {
        setLineUserId(data.lineUserId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyToClipboard = () => {
    if (lineUserId) {
      navigator.clipboard.writeText(lineUserId);
      alert('已複製到剪貼簿！');
    }
  };

  if (loading) {
    return <p className="text-gray-600">載入中...</p>;
  }

  if (!lineUserId) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          未找到 LINE user_id。請先使用 LINE 登入，然後重新整理此頁面。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        將此 LINE user_id 加入 <code className="bg-gray-100 px-1 rounded">ADMIN_USER_IDS</code> 環境變數即可訪問管理後台：
      </p>
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
        <code className="flex-1 font-mono text-sm">{lineUserId}</code>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}


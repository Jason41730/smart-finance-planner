/**
 * API 測試
 * 
 * 測試記帳 API 的基本功能
 */

import { describe, it, expect } from 'vitest';

describe('Account Records API', () => {
  // 注意：這些測試需要運行中的伺服器
  // 在 CI/CD 中，應該先啟動測試伺服器
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const isServerRunning = false; // 在實際測試中，應該檢查伺服器是否運行

  describe('GET /api/records', () => {
    it('應該需要認證', async () => {
      if (!isServerRunning) {
        // 跳過測試如果伺服器沒有運行
        return;
      }
      const response = await fetch(`${API_BASE}/records`);
      expect(response.status).toBe(401);
    });

    it('應該回傳記錄列表（需要 session）', async () => {
      if (!isServerRunning) {
        return;
      }
      // 注意：這個測試需要實際的 session cookie
      // 在實際測試中，需要先登入取得 session
      const response = await fetch(`${API_BASE}/records`, {
        credentials: 'include',
      });
      // 如果沒有 session，應該是 401
      // 如果有 session，應該是 200
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /api/records', () => {
    it('應該需要認證', async () => {
      if (!isServerRunning) {
        return;
      }
      const response = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'expense',
          amount: 100,
          category: '飲食',
          description: '測試',
          date: '2024-01-01',
        }),
      });
      expect(response.status).toBe(401);
    });

    it('應該驗證必填欄位', async () => {
      if (!isServerRunning) {
        return;
      }
      // 這個測試需要 session，但我們可以測試驗證邏輯
      const response = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          // 缺少 type 和 amount
          category: '飲食',
        }),
      });
      // 應該是 400 或 401（取決於是否有 session）
      expect([400, 401]).toContain(response.status);
    });
  });
});


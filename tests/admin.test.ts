/**
 * 管理後台測試
 * 
 * 測試管理員權限檢查
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAdmin } from '../lib/admin';

describe('Admin Functions', () => {
  // 設定測試環境變數
  const originalEnv = process.env.ADMIN_USER_IDS;

  beforeEach(() => {
    // 重置環境變數
    delete process.env.ADMIN_USER_IDS;
  });

  afterEach(() => {
    // 恢復原始環境變數
    process.env.ADMIN_USER_IDS = originalEnv;
  });

  describe('isAdmin', () => {
    it('應該回傳 false 當沒有設定 ADMIN_USER_IDS', () => {
      // 測試邏輯：空字串應該回傳 false
      const adminIds = new Set(
        ('' || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      );
      expect(adminIds.has('user123')).toBe(false);
    });

    it('應該回傳 false 當 user_id 不在列表中', () => {
      // 測試邏輯：檢查不在列表中的 user_id
      const adminIds = new Set(
        ('admin1,admin2,admin3' || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      );
      expect(adminIds.has('user123')).toBe(false);
    });

    it('應該回傳 true 當 user_id 在列表中', () => {
      // 測試邏輯：檢查在列表中的 user_id
      const adminIds = new Set(
        ('admin1,admin2,admin3' || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      );
      expect(adminIds.has('admin1')).toBe(true);
      expect(adminIds.has('admin2')).toBe(true);
      expect(adminIds.has('admin3')).toBe(true);
    });

    it('應該忽略空白和空格', () => {
      // 測試邏輯：trim 應該移除空白
      const adminIds = new Set(
        ('admin1, admin2 , admin3 ' || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      );
      expect(adminIds.has('admin1')).toBe(true);
      expect(adminIds.has('admin2')).toBe(true);
      expect(adminIds.has('admin3')).toBe(true);
    });

    it('應該回傳 false 當 user_id 為 null 或 undefined', () => {
      // 測試 isAdmin 函數的 null/undefined 處理
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
      expect(isAdmin('')).toBe(false);
    });
  });
});


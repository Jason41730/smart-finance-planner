/**
 * LINE Bot 記帳助理測試
 * 
 * 測試 LLM 記帳邏輯
 */

import { describe, it, expect } from 'vitest';

describe('Expense Agent', () => {
  describe('Intent Classification', () => {
    it('應該正確識別記帳意圖', () => {
      // TODO: 實作測試
      // 測試 LLM 是否能正確理解記帳需求
    });

    it('應該正確識別查詢意圖', () => {
      // TODO: 實作測試
    });

    it('應該正確識別閒聊', () => {
      // TODO: 實作測試
    });
  });

  describe('Tool Calling', () => {
    it('應該正確呼叫 add_expense 工具', () => {
      // TODO: 實作測試
    });

    it('應該正確呼叫 query_total 工具', () => {
      // TODO: 實作測試
    });

    it('應該正確呼叫 list_recent 工具', () => {
      // TODO: 實作測試
    });
  });

  describe('Response Validation', () => {
    it('應該驗證回覆格式', () => {
      // TODO: 實作測試
    });
  });
});


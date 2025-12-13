# 測試說明

## 測試框架

使用 **Vitest** 作為測試框架，支援：
- TypeScript
- Watch mode
- UI 模式
- Coverage 報告

## 執行測試

```bash
# 執行所有測試
npm test

# Watch mode（開發時使用）
npm run test:watch

# UI 模式（視覺化測試結果）
npm run test:ui
```

## 測試檔案

- `admin.test.ts` - 管理員權限測試（✅ 可執行）
- `api.test.ts` - API 端點測試（⚠️ 需要 session mock）
- `userMapping.test.ts` - 使用者對應測試（⚠️ 需要 MongoDB）
- `accountDb.test.ts` - 記帳資料庫測試（⚠️ 需要 MongoDB）
- `expenseAgent.test.ts` - LINE Bot 記帳助理測試（⚠️ 需要 OpenAI API）

## 測試狀態

### ✅ 可執行測試
- `admin.test.ts` - 純函數測試，不需要外部依賴

### ⚠️ 需要改進的測試
- `api.test.ts` - 需要 session mock 或測試資料庫
- `userMapping.test.ts` - 需要 MongoDB 連線（建議使用測試資料庫）
- `accountDb.test.ts` - 需要 MongoDB 連線
- `expenseAgent.test.ts` - 需要 OpenAI API（建議使用 mock）

## 測試環境變數

建立 `.env.test` 檔案（用於測試環境）：

```env
MONGODB_URI=mongodb://localhost:27017/smart-finance-test
NEXTAUTH_SECRET=test-secret-key
ADMIN_USER_IDS=test_admin_1,test_admin_2
```

## 未來改進

- [ ] 加入 MongoDB 測試資料庫設定
- [ ] 加入 Session mock 工具
- [ ] 加入 OpenAI API mock
- [ ] 加入 E2E 測試（Playwright）
- [ ] 設定 CI/CD 自動測試


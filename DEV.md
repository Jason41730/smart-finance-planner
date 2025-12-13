# 開發者指南

快速掌握專案核心架構與開發重點。

## 專案整合歷程 (last update: 12/14)

### 主要整合工作

1. **資料庫統一**
   - 建立 `accountRecords` collection 作為統一記帳記錄
   - 實作 `userMappings` 處理 LINE ↔ Web 使用者對應
   - 統一資料格式（camelCase、ISO 日期）

2. **認證系統整合**
   - 實作 NextAuth.js session 管理
   - 支援 Credentials Provider（網頁註冊登入）
   - 支援 LINE Login（LINE 用戶登入）
   - 建立 LINE ↔ Web 使用者綁定機制

3. **API 統一**
   - 建立 `/api/records` RESTful API
   - 統一處理來自 Web 和 LINE Bot 的記帳請求
   - 透過 `getRelatedUserIds` 自動查詢相關使用者記錄

4. **部署整合**
   - 統一部署到 Vercel
   - 整合所有環境變數
   - 解決 MongoDB 連線、session 建立等問題

### 架構決策

- **使用者識別**：使用 `userMappings` 實現雙向綁定，而非強制單一 ID
- **資料格式**：統一使用 `camelCase` 和 ISO 日期格式，避免技術債
- **Session 管理**：使用 NextAuth.js JWT，取代 query parameter 方式
- **Prompt 設計**：完全依賴 LLM 語意理解，避免關鍵字匹配

## LINE Bot

- **LINE ID**: `@129sanuz`
- **Webhook**: `/api/line/webhook`
- **核心邏輯**: `lib/expenseAgent.ts`
- **部署**: Vercel

## Prompt 工程

### 核心檔案

- **System Prompt**: `lib/expenseAgent.ts` (約 280-360 行)
- **工具描述**: `lib/expenseAgent.ts` (約 23-150 行)

### 調整 Prompt

**System Prompt 位置：**
```typescript
// lib/expenseAgent.ts
const systemPrompt = `你是一個記帳助理...`;
```

**關鍵設計原則：**
1. **語意理解優先**：不使用關鍵字匹配，完全依賴 LLM 語意理解
2. **上下文記憶**：明確指示 LLM 參考對話歷史
3. **Few-Shot Learning**：提供 5+ 個對話範例
4. **工具使用規範**：明確說明何時呼叫工具、如何提取資訊

**工具描述位置：**
```typescript
// lib/expenseAgent.ts
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'add_expense',
      description: `...`, // 這裡調整工具描述
    }
  }
];
```

### Prompt 優化重點

- **對話記憶**：強調「必須參考對話歷史」來理解「對」、「正確」等確認詞
- **意圖判斷**：避免關鍵字匹配，依賴語意理解
- **錯誤處理**：提供清楚的錯誤訊息和處理方式

## 對話記憶管理

### 架構

- **儲存**: `lib/conversationDb.ts`
- **使用**: `lib/expenseAgent.ts` (約 274-282 行)

### 記憶機制

```typescript
// 載入對話歷史
const conversationHistory = await getConversationHistory(userId, 10);

// 儲存對話
await saveConversationMessage(userId, 'user', userText);
await saveConversationMessage(userId, 'assistant', reply);
```

### 設定

- **保留天數**: 7 天 (`MAX_CONVERSATION_AGE_DAYS`)
- **最大訊息數**: 20 輪 (`MAX_MESSAGES_PER_CONVERSATION`)
- **載入數量**: 10 條（用於 LLM context）

### 容錯機制

- MongoDB 連線失敗時，返回空陣列（不中斷流程）
- 對話歷史儲存失敗時，不影響記帳功能
- 開發環境會記錄對話歷史載入情況

## 資料庫架構

### Collections

- `users`: 使用者基本資料
- `userMappings`: LINE ↔ Web 使用者對應
- `accountRecords`: 統一記帳記錄（收入+支出）
- `conversations`: 對話歷史
- `financialGoals`: 財務目標
- `llmPlans`: LLM 生成的規劃

### 統一記帳 API

- **檔案**: `lib/accountDb.ts`
- **支援**: 收入/支出、多來源（web/line/ocr）
- **格式**: `camelCase`、ISO 日期

## 使用者對應

### 架構

- **檔案**: `lib/userMapping.ts`
- **策略**: 雙向綁定（LINE ↔ Web）
- **使用**: API Routes 自動處理

### 對應流程

1. LINE Login → 建立/更新 mapping
2. Web 登入 → 透過 mapping 查詢相關記錄
3. LINE Bot → 透過 mapping 同步資料

## API 架構

### RESTful Endpoints

- `GET /api/records`: 查詢記帳記錄
- `POST /api/records`: 新增記錄
- `GET /api/records/[id]`: 取得單筆記錄
- `PUT /api/records/[id]`: 更新記錄
- `DELETE /api/records/[id]`: 刪除記錄

### 認證

- **Session**: NextAuth.js (JWT)
- **檔案**: `app/api/auth/[...nextauth]/route.ts`
- **策略**: Credentials Provider + LINE Login

## 測試

```bash
npm test          # 執行測試
npm run test:watch # 監聽模式
npm run test:ui    # UI 模式
```

**測試檔案**:
- `tests/admin.test.ts`: Admin 權限檢查
- `tests/api.test.ts`: API 端點測試
- `tests/userMapping.test.ts`: 使用者對應
- `tests/accountDb.test.ts`: 記帳資料庫操作
- `tests/expenseAgent.test.ts`: LLM 互動（待實作）

## 環境變數

詳細設定請參考 `VERCEL_ENV.example.txt`。

**關鍵變數**:
- `MONGODB_URI`: MongoDB 連線字串
- `OPENAI_API_KEY`: OpenAI API 金鑰
- `LINE_MSG_*`: LINE Messaging API
- `LINE_LOGIN_*`: LINE Login API
- `NEXTAUTH_SECRET`: NextAuth 密鑰

## 除錯

### 對話歷史

開發環境會自動記錄對話歷史載入情況：
```
[對話歷史] 載入了 2 條歷史訊息：
  1. [user] 晚餐150
  2. [assistant] 請問是今天的晚餐嗎？類別是飲食對吧？
```

### MongoDB 連線

檢查 Vercel Logs，確認連線狀態。

### LLM 回應

檢查 `lib/expenseAgent.ts` 中的 console.log（開發環境）。

## 常見問題

**Q: LINE Bot 沒有記憶？**
- 檢查 MongoDB 連線是否正常（Vercel Logs）
- 確認 `conversationDb.ts` 的錯誤處理
- 查看 Vercel Logs 的對話歷史載入情況

**Q: Prompt 調整沒效果？**
- 確認已重新部署（Vercel）
- 檢查 System Prompt 和工具描述的格式
- 查看 LLM 回應日誌

**Q: 資料不同步？**
- 檢查 `userMapping.ts` 的對應關係
- 確認 API 使用 `getRelatedUserIds` 查詢


# 多登入方式與帳號關聯設計建議

## 問題分析

### 1. 多登入方式的必要性

**為什麼需要提供 Google/GitHub OAuth？**

- **降低註冊門檻**：提供 Google/GitHub OAuth 可以讓只想用網頁版的用戶快速註冊，不需要記住額外的帳號密碼
- **提升使用意願**：部分用戶偏好使用熟悉的第三方登入方式，而不是建立新帳號
- **擴大用戶群**：LINE 登入主要適合行動場景，網頁版用戶可能更偏好 Google/GitHub
- **符合現代標準**：多數現代應用都提供多種登入方式

**結論**：建議提供 Email/Password、LINE、Google、GitHub 四種登入方式。

### 2. 帳號關聯策略

**核心概念：帳號關聯而非帳號合併**

- 一個主帳號可以綁定多個登入方式（LINE、Google、GitHub、Email/Password）
- 所有登入方式共享同一份資料（記帳記錄、目標等）
- 用戶可以隨時新增或移除登入方式
- 避免資料分散在不同帳號的問題

## 建議的資料庫設計

### 方案 A：統一帳號系統（推薦）

```typescript
// 更新後的 User 模型
export interface User {
  id: string;                    // 主帳號 ID（唯一）
  name: string;
  email?: string;                 // 可能為空（如果只用 LINE 且 LINE 沒有提供 email）
  createdAt: Date;
  updatedAt: Date;
  
  // 多登入方式關聯
  authProviders: {
    line?: {
      lineUserId: string;
      displayName?: string;
      pictureUrl?: string;
      connectedAt: Date;
    };
    google?: {
      googleId: string;
      email: string;
      name?: string;
      picture?: string;
      connectedAt: Date;
    };
    github?: {
      githubId: string;
      username: string;
      email?: string;
      name?: string;
      avatar?: string;
      connectedAt: Date;
    };
    email?: {
      email: string;
      passwordHash: string;
      verified: boolean;
      createdAt: Date;
    };
  };
}
```

### 方案 B：帳號關聯表（更彈性）

```typescript
// 獨立的認證提供者表
interface AuthProvider {
  id: string;
  userId: string;              // 關聯到主 User
  provider: 'line' | 'google' | 'github' | 'email';
  providerId: string;           // 該提供者的唯一 ID
  email?: string;               // 用於關聯（可能為空）
  metadata: {
    name?: string;
    picture?: string;
    username?: string;
    [key: string]: any;
  };
  connectedAt: Date;
}

// User 表保持簡潔
interface User {
  id: string;
  primaryEmail?: string;        // 主要 email（用於關聯）
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**建議採用方案 A**，因為：
- 結構簡單，查詢效率高
- 符合 MongoDB 的文檔模型
- 易於實作和管理

## 使用情境流程

### 情境 1：先用 GitHub 登入，後來想加 LINE

1. **初始註冊**
   - 用戶使用 GitHub 登入
   - 系統建立 User 帳號（email: user@example.com）
   - `authProviders.github` 被設定

2. **連接 LINE**
   - 用戶在「帳號設定」頁面點擊「連接 LINE」
   - 系統引導用戶完成 LINE OAuth 流程
   - 系統檢查 LINE 的 email 是否與現有帳號相同
     - **相同** → 直接關聯，設定 `authProviders.line`
     - **不同或無 email** → 提示用戶確認是否要關聯到現有帳號
   - 關聯成功後，兩種登入方式都可使用同一帳號

3. **資料共享**
   - 無論用哪種方式登入，看到的都是同一份記帳記錄和目標

### 情境 2：先用 LINE 登入，後來想加 Google

1. **初始註冊**
   - 用戶使用 LINE 登入（可能沒有 email）
   - 系統建立 User 帳號（email: null）
   - `authProviders.line` 被設定

2. **連接 Google**
   - 用戶在「帳號設定」頁面點擊「連接 Google」
   - 系統引導用戶完成 Google OAuth 流程
   - 系統將 Google 的 email 設為主 email（如果 LINE 沒有）
   - 設定 `authProviders.google`

3. **後續登入**
   - 用戶可以用 LINE 或 Google 登入，都是同一個帳號

### 情境 3：兩個帳號都有資料，需要合併

**重要**：這是最複雜的情況，需要特別處理。

1. **偵測衝突**
   - 用戶嘗試連接新的登入方式
   - 系統發現該登入方式已經對應到另一個 User 帳號
   - 系統提示用戶：「發現您已有另一個帳號，是否要合併？」

2. **合併流程**
   - 顯示兩個帳號的資料統計（記帳筆數、目標數量等）
   - 讓用戶選擇：
     - 合併到現有帳號（保留當前登入的帳號）
     - 合併到另一個帳號（切換到另一個帳號）
     - 取消合併（保持兩個獨立帳號）

3. **資料合併規則**
   - 記帳記錄：全部保留，按時間排序
   - 財務目標：全部保留
   - LLM 規劃：保留最新的
   - 設定：以主帳號為準

## 建議的 UI/UX 設計

### 登入頁面

```
┌─────────────────────────────┐
│      智選理財家              │
│   Smart Finance Planner     │
│                             │
│  ┌─────────────────────┐   │
│  │ 使用 Google 登入    │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 使用 GitHub 登入    │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 使用 LINE 登入      │   │
│  └─────────────────────┘   │
│                             │
│  ───────── 或 ─────────    │
│                             │
│  使用 Email 登入            │
│  [Email 輸入框]             │
│  [密碼輸入框]               │
│  [登入按鈕]                 │
│                             │
│  還沒有帳號？ [立即註冊]    │
└─────────────────────────────┘
```

### 帳號設定頁面

```
┌─────────────────────────────┐
│  帳號設定                    │
│                             │
│  已連接的登入方式            │
│  ┌─────────────────────┐   │
│  │ ✓ Google            │   │
│  │   user@gmail.com    │   │
│  │   [移除]            │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ ✓ GitHub            │   │
│  │   @username         │   │
│  │   [移除]            │   │
│  └─────────────────────┘   │
│                             │
│  可連接的登入方式            │
│  ┌─────────────────────┐   │
│  │ + 連接 LINE         │   │
│  └─────────────────────┘   │
│                             │
│  ⚠️ 注意：至少需要保留一種   │
│     登入方式                │
└─────────────────────────────┘
```

### 帳號合併確認對話框

```
┌─────────────────────────────┐
│  發現重複帳號                │
│                             │
│  您嘗試連接的 Google 帳號    │
│  已經對應到另一個帳號        │
│                             │
│  現有帳號：                 │
│  • 記帳記錄：45 筆          │
│  • 財務目標：2 個           │
│                             │
│  另一個帳號：               │
│  • 記帳記錄：12 筆          │
│  • 財務目標：1 個           │
│                             │
│  請選擇：                   │
│  ○ 合併到現有帳號           │
│  ○ 合併到另一個帳號         │
│  ○ 取消（保持兩個帳號）     │
│                             │
│  [確認] [取消]              │
└─────────────────────────────┘
```

## 實作建議

### 技術選項

1. **使用 NextAuth.js (Auth.js)**
   - 支援多種 OAuth 提供者
   - 內建 session 管理
   - 易於擴展

2. **使用 Supabase Auth**
   - 完整的認證解決方案
   - 支援多種登入方式
   - 內建用戶管理

3. **自建認證系統**
   - 完全控制流程
   - 需要自行處理安全性

**建議使用 NextAuth.js**，因為：
- 與 Next.js 整合良好
- 社群支援豐富
- 文件完整

### 實作步驟

#### 階段 1：基礎多登入（MVP）
1. 實作 Email/Password 登入
2. 實作 LINE 登入
3. 基本的帳號管理

#### 階段 2：擴展登入方式
1. 加入 Google OAuth
2. 加入 GitHub OAuth
3. 優化登入流程

#### 階段 3：帳號關聯功能
1. 實作「連接登入方式」功能
2. 實作「移除登入方式」功能
3. 實作帳號合併邏輯

#### 階段 4：進階功能
1. 帳號安全設定（雙因素認證等）
2. 登入歷史記錄
3. 異常登入提醒

### API 設計建議

```typescript
// 連接新的登入方式
POST /api/auth/link
Body: {
  provider: 'line' | 'google' | 'github',
  providerToken: string
}

// 移除登入方式
DELETE /api/auth/unlink/:provider

// 取得已連接的登入方式
GET /api/auth/providers

// 合併帳號
POST /api/auth/merge
Body: {
  targetUserId: string,
  sourceUserId: string
}
```

## 安全性考量

1. **Email 驗證**
   - 連接新登入方式時，如果 email 不同，需要驗證
   - 避免未授權的帳號關聯

2. **防止帳號劫持**
   - 合併帳號前需要額外驗證（如密碼確認）
   - 記錄所有帳號變更操作

3. **Session 管理**
   - 連接新登入方式後，更新現有 session
   - 移除登入方式時，如果是最後一個，需要重新登入

4. **資料隱私**
   - 明確告知用戶資料會如何合併
   - 提供資料匯出功能

## 我的建議

### 優先順序

1. **階段 1（MVP）**：Email/Password + LINE
   - 滿足基本需求
   - 可以快速上線

2. **階段 2**：加入 Google OAuth
   - 提升網頁版用戶體驗
   - 實作相對簡單

3. **階段 3**：加入 GitHub OAuth
   - 滿足開發者用戶需求
   - 實作方式與 Google 類似

4. **階段 4**：帳號關聯功能
   - 解決多登入方式的痛點
   - 需要較多測試

### 實作建議

- **先做 MVP**：不要一開始就實作所有功能，先確保核心功能穩定
- **逐步擴展**：每個階段都先測試再進入下一階段
- **用戶體驗優先**：確保流程順暢，避免複雜的操作
- **資料安全**：所有帳號操作都要有適當的驗證和記錄

## 參考資源

- [NextAuth.js 文件](https://next-auth.js.org/)
- [LINE Login API](https://developers.line.biz/en/docs/line-login/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)


# 智選理財家（Smart Finance Planner）

LLM 驅動的全端智能記帳與財務規劃服務

## 專題概述

結合 Web 全端服務、LINE Chatbot、LLM 語義理解與財務規劃能力，打造一個「能記帳、也能替你理財」的完整服務。

詳細規格請參考 [SmartFinanceProposal.md](./SmartFinanceProposal.md)

## 技術棧

- **前端**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **後端**: Next.js API Routes + MongoDB
- **LINE Bot**: LINE Messaging API + LIFF
- **LLM**: OpenAI API (Function Calling)
- **圖片**: Cloudinary
- **部署**: Vercel

## 開發環境設置

### 安裝依賴

```bash
npm install
```

### 運行開發服務器

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000) 查看應用。

### 構建生產版本

```bash
npm run build
npm start
```

## 功能特性

### 已實現

- ✅ 用戶註冊/登入（NextAuth.js Session 管理）
- ✅ 記帳管理（收入/支出，CRUD）
- ✅ Dashboard 數據可視化
- ✅ 財務目標管理
- ✅ LINE Bot 記帳（自然語言理解，LLM Function Calling）
- ✅ 統一資料庫（MongoDB）
- ✅ 網頁版與 LINE Bot 資料同步
- ✅ LINE ↔ Web 使用者對應
- ✅ Session 管理（NextAuth.js）

### 開發中

- ⏳ MongoDB 數據庫集成
- ⏳ LLM API 集成（OpenAI）
- ⏳ 收據 OCR 識別
- ⏳ Session 管理（取代 query parameter）

## 項目結構

```
smart-finance-planner/
├── app/
│   ├── (auth)/            # 認證頁面
│   ├── api/               # API Routes
│   │   ├── line/         # LINE Bot webhook
│   │   └── records/      # 記帳 API
│   ├── dashboard/         # 儀表板
│   ├── records/           # 記帳管理
│   └── goals/             # 財務目標
├── lib/
│   ├── accountDb.ts       # 統一記帳 API
│   ├── expenseAgent.ts    # LINE Bot LLM 邏輯
│   ├── expenseDb.ts       # LINE Bot 向後相容層
│   ├── userMapping.ts     # 使用者對應
│   ├── apiClient.ts       # 前端 API Client
│   └── mongodb.ts         # MongoDB 連線
└── types/                 # TypeScript 類型
```

## 環境變數

詳細設定請參考 `VERCEL_ENV.example.txt`。

## 使用說明

1. **註冊帳號**: 訪問 `/register` 創建新帳號
2. **登入**: 使用註冊的帳號登入
3. **記帳**: 在「記帳」頁面添加您的支出記錄
4. **設定目標**: 在「目標」頁面設定財務目標
5. **查看分析**: 在「儀表板」查看收支趨勢和類別分析
6. **生成規劃**: 在「財務規劃」頁面生成個人化建議

## 開發狀態

✅ 核心功能已完成（記帳、LINE Bot、資料同步、Session 管理、使用者對應）  
⏳ 持續優化中（收據 OCR）

# 智選理財家（Smart Finance Planner）

LLM 驅動的全端智能記帳與財務規劃服務

## 專題概述

結合 Web 全端服務、LINE Chatbot、LLM 語義理解與財務規劃能力，打造一個「能記帳、也能替你理財」的完整服務。

詳細規格請參考 [SmartFinanceProposal.md](./SmartFinanceProposal.md)

## 技術棧

- **前端框架**: Next.js 14+ (App Router) + TypeScript
- **樣式**: Tailwind CSS
- **表單管理**: React Hook Form + Zod
- **數據可視化**: Recharts
- **圖標**: Lucide React
- **數據存儲**: localStorage (目前使用，未來將遷移至 MongoDB)

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

### 已實現功能

- ✅ 用戶註冊/登入（使用 localStorage 模擬）
- ✅ 記帳管理（新增、編輯、刪除記錄）
- ✅ 財務目標管理
- ✅ Dashboard 數據可視化（收支趨勢、類別比例）
- ✅ 財務規劃頁面（使用 mock 數據）

### 待實現功能

- ⏳ MongoDB 數據庫集成
- ⏳ Cloudinary 圖片上傳
- ⏳ LLM API 集成（OpenAI）
- ⏳ LINE Chatbot 集成
- ⏳ 自然語言記帳解析
- ⏳ 收據 OCR 識別

## 項目結構

```
smart-finance-planner/
├── app/                    # Next.js App Router 頁面
│   ├── (auth)/            # 認證頁面組
│   ├── dashboard/         # 儀表板
│   ├── records/           # 記帳管理
│   ├── goals/             # 財務目標
│   └── planning/          # 財務規劃
├── components/             # React 組件
│   ├── ui/                # 基礎 UI 組件
│   ├── charts/            # 圖表組件
│   └── layout/            # 布局組件
├── lib/                   # 工具函數
│   ├── storage.ts         # localStorage 封裝
│   ├── mockData.ts        # Mock 數據生成
│   └── utils.ts           # 工具函數
└── types/                 # TypeScript 類型定義
```

## 使用說明

1. **註冊帳號**: 訪問 `/register` 創建新帳號
2. **登入**: 使用註冊的帳號登入
3. **記帳**: 在「記帳」頁面添加您的支出記錄
4. **設定目標**: 在「目標」頁面設定財務目標
5. **查看分析**: 在「儀表板」查看收支趨勢和類別分析
6. **生成規劃**: 在「財務規劃」頁面生成個人化建議

## 開發狀態

目前項目處於前端開發階段，所有功能使用 localStorage 和 mock 數據。後續將逐步集成外部 API 和服務。

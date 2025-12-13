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

## 快速開始

### Web 應用

訪問部署網站，註冊帳號後即可開始使用。

### LINE Bot

搜尋 LINE ID `@129sanuz`，加入好友後即可開始記帳。

## 功能特性

### 已實現

- ✅ 用戶註冊/登入
- ✅ 記帳管理（收入/支出）
- ✅ Dashboard 數據可視化
- ✅ 財務目標管理
- ✅ LINE Bot 記帳（自然語言理解）
- ✅ 網頁版與 LINE Bot 資料同步
- ✅ 對話記憶（記帳上下文理解）

### 開發中

- ⏳ 收據 OCR 識別


## 使用說明

### Web 應用

1. **註冊帳號**: 創建新帳號
2. **記帳**: 添加收入/支出記錄
3. **設定目標**: 設定財務目標
4. **查看分析**: Dashboard 查看收支趨勢和類別分析

### LINE Bot

1. **加入好友**: 搜尋 LINE ID `@129sanuz`
2. **自然語言記帳**: 直接說「晚餐150元」、「午餐200元，飲食」等
3. **查詢記錄**: 詢問「今天花了多少」、「最近幾筆」等
4. **資料同步**: 與 Web 應用資料自動同步

## 開發狀態

✅ 核心功能已完成  
⏳ 持續優化中（收據 OCR）

---

開發者請參考 [DEV.md](./DEV.md)

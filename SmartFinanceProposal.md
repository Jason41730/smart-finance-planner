# 智選理財家（Smart Finance Planner）
## 網路與多媒體實驗 — 期末專題 Proposal（完整版）

### 一、主題名稱
**智選理財家：LLM 驅動的全端智能記帳與財務規劃服務**

### 二、主題背景
隨著數位支付普及，傳統記帳工具多半僅提供收支紀錄與圖表顯示，缺乏主動的財務建議功能。多數使用者雖然有記帳習慣，但難以依據數據制定行動計畫，尤其在面對「購買高價品」或「達成儲蓄目標」等情境時更為明顯。  
此外，記帳流程仍存在痛點：紀錄門檻高、語義理解弱、收據辨識不足。最核心的問題是缺乏可執行且量化的財務建議。

本專題結合 **Web 全端服務、LINE Chatbot、LLM 語義理解與財務規劃能力**，打造一個「能記帳、也能替你理財」的完整服務。  
與現有服務最大差異在於：  
LLM 可根據使用者個人消費習慣生成具體建議，例如：  
> 「若每週少喝兩次飲料，可提前 43 天買到想要的電腦。」

---

### 三、現有問題分析
1. **記帳不便**：傳統 App 需要手動打開、輸入、選類別，降低即時紀錄意願。  
2. **輸入智能不足**：缺乏語義理解、無法從自由文字或收據影像中自動分類。  
3. **缺乏財務規劃**：多數服務只能顯示「你花了多少」，不能提供「你應該做什麼」。  
4. **無法做生活化情境模擬**：像是「少喝手搖飲」對達成目標的實際影響難以量化。

---

### 四、方法與系統架構概述

本系統採用 **前後端整合 + LLM + LINE Chatbot** 架構。

#### 1. 前端（Next.js + Tailwind）
- 提供登入 / 註冊
- Dashboard：收支趨勢、類別比例、最新紀錄
- 財務目標管理
- LLM 財務規劃報告頁面顯示

#### 2. 後端（Next.js API Routes）
- 使用者管理  
- 記帳 CRUD  
- 目標管理  
- 串接 LLM 進行分類 / 規劃  
- Cloudinary 圖片上傳  
- 預留 LINE Webhook 處理  

#### 3. 資料庫（MongoDB）
主要 collections：  
- User  
- AccountRecord  
- FinancialGoal  
- LLMPlan  

#### 4. LINE Chatbot
- 隨傳即記：輸入文字如「午餐 150 咖哩飯」
- 上傳收據 → Cloudinary → OCR → LLM 分類  
- 即時推播 LLM 建議（未來）

#### 5. LLM 核心功能
- 自然語言記帳解析  
- 收據內容語義分類  
- 消費習慣模式分析  
- 財務目標情境模擬與個人化建議  

---

### 五、資料模型（Schema 摘要）

#### User
- name, email, passwordHash  
- lineUserId（選用）  

#### AccountRecord
- userId, amount, category  
- description, source（web/line/ocr）  
- imageUrl（Cloudinary）  
- date  

#### FinancialGoal
- goalName, targetAmount  
- currentSavedAmount, targetDate  

#### LLMPlan
- planSummary, planDetail  
- assumptions（LLM 分析參數）  

---

### 六、系統功能整理

#### (A) 記帳系統
- Web 表單記帳  
- LINE 文字記帳  
- 收據辨識記帳  
- 自動分類（LLM）  

#### (B) 財務分析
- 類別比例  
- 收支折線趨勢  
- 目標進度條  

#### (C) 財務規劃（LLM 核心）
- 行為消費分析：如每週外食/手搖飲頻率  
- 達成目標所需時間預估  
- 行為調整模擬：  
  > 若減少 X 行為，可提前 Y 天達成目標  

#### (D) 通知與即時化（選用）
- LINE 推播  
- Pusher 即時刷新 Dashboard（未來）

---

### 七、API 規格摘要

#### /api/auth
- register / login

#### /api/records
- GET / POST / PATCH / DELETE  

#### /api/goals
- GET / POST / PATCH / DELETE  

#### /api/upload
- 上傳圖片至 Cloudinary  

#### /api/llm/plan
- 生成財務規劃建議  

#### /api/line/webhook（預留）

---

### 八、環境變數
- MONGODB_URI  
- CLOUDINARY_CLOUD_NAME  
- CLOUDINARY_API_KEY  
- CLOUDINARY_API_SECRET  
- LLM_API_KEY  
- LINE_CHANNEL_ACCESS_TOKEN（未來）  
- PUSHER_KEY（選用）  

---

### 九、預計效益

1. **降低記帳門檻**  
   LINE 即時記帳大幅提升紀錄意願。

2. **智慧分類與自動化**  
   LLM 可理解自然語言與收據內容。

3. **個人化且具體的財務建議**  
   使用者能看到「可執行」的調整方向。  

4. **完整 Web + Chatbot 整合服務**  
   適用於多種使用情境，提升黏著度。

5. **展示 LLM 在生活財務領域的創新應用**

---

以上為本專題的完整 proposal 與系統規格描述。

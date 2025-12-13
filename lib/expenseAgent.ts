import OpenAI from 'openai';
import {
  addExpense,
  queryTotal,
  listRecentExpenses,
  listAllExpenses,
  clearExpenses,
} from './expenseDb';
import {
  getConversationHistory,
  saveConversationMessage,
} from './conversationDb';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('請設定環境變數 OPENAI_API_KEY');
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🎯 優化 1: 改進工具描述（加入使用範例）
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'add_expense',
      description: `新增一筆消費紀錄。

使用時機：
- 使用者提供金額和消費項目，且已確認資訊正確時
- 使用者說「正確」、「對」、「好」、「確認」且之前提到金額時

範例：
- 使用者：「晚餐便當150元」→ 你：「請問是今天的晚餐嗎？類別是飲食對吧？」→ 使用者：「對」→ 呼叫此工具
- 使用者：「午餐200元，飲食」→ 直接呼叫此工具（資訊完整）`,
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: '使用者 ID（會自動填入）' },
          amount: { type: 'number', description: '金額，必須 > 0' },
          category: {
            type: ['string', 'null'],
            description: '類別：飲食、交通、購物、娛樂、醫療、教育、其他。如果無法判斷可為 null',
          },
          note: {
            type: 'string',
            default: '',
            description: '備註或描述，例如「咖哩飯」、「便當」等',
          },
          ts: {
            type: ['string', 'null'],
            description: 'ISO 時間字串（YYYY-MM-DDTHH:MM），可省略（預設為現在）',
          },
        },
        required: ['user_id', 'amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_total',
      description: `查詢指定日期區間的總消費金額。

使用時機：
- 使用者問「今天花了多少」、「這個月總共」、「昨天花了多少」時

範例：
- 使用者：「今天花了多少」→ 呼叫此工具（start_date 和 end_date 都設為今天）
- 使用者：「這個月總共」→ 呼叫此工具（start_date = 本月第一天，end_date = 今天）`,
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: '使用者 ID（會自動填入）' },
          start_date: { type: 'string', description: '開始日期，格式：YYYY-MM-DD' },
          end_date: { type: 'string', description: '結束日期，格式：YYYY-MM-DD' },
        },
        required: ['user_id', 'start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_recent_expenses',
      description: `列出最近幾筆消費紀錄（由新到舊）。

使用時機：
- 使用者問「最近幾筆」、「列出紀錄」、「最近花了什麼」時

範例：
- 使用者：「最近幾筆」→ 呼叫此工具（limit = 5）
- 使用者：「列出最近10筆」→ 呼叫此工具（limit = 10）`,
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: '使用者 ID（會自動填入）' },
          limit: { type: 'integer', default: 5, description: '要列出的筆數，範圍 1-20，預設 5' },
        },
        required: ['user_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_all_expenses',
      description: `列出所有消費紀錄（由舊到新）。

使用時機：
- 使用者要求「所有紀錄」、「全部列出」、「歷史紀錄」時

注意：此工具會返回所有紀錄，如果紀錄很多可能會很長，建議先用 list_recent_expenses。`,
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: '使用者 ID（會自動填入）' },
        },
        required: ['user_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_expenses',
      description: `清空指定使用者的所有消費紀錄。

使用時機：
- 使用者明確要求「清空」、「刪除所有」、「重置」時

注意：此操作不可逆，請確認使用者真的想要清空所有紀錄。`,
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: '使用者 ID（會自動填入）' },
        },
        required: ['user_id'],
      },
    },
  },
];

// 🎯 優化 2: 改進錯誤處理
async function callTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case 'add_expense':
        // 驗證金額
        if (!args.amount || args.amount <= 0) {
          return { ok: false, error: 'invalid_amount', message: '金額必須大於 0' };
        }
        return await addExpense(
          args.user_id,
          args.amount,
          args.category ?? null,
          args.note ?? '',
          args.ts
        );
      case 'query_total':
        // 驗證日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(args.start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(args.end_date)) {
          return { ok: false, error: 'invalid_date', message: '日期格式必須為 YYYY-MM-DD' };
        }
        return await queryTotal(args.user_id, args.start_date, args.end_date);
      case 'list_recent_expenses':
        // 驗證 limit
        const limit = args.limit ?? 5;
        if (limit < 1 || limit > 20) {
          return { ok: false, error: 'invalid_limit', message: 'limit 必須在 1-20 之間' };
        }
        return await listRecentExpenses(args.user_id, limit);
      case 'list_all_expenses':
        return await listAllExpenses(args.user_id);
      case 'clear_expenses':
        return await clearExpenses(args.user_id);
      default:
        return { ok: false, error: 'unknown_tool', message: `未知的工具：${name}` };
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return {
      ok: false,
      error: 'execution_error',
      message: error instanceof Error ? error.message : '工具執行時發生錯誤',
    };
  }
}

// 🎯 優化 3: 自我檢查機制（基於工具結果，不依賴關鍵字匹配）
async function validateReply(
  reply: string,
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
  toolResults: any[]
): Promise<{ isValid: boolean; improvedReply?: string }> {
  // ⚠️ 重要：不使用關鍵字匹配來判斷意圖，只根據工具執行結果來驗證回覆
  
  // 檢查 1: 如果執行了記帳，確保回覆包含實際資訊
  if (toolCalls.some(tc => tc.function.name === 'add_expense')) {
    const addExpenseCall = toolCalls.find(tc => tc.function.name === 'add_expense');
    if (addExpenseCall) {
      try {
        const args = JSON.parse(addExpenseCall.function.arguments);
        // 檢查回覆是否過於簡短或模糊（不依賴關鍵字）
        // 如果回覆太短（少於 10 字）且沒有包含金額，則補充資訊
        if (reply.length < 10 && !reply.includes(String(args.amount))) {
          return {
            isValid: false,
            improvedReply: `✅ 已成功記錄：${args.amount} 元${args.category ? `（${args.category}）` : ''}${args.note ? ` - ${args.note}` : ''}`,
          };
        }
      } catch {
        // 解析失敗，繼續使用原回覆
      }
    }
  }
  
  // 檢查 2: 如果查詢了總額，確保回覆包含實際數字
  if (toolCalls.some(tc => tc.function.name === 'query_total')) {
    if (toolResults.length > 0) {
      try {
        const result = JSON.parse(toolResults[0].content);
        if (result.total !== undefined) {
          // 檢查回覆是否包含總額數字（不依賴關鍵字，只檢查是否有數字）
          const hasAmount = reply.includes(String(result.total));
          if (!hasAmount) {
            return {
              isValid: false,
              improvedReply: `總共花了 ${result.total} 元。${reply}`,
            };
          }
        }
      } catch {
        // 解析失敗，繼續使用原回覆
      }
    }
  }
  
  // 檢查 3: 回覆長度檢查（避免過於簡短或空回覆）
  if (reply.trim().length < 3) {
    return {
      isValid: false,
      improvedReply: '處理完成！',
    };
  }
  
  return { isValid: true };
}

/**
 * 記帳助理對話函式
 * @param userText 使用者輸入文字
 * @param userId 使用者 ID（LINE user_id 或 web user_id）
 * @returns 回覆文字
 */
export async function chat(
  userText: string,
  userId: string = 'u1'
): Promise<string> {
  // 🎯 優化 4: 載入對話歷史（對話記憶）
  const conversationHistory = await getConversationHistory(userId, 10);
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // 🎯 優化 5: Few-Shot Learning（加入對話範例）
  const systemPrompt = `你是一個記帳助理，語氣親切、回答簡潔。

## 核心原則
1. **這位使用者的 user_id 是「${userId}」**，所有工具呼叫都必須使用這個 user_id。
2. **先理解需求，再決定行動**：分析使用者的意圖，判斷需要什麼資訊，然後決定是否呼叫工具。
3. **資訊不足時先詢問**：如果缺少必要資訊（日期、金額、類別），先詢問使用者，不要猜測。
4. **確認後立即執行**：當使用者確認資訊正確（說「正確」、「對」、「好」、「確認」），立即呼叫 add_expense 工具執行記帳。

## 判斷標準（⚠️ 重要：完全依賴語意理解，不使用關鍵字匹配）
- **記帳需求**：理解使用者的意圖是想要記錄消費，即使沒有明確提到「記帳」等關鍵字
  - 例如：「午餐150元」→ 理解為記帳需求
  - 例如：「今天買了便當200元」→ 理解為記帳需求
  - 不要因為使用者說「我今天心情很好，午餐150元」就誤判為閒聊
- **查詢需求**：理解使用者想要查詢資訊的意圖，即使沒有疑問詞
  - 例如：「今天花了多少」→ 查詢需求
  - 例如：「最近幾筆」→ 查詢需求
  - 不要因為使用者說「我想知道今天花了多少」就誤判為閒聊
- **閒聊**：理解使用者只是打招呼或閒聊，沒有實際需求
  - 例如：「你好」、「謝謝」→ 閒聊
  - 不要因為使用者說「我今天花了150元，心情很好」就誤判為閒聊（這是記帳需求）

## 工具使用規範
- 日期格式：YYYY-MM-DD（「今天」= ${today}，「昨天」= ${yesterday}）
- 金額必須 > 0
- limit 範圍：1-20
- 一次對話最多 1-2 個工具

## 回覆要求
- 執行工具後，必須明確告知結果（例如：「✅ 已成功記錄晚餐 150 元」）
- 不要只是問「有什麼可以幫忙的」，要主動告知處理結果
- 語氣親切但簡潔，避免冗長
- ⚠️ **重要**：完全依賴語意理解，不要用關鍵字匹配來判斷意圖
  - 使用者可能無意間提到關鍵字，但實際意圖不同
  - 必須理解完整的語意和上下文，而不是只看單一詞彙

## 對話範例

**範例 1：記帳流程（資訊不完整）**
使用者：「晚餐便當150元」
助理：「請問是今天的晚餐嗎？類別是飲食對吧？」
使用者：「對」
助理：「✅ 已成功記錄：2025-12-13 晚餐 150元（便當，飲食）」

**範例 2：記帳流程（資訊完整）**
使用者：「午餐200元，飲食，咖哩飯」
助理：「✅ 已成功記錄：2025-12-13 午餐 200元（咖哩飯，飲食）」

**範例 3：查詢總額**
使用者：「今天花了多少」
助理：「今天（${today}）總共花了 350 元」

**範例 4：列出最近紀錄**
使用者：「最近幾筆」
助理：「以下是您最近 5 筆消費：
1. 2025-12-13 晚餐 150元（便當，飲食）
2. 2025-12-13 午餐 120元（咖哩飯，飲食）
3. 2025-12-13 早餐 80元（三明治，飲食）
4. 2025-12-12 晚餐 200元（火鍋，飲食）
5. 2025-12-12 交通 50元（捷運，交通）」

**範例 5：閒聊**
使用者：「你好」
助理：「你好！我是記帳助理，可以幫你記錄消費或查詢紀錄。有什麼需要幫忙的嗎？」`;

  // 建立訊息陣列（包含歷史對話）
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory, // 🎯 加入對話歷史
    { role: 'user', content: userText },
  ];

  try {
    // 第一次呼叫：讓模型決定是否呼叫工具
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7, // 稍微提高創造性，但保持一致性
    });

    const message = response.choices[0].message;

    // 如果沒有工具呼叫，直接回覆
    if (!message.tool_calls || message.tool_calls.length === 0) {
      const reply = message.content || '抱歉，我無法理解您的需求。';
      
      // 儲存對話歷史
      await saveConversationMessage(userId, 'user', userText);
      await saveConversationMessage(userId, 'assistant', reply);
      
      return reply;
    }

    // 處理工具呼叫
    const toolCalls = message.tool_calls;
    const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      let args: any;

      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = toolCall.function.arguments;
      }

      // 安全：確保 user_id 被填入
      if (!args.user_id) {
        args.user_id = userId;
      }

      // 執行工具
      const result = await callTool(functionName, args);
      
      // 🎯 優化 6: 錯誤處理 - 檢查工具執行結果
      if (result.ok === false) {
        // 根據錯誤類型提供不同處理
        let errorMessage = '處理時發生錯誤。';
        
        switch (result.error) {
          case 'invalid_amount':
            errorMessage = '金額必須大於 0，請重新輸入。';
            break;
          case 'invalid_date':
            errorMessage = '日期格式不正確，請使用 YYYY-MM-DD 格式（例如：2025-12-13）。';
            break;
          case 'invalid_limit':
            errorMessage = '筆數必須在 1-20 之間，請重新輸入。';
            break;
          case 'execution_error':
            errorMessage = `執行時發生錯誤：${result.message || '未知錯誤'}`;
            break;
          default:
            errorMessage = result.message || '處理時發生錯誤，請稍後再試。';
        }
        
        // 儲存對話歷史（包含錯誤）
        await saveConversationMessage(userId, 'user', userText);
        await saveConversationMessage(userId, 'assistant', errorMessage);
        
        return errorMessage;
      }

      toolResults.push({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content: JSON.stringify(result, null, 2),
      });
    }

    // 第二次呼叫：生成最終回覆
    const followResponse = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        ...messages,
        message,
        ...toolResults,
      ],
      temperature: 0.7,
    });

    let finalReply = followResponse.choices[0].message.content || '處理完成。';
    
    // 🎯 優化 7: 自我檢查機制
    const validation = await validateReply(finalReply, toolCalls, toolResults);
    if (!validation.isValid && validation.improvedReply) {
      finalReply = validation.improvedReply;
    }
    
    // 儲存對話歷史
    await saveConversationMessage(userId, 'user', userText);
    await saveConversationMessage(userId, 'assistant', finalReply);
    
    return finalReply;
  } catch (error) {
    console.error('Expense agent error:', error);
    
    // 🎯 優化 8: 錯誤處理 - 根據錯誤類型提供不同訊息
    let errorMessage = '記帳系統目前有點問題，晚點再試試看 QQ';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API 金鑰設定有誤，請檢查環境變數。';
      } else if (error.message.includes('rate limit')) {
        errorMessage = '請求太頻繁了，請稍後再試。';
      } else if (error.message.includes('timeout')) {
        errorMessage = '請求超時，請稍後再試。';
      }
    }
    
    // 儲存錯誤對話（如果可能）
    try {
      await saveConversationMessage(userId, 'user', userText);
      await saveConversationMessage(userId, 'assistant', errorMessage);
    } catch {
      // 如果儲存失敗，忽略（避免無限迴圈）
    }
    
    return errorMessage;
  }
}

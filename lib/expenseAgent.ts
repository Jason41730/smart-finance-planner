import OpenAI from 'openai';
import {
  addExpense,
  queryTotal,
  listRecentExpenses,
  listAllExpenses,
  clearExpenses,
} from './expenseDb';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('請設定環境變數 OPENAI_API_KEY');
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 工具定義（對應 OpenAI Function Calling）
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'add_expense',
      description: '新增一筆消費紀錄',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          amount: { type: 'number' },
          category: { type: ['string', 'null'] },
          note: { type: 'string', default: '' },
          ts: {
            type: ['string', 'null'],
            description: 'ISO 時間，可省略',
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
      description: '查詢日期區間總額',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          start_date: { type: 'string' },
          end_date: { type: 'string' },
        },
        required: ['user_id', 'start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_recent_expenses',
      description: '列出最近幾筆消費（新→舊）',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          limit: { type: 'integer', default: 5 },
        },
        required: ['user_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_all_expenses',
      description: '列出所有紀錄（舊→新）',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
        },
        required: ['user_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_expenses',
      description: '清空指定使用者的所有紀錄',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
        },
        required: ['user_id'],
      },
    },
  },
];

// 工具呼叫映射
async function callTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'add_expense':
      return await addExpense(
        args.user_id,
        args.amount,
        args.category ?? null,
        args.note ?? '',
        args.ts
      );
    case 'query_total':
      return await queryTotal(args.user_id, args.start_date, args.end_date);
    case 'list_recent_expenses':
      return await listRecentExpenses(args.user_id, args.limit ?? 5);
    case 'list_all_expenses':
      return await listAllExpenses(args.user_id);
    case 'clear_expenses':
      return await clearExpenses(args.user_id);
    default:
      return { ok: false, error: `unknown tool ${name}` };
  }
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
  // 強化版 system prompt：要求模型先理解需求再決定工具
  const systemPrompt = `你是一個記帳助理，語氣親切、回答簡潔。

重要規則：
1. 這位使用者的 user_id 是「${userId}」，所有工具呼叫都必須使用這個 user_id。
2. 先理解使用者的需求，再決定是否呼叫工具。若資訊不足（如缺少日期、金額），先詢問使用者。
3. 只呼叫必要的工具，一次對話最多 1-2 個工具。
4. 工具參數必須完整且合法：
   - 日期格式：YYYY-MM-DD
   - 金額必須 > 0
   - limit 範圍：1-20
5. 若只是閒聊或無需存取資料，直接回覆文字，不呼叫工具。
6. 執行工具後，用友善的方式呈現結果給使用者。`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText },
  ];

  try {
    // 第一次呼叫：讓模型決定是否呼叫工具
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // 可改為 gpt-4o 或 gpt-4-turbo
      messages,
      tools,
      tool_choice: 'auto',
    });

    const message = response.choices[0].message;

    // 如果沒有工具呼叫，直接回覆
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || '抱歉，我無法理解您的需求。';
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
    });

    return followResponse.choices[0].message.content || '處理完成。';
  } catch (error) {
    console.error('Expense agent error:', error);
    return '記帳系統目前有點問題，晚點再試試看 QQ';
  }
}


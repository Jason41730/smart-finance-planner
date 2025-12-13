import { getDb, COLLECTIONS } from './mongodb';
import { ObjectId } from 'mongodb';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationHistory {
  _id?: ObjectId;
  userId: string;
  messages: ConversationMessage[];
  lastUpdated: Date;
  createdAt: Date;
}

const MAX_MESSAGES_PER_CONVERSATION = 20; // 最多保留 20 輪對話
const MAX_CONVERSATION_AGE_DAYS = 7; // 最多保留 7 天的對話

/**
 * 儲存對話訊息
 */
export async function saveConversationMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  try {
    const db = await getDb();
    const collection = db.collection<ConversationHistory>(COLLECTIONS.CONVERSATIONS);

    const now = new Date();
    
    // 取得或建立對話歷史
    const conversation = await collection.findOne({ userId });
    
    if (conversation) {
      // 更新現有對話
      const newMessage: ConversationMessage = {
        role,
        content,
        timestamp: now,
      };
      
      // 只保留最近 N 輪對話
      const updatedMessages = [...conversation.messages, newMessage]
        .slice(-MAX_MESSAGES_PER_CONVERSATION);
      
      await collection.updateOne(
        { userId },
        {
          $set: {
            messages: updatedMessages,
            lastUpdated: now,
          },
        }
      );
    } else {
      // 建立新對話
      const newConversation: ConversationHistory = {
        userId,
        messages: [
          {
            role,
            content,
            timestamp: now,
          },
        ],
        lastUpdated: now,
        createdAt: now,
      };
      
      await collection.insertOne(newConversation);
    }
    
    // 清理舊對話（非同步，不阻塞）
    cleanupOldConversations().catch(console.error);
  } catch (error) {
    // 如果 MongoDB 連線失敗，記錄錯誤但不中斷流程
    console.error('Failed to save conversation message:', error);
    // 不 throw，讓記帳功能可以繼續運作
  }
}

/**
 * 取得對話歷史（轉換為 OpenAI 格式）
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const db = await getDb();
    const collection = db.collection<ConversationHistory>(COLLECTIONS.CONVERSATIONS);

    const conversation = await collection.findOne({ userId });
    
    if (!conversation || conversation.messages.length === 0) {
      return [];
    }
    
    // 只取最近 N 輪對話
    const recentMessages = conversation.messages.slice(-limit);
    
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    // 如果 MongoDB 連線失敗，返回空陣列，讓記帳功能可以繼續運作
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

/**
 * 清除使用者的對話歷史
 */
export async function clearConversationHistory(userId: string): Promise<void> {
  const db = await getDb();
  const collection = db.collection<ConversationHistory>(COLLECTIONS.CONVERSATIONS);
  
  await collection.deleteOne({ userId });
}

/**
 * 清理舊對話（超過 7 天的）
 */
async function cleanupOldConversations(): Promise<void> {
  const db = await getDb();
  const collection = db.collection<ConversationHistory>(COLLECTIONS.CONVERSATIONS);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_CONVERSATION_AGE_DAYS);
  
  await collection.deleteMany({
    lastUpdated: { $lt: cutoffDate },
  });
}


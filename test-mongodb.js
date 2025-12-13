// 快速測試 MongoDB 連線
const { MongoClient } = require('mongodb');

// 從環境變數或直接指定
const uri = process.env.MONGODB_URI || 'mongodb+srv://henrysun0605_db_user:你的密碼@cluster0.cshvcyj.mongodb.net/smart-finance?retryWrites=true&w=majority';

async function testConnection() {
  console.log('🔌 正在測試 MongoDB 連線...');
  console.log('📍 URI:', uri.replace(/:[^:@]+@/, ':****@')); // 隱藏密碼
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB 連線成功！');
    
    const db = client.db('smart-finance');
    const collections = await db.listCollections().toArray();
    console.log('📦 資料庫 collections:', collections.map(c => c.name).join(', ') || '(無)');
    
    // 測試讀取
    const users = await db.collection('users').countDocuments();
    console.log(`👥 users collection 筆數: ${users}`);
    
  } catch (error) {
    console.error('❌ MongoDB 連線失敗：');
    console.error('   錯誤訊息:', error.message);
    if (error.message.includes('bad auth')) {
      console.error('   💡 提示：請檢查帳號密碼是否正確');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 連線已關閉');
  }
}

testConnection();


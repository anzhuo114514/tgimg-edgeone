import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const checks = {
      BOT_TOKEN_SET: !!BOT_TOKEN,
      CHANNEL_ID_SET: !!CHANNEL_ID,
      BOT_TOKEN_LENGTH: BOT_TOKEN ? BOT_TOKEN.length : 0,
      CHANNEL_ID_VALUE: CHANNEL_ID || '未设置',
    };

    if (!BOT_TOKEN || !CHANNEL_ID) {
      return res.status(400).json({ 
        error: '缺少环境变量',
        checks,
        help: '请在 .env 文件中设置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHANNEL_ID'
      });
    }

    // 测试 Bot Token 是否有效
    const meResp = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    checks.BOT_VALID = meResp.data.ok;
    checks.BOT_NAME = meResp.data.result ? meResp.data.result.username : 'unknown';

    if (!meResp.data.ok) {
      return res.status(400).json({
        error: 'Bot Token 无效',
        checks,
        help: '请检查 TELEGRAM_BOT_TOKEN 是否正确'
      });
    }

    // 尝试向频道发送测试消息
    console.log(`[Test API] Testing channel: ${CHANNEL_ID}`);
    
    const testResp = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHANNEL_ID,
        text: '🧪 这是来自图床的测试消息',
      },
      { timeout: 10000 }
    );

    checks.CHANNEL_VALID = testResp.data.ok;
    checks.MESSAGE_ID = testResp.data.result ? testResp.data.result.message_id : null;

    if (testResp.data.ok) {
      // 删除测试消息
      try {
        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`,
          {
            chat_id: CHANNEL_ID,
            message_id: testResp.data.result.message_id,
          }
        );
      } catch (e) {
        // 忽略删除失败
      }

      return res.status(200).json({
        ok: true,
        message: '所有配置正确！',
        checks,
      });
    } else {
      return res.status(400).json({
        error: '频道配置错误',
        checks,
        details: testResp.data.description,
        help: `
频道 ID 应为以下格式之一：
1. 数字 ID (例如 -1001234567890，必须以 -100 开头)
2. 频道用户名 (例如 @my_channel)

当前设置: ${CHANNEL_ID}

获取频道数字 ID 的方法:
1. 使用 @userinfobot 查询频道信息
2. 或发送一条消息到频道，然后:
   curl "https://api.telegram.org/botYOUR_TOKEN/getUpdates"
   在返回的 JSON 中找 chat.id
        `
      });
    }
  } catch (error) {
    console.error('[Test API] Error:', error.message);
    const errorMsg = error.response?.data?.description || error.message;
    
    return res.status(500).json({
      error: '测试失败',
      details: errorMsg,
      help: error.code === 'ETIMEDOUT' 
        ? '请求超时，请检查网络连接'
        : '请检查 Bot Token 和 Channel ID 配置'
    });
  }
}

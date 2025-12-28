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
    const meResp = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, { timeout: 10000 });
    checks.BOT_VALID = meResp.data.ok;
    checks.BOT_NAME = meResp.data.result ? meResp.data.result.username : 'unknown';

    if (!meResp.data.ok) {
      return res.status(400).json({
        error: 'Bot Token 无效',
        checks,
        details: meResp.data.description,
        help: '请检查 TELEGRAM_BOT_TOKEN 是否正确复制（包括冒号）'
      });
    }

    console.log(`[Test API] Bot valid: @${checks.BOT_NAME}, testing channel: ${CHANNEL_ID}`);
    
    // 检查 Channel ID 格式
    let channelIdInfo = {
      format: 'unknown',
      isNumeric: false,
      isUsername: false,
    };
    
    if (CHANNEL_ID.startsWith('@')) {
      channelIdInfo.isUsername = true;
      channelIdInfo.format = '频道用户名';
    } else if (/^-?\d+$/.test(CHANNEL_ID)) {
      channelIdInfo.isNumeric = true;
      channelIdInfo.format = '数字 ID';
      if (CHANNEL_ID.startsWith('-100')) {
        channelIdInfo.isValidFormat = true;
      } else {
        channelIdInfo.isValidFormat = false;
        channelIdInfo.warning = '数字 ID 应该以 -100 开头';
      }
    }
    
    checks.CHANNEL_ID_FORMAT = channelIdInfo.format;

    // 尝试向频道发送测试消息
    console.log(`[Test API] Attempting to send test message to ${CHANNEL_ID}`);
    
    const testResp = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHANNEL_ID,
        text: '🧪 来自图床的测试消息 - 如果你看到此消息，说明配置成功！',
      },
      { timeout: 10000 }
    );

    checks.CHANNEL_VALID = testResp.data.ok;
    
    if (testResp.data.result) {
      checks.MESSAGE_ID = testResp.data.result.message_id;
      
      // 尝试删除测试消息
      try {
        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`,
          {
            chat_id: CHANNEL_ID,
            message_id: testResp.data.result.message_id,
          },
          { timeout: 5000 }
        );
      } catch (e) {
        // 忽略删除失败
      }

      return res.status(200).json({
        ok: true,
        message: '✓ 所有配置正确！',
        checks,
      });
    } else {
      return res.status(400).json({
        error: '频道配置错误',
        checks,
        details: testResp.data.description,
        suggestions: generateSuggestions(testResp.data.description, CHANNEL_ID, channelIdInfo)
      });
    }
  } catch (error) {
    console.error('[Test API] Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });

    const checks = {
      BOT_TOKEN_SET: !!BOT_TOKEN,
      CHANNEL_ID_SET: !!CHANNEL_ID,
      CHANNEL_ID_VALUE: CHANNEL_ID || '未设置',
    };

    const errorMsg = error.response?.data?.description || error.message;
    const suggestions = generateSuggestions(errorMsg, CHANNEL_ID, null);
    
    return res.status(error.response?.status || 500).json({
      error: '测试失败',
      details: errorMsg,
      checks,
      suggestions,
      help: error.code === 'ETIMEDOUT' 
        ? '请求超时，请检查网络连接'
        : '详见下方的建议'
    });
  }
}

function generateSuggestions(errorMsg, channelId, channelIdInfo) {
  const suggestions = [];

  if (errorMsg?.includes('chat not found')) {
    suggestions.push({
      title: 'Channel ID 可能不存在或格式错误',
      steps: [
        '检查 TELEGRAM_CHANNEL_ID 是否正确',
        '如果使用数字 ID，确保格式为 -100xxxxx（以 -100 开头）',
        '如果使用用户名，确保格式为 @channel_name',
      ]
    });
    
    suggestions.push({
      title: '获取正确的 Channel ID 的方法',
      steps: [
        '1. 向你的频道发送一条消息',
        '2. 访问此链接获取最新更新（替换 YOUR_BOT_TOKEN）：',
        '   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates',
        '3. 在返回的 JSON 中找到 message.chat.id',
        '4. 复制完整的数字（可能是 -100 开头的负数）',
      ]
    });

    suggestions.push({
      title: '或使用频道用户名方式',
      steps: [
        '1. 确保频道有公开的用户名（设置 → 频道 → 用户名）',
        '2. 在环境变量中使用 @your_channel_name 格式',
      ]
    });
  } else if (errorMsg?.includes('bot was blocked')) {
    suggestions.push({
      title: 'Bot 被频道屏蔽',
      steps: [
        '1. 打开频道设置',
        '2. 进入"成员"或"管理员"部分',
        '3. 移除该 Bot 再重新添加',
        '4. 确保给予 Bot "发送消息" 权限',
      ]
    });
  } else if (errorMsg?.includes('Unauthorized')) {
    suggestions.push({
      title: 'Bot Token 无效',
      steps: [
        '1. 向 @BotFather 发送 /start',
        '2. 选择正确的机器人，发送 /token',
        '3. 复制完整的 token（包括冒号后的所有字符）',
      ]
    });
  } else if (errorMsg?.includes('Forbidden')) {
    suggestions.push({
      title: 'Bot 权限不足',
      steps: [
        '1. 打开频道设置 → 管理员',
        '2. 找到你的 Bot，确保有"发送消息"权限',
        '3. 如果没有，移除后重新添加',
      ]
    });
  } else if (!errorMsg) {
    suggestions.push({
      title: '网络连接问题',
      steps: [
        '1. 检查网络连接是否正常',
        '2. 检查是否可以访问 api.telegram.org',
        '3. 稍后重试',
      ]
    });
  }

  return suggestions;
}


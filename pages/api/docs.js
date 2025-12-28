/**
 * 此文件说明如何获取正确的 TELEGRAM_CHANNEL_ID
 * 
 * 方法 1：使用数字 ID（推荐用于私密频道）
 * ========================================
 * 1. 向你的 Telegram 频道发送一条消息
 * 2. 在开发者模式下，向机器人发送任何消息或命令
 * 3. 访问以下 URL（替换 YOUR_BOT_TOKEN）：
 *    https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
 * 
 * 4. 在返回的 JSON 中查找 message.chat.id，示例：
 *    {
 *      "ok": true,
 *      "result": [
 *        {
 *          "update_id": 123456789,
 *          "message": {
 *            "message_id": 1,
 *            "chat": {
 *              "id": -1001234567890,  <-- 这就是 Channel ID
 *              "title": "My Channel",
 *              "type": "supergroup"
 *            },
 *            ...
 *          }
 *        }
 *      ]
 *    }
 * 
 * 5. 复制整个数字，包括负号和前缀（通常是 -100 开头）
 * 6. 设置环境变量：TELEGRAM_CHANNEL_ID=-1001234567890
 * 
 * 方法 2：使用频道用户名（仅适用于公开频道）
 * ==============================================
 * 1. 打开频道设置 → 频道 → 用户名
 * 2. 复制用户名（不包括 @），例如 my_image_channel
 * 3. 设置环境变量：TELEGRAM_CHANNEL_ID=@my_image_channel
 * 
 * 方法 3：使用 @userinfobot
 * =========================
 * 1. 在 Telegram 中打开 @userinfobot
 * 2. 转发频道的任何消息给 @userinfobot
 * 3. Bot 会返回频道信息，包括 ID
 * 
 * 常见错误与解决
 * ==============
 * 
 * "chat not found"
 * - 检查 Channel ID 是否正确
 * - 确保 Bot 是频道的成员
 * - 如果使用数字 ID，确保以 -100 开头
 * 
 * "bot was blocked by the user"
 * - Bot 被移除出频道
 * - 重新将 Bot 添加到频道
 * - 确保给予 Bot 发送消息的权限
 * 
 * "Forbidden: bot is not a member"
 * - Bot 不在频道中
 * - 在频道设置中添加 Bot
 * 
 * Bot Token 获取
 * ==============
 * 1. 在 Telegram 搜索 @BotFather
 * 2. 发送 /start
 * 3. 选择 /newbot 创建新机器人
 * 4. 按提示设置名称和用户名
 * 5. BotFather 会返回 Token，格式为：
 *    123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
 * 6. 复制完整的 Token（包括冒号）
 * 7. 设置环境变量：TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
 */

export default function handler(req, res) {
  res.status(200).json({
    message: '请查看此文件的注释获取详细说明',
    doc_url: 'https://github.com/anzhuo114514/tgimg-edgeone#%E7%AC%AC%E4%B8%80%E6%AD%A5%E5%88%9B%E5%BB%BA-telegram-bot-%E5%92%8C%E9%A2%91%E9%81%93',
    quick_reference: {
      TELEGRAM_BOT_TOKEN: '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi',
      TELEGRAM_CHANNEL_ID_numeric: '-1001234567890 (数字 ID，以 -100 开头)',
      TELEGRAM_CHANNEL_ID_username: '@my_channel_name (频道用户名)',
      get_bot_token: '向 @BotFather 发送 /newbot',
      get_channel_id: '1) 向频道发送消息 2) 访问 https://api.telegram.org/botYOUR_TOKEN/getUpdates 3) 找 message.chat.id'
    }
  });
}

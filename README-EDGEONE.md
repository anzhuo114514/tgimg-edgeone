# EdgeOne: Telegram 频道图床（MDUI 卡片）

快速说明：这是一个用于 EdgeOne 的 Node.js 小服务，将上传的图片转发到 Telegram 频道并在前端以 MDUI 卡片风格展示。

环境变量（必须）：

- `TELEGRAM_BOT_TOKEN` - Telegram 机器人 token
- `TELEGRAM_CHANNEL_ID` - 频道 chat_id（例如 `@channelusername` 或 `-1001234567890`）

安装与运行：

```bash
npm install
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHANNEL_ID=@your_channel npm start
```

默认服务端口为 `3000`，访问根路径可看到 MDUI 卡片式界面。

前端：

- `public/index.html` + `public/app.js` 使用 MDUI 实现上传表单与图片卡片展示。

后端：

- `server.js` 实现 `/upload` 上传接口（multipart），将图片通过 `sendPhoto` 发送到频道，使用 `getFile` 获取文件链接并保存元数据到 `data/images.json`。

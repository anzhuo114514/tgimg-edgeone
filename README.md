# tgimg-edgeone

**Telegram 频道图床 — 为 EdgeOne 构建的部署方案**

## 项目说明

这是一个针对腾讯 EdgeOne 平台优化的 Node.js 图床应用。无需额外的数据库或对象存储，直接利用 Telegram 频道作为存储后端，通过 Telegram Bot 的 API 存储和获取文件 URL。前端采用 MDUI 卡片风格设计，一键部署到 EdgeOne。

## 如何在 EdgeOne 上部署

### 第一步：创建 Telegram Bot

1. 在 Telegram 中搜索 `@BotFather`，创建新 Bot
2. 获得 `TELEGRAM_BOT_TOKEN`（例：`123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi`）
3. 创建一个私有频道用于存储图片
4. 添加你的 Bot 为频道管理员，获取频道 ID（例：`@mychannel` 或 `-100123456789`）

### 第二步：在 EdgeOne 创建应用

1. 登录 EdgeOne 控制台
2. 进入应用管理，创建新应用或上传本仓库
3. 确保以下文件存在：
   - `package.json` ✓
   - `server.js` ✓（Express 服务）
   - `public/` 目录 ✓（前端文件）

### 第三步：配置环境变量

在 EdgeOne 应用的环境变量配置中添加：

```
TELEGRAM_BOT_TOKEN=你的bot_token
TELEGRAM_CHANNEL_ID=@你的频道名 或 -100123456789
PORT=3000
```

### 第四步：配置持久化存储

- EdgeOne 应用重启后 `data/` 目录会丢失图片记录
- **推荐方案**：在 EdgeOne 中将 `data/` 目录挂载到持久化卷或配置数据库
- 或修改 `server.js` 第 18-19 行，将元数据存储到外部数据库（SQLite / MySQL / MongoDB）
- 图片本身存储在 Telegram 服务器，不会丢失

### 第五步：部署与运行

1. EdgeOne 会自动执行：
   ```bash
   npm install
   npm start
   ```

2. 服务启动后监听 `3000` 端口
3. 访问应用地址即可看到 MDUI 卡片式前端
4. 开始上传图片！

## 本地调试运行

若想在本地先测试，执行：

```bash
npm install
TELEGRAM_BOT_TOKEN=你的bot_token TELEGRAM_CHANNEL_ID=@你的频道 npm start
```

然后访问 `http://localhost:3000`

## 项目文件说明

| 文件 | 说明 |
|------|------|
| `server.js` | Express 后端，处理上传、调用 Telegram API、保存元数据 |
| `public/index.html` | MDUI 卡片式前端页面 |
| `public/app.js` | 前端逻辑（上传、列表渲染、交互） |
| `package.json` | npm 依赖配置与启动脚本 |
| `data/images.json` | 图片元数据文件（运行时生成，需持久化） |

## API 接口

### 上传图片
```http
POST /upload
Content-Type: multipart/form-data

image: <file>
caption: <string, optional>
```

响应：
```json
{
  "ok": true,
  "meta": {
    "message_id": 123,
    "file_id": "AgADAgADpqcxG...",
    "file_unique_id": "AQADpqcxG...",
    "url": "https://api.telegram.org/file/bot.../...",
    "caption": "description",
    "date": 1672531200
  }
}
```

### 获取图片列表
```http
GET /list
```

响应：按时间倒序的图片元数据数组

## EdgeOne 特殊说明

### 日志与监控
- 应用在 EdgeOne 仪表盘可查看实时日志（`morgan` 已配置日志中间件）
- 可配置健康检查路径为 `/list` 或 `/`

### 费用节省
- 无需单独的数据库服务
- 无需对象存储服务
- Telegram Bot API 调用免费（图片托管于 Telegram 服务器）
- EdgeOne 按计算资源和流量计费

### 扩展性
若需支持多实例或更大规模，可修改为：
- 使用 SQLite（本地持久化卷）
- 连接 EdgeOne 的 MySQL 服务
- 或改为存储到腾讯 COS（对象存储）

## 安全建议

1. **不要在代码或 Git 中硬编码 Bot Token**
2. **在 EdgeOne 仪表盘使用环保变量机制管理敏感信息**
3. **若要公开上传端点，添加身份验证**（在 `server.js` 中增加中间件）
4. **定期检查 Telegram 频道访问权限**

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 图片上传失败 | 检查 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHANNEL_ID` 是否正确 |
| 前端无法加载 | 确保 `public/` 目录在应用根目录 |
| 重启后记录丢失 | 配置 EdgeOne 持久化卷映射到 `data/` |
| 频道收不到图片 | 确保 Bot 已添加为频道管理员 |

## 下一步

- 部署到 EdgeOne 后，可根据需要优化：
  - 添加图片缩略图与预加载
  - 实现管理面板（删除、编辑图片）
  - 集成 EdgeOne CDN 加速访问
  - 配置自定义域名

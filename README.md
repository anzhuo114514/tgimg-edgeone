# tgimg-edgeone

**Telegram 频道图床 — 为 EdgeOne 构建的 Next.js 部署方案**

## 项目说明

这是一个针对腾讯 EdgeOne 平台优化的 **Next.js** 全栈图床应用。无需额外的数据库或对象存储，直接利用 Telegram 频道作为存储后端，通过 Telegram Bot 的 API 存储和获取文件 URL。前端采用 MDUI 卡片风格设计，一键部署到 EdgeOne。

## 如何在 EdgeOne 上部署

### 第一步：创建 Telegram Bot

1. 在 Telegram 中搜索 `@BotFather`，创建新 Bot
2. 获得 `TELEGRAM_BOT_TOKEN`（例：`123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi`）
3. 创建一个私有频道用于存储图片
4. 添加你的 Bot 为频道管理员，获取频道 ID（例：`@mychannel` 或 `-100123456789`）

### 第二步：在 EdgeOne 创建应用

1. 登录 EdgeOne 控制台
2. 创建新应用，选择框架预设：**Next.js**
3. 上传本仓库代码，或关联 GitHub 仓库

### 第三步：配置环境变量

在 EdgeOne 应用的环境变量配置中添加：

```
TELEGRAM_BOT_TOKEN=你的bot_token
TELEGRAM_CHANNEL_ID=@你的频道名 或 -100123456789
```

### 第四步：配置持久化存储

- Next.js 应用重启后 `data/` 目录会丢失图片记录
- **推荐方案**：在 EdgeOne 中将 `data/` 目录挂载到持久化卷
- **高级方案**：修改 `pages/api/upload.js` 和 `pages/api/list.js`，连接外部数据库（MySQL / MongoDB）

### 第五步：部署与运行

1. EdgeOne 会自动执行：
   ```bash
   npm install
   npm run build
   npm start
   ```

2. 应用启动后监听 `3000` 端口
3. EdgeOne 自动分配外部访问地址
4. 访问应用即可看到 MDUI 卡片式前端

## 本地开发与测试

若想在本地先开发测试：

```bash
npm install
npm run dev
```

然后访问 `http://localhost:3000`

## 项目结构（Next.js）

```
tgimg-edgeone/
├── pages/
│   ├── api/
│   │   ├── upload.js       # POST /api/upload - 处理图片上传
│   │   └── list.js         # GET /api/list - 获取图片列表
│   ├── index.js            # 前端页面（MDUI 卡片）
│   └── _app.js             # Next.js App 组件
├── styles/
│   ├── globals.css         # 全局样式
│   └── home.module.css     # 页面样式模块
├── data/
│   └── images.json         # 图片元数据（运行时生成）
├── public/                 # 静态文件目录
├── package.json            # npm 依赖（Next.js + React）
├── next.config.js          # Next.js 配置
└── README.md               # 本说明
```

## API 接口

### 上传图片
```http
POST /api/upload
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "caption": "图片描述（可选）"
}
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
    "caption": "图片描述",
    "date": 1672531200,
    "timestamp": "2023-01-01T12:00:00.000Z"
  }
}
```

### 获取图片列表
```http
GET /api/list
```

响应：按时间倒序的图片元数据数组

## EdgeOne 特殊说明

### 自动构建与部署
- EdgeOne 识别 `package.json` 中的 `build` 脚本并自动编译 Next.js
- `start` 脚本启动生产环境服务器
- 无需额外配置 Dockerfile

### 日志与监控
- Next.js 运行日志可在 EdgeOne 仪表盘实时查看
- 支持配置自定义健康检查路径（例如 `/api/list`）

### 费用节省
- 无需单独的数据库服务
- 无需对象存储服务
- Telegram Bot API 调用完全免费
- 图片托管于 Telegram 服务器

### 扩展与优化
- 可在 `next.config.js` 配置静态导出或 ISR（增量静态再生成）
- 支持 EdgeOne CDN 加速前端资源
- 支持自定义域名和 HTTPS

## 安全建议

1. **不要在代码或 Git 中硬编码 Bot Token**
2. **在 EdgeOne 仪表盘使用环境变量管理敏感信息**
3. **若要公开上传端点，在 `/pages/api/upload.js` 中添加身份验证**（例如 API Key、签名或 OAuth）
4. **定期检查 Telegram 频道的访问权限和成员**

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 图片上传失败 | 检查 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHANNEL_ID` 是否正确 |
| 前端无法加载 | 检查 EdgeOne 日志中是否有构建或运行时错误 |
| 重启后记录丢失 | 在 EdgeOne 中配置持久化卷挂载到 `data/` 目录 |
| 频道收不到图片 | 确保 Bot 已添加为频道管理员 |
| Next.js 构建超时 | 增加 EdgeOne 中的构建超时时间 |

## 下一步

- 部署到 EdgeOne 后，可根据需要优化：
  - 增加图片缩略图预加载与 CDN 加速
  - 实现管理面板（删除、编辑、统计图片）
  - 集成用户认证系统
  - 配置自定义域名与 HTTPS
  - 迁移数据存储到云数据库

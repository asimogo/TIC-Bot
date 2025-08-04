# TIC-Bot

基于 Grammy 框架的 Telegram 机器人项目 - 专业的资料采集系统

## 功能特性

- 🤖 **智能资料采集**: 支持媒体组+验证视频的完整资料收集流程
- 💾 **数据库存储**: MySQL 数据库持久化存储，自动生成资料编号
- 📝 **完整反馈机制**: 实时状态通知，超时提醒，完成确认
- 🛡️ **错误处理机制**: 完善的异常处理和用户提示
- ⏰ **超时管理**: 60 秒超时机制，自动清理未完成会话
- 🔄 **优雅关闭**: 支持优雅的进程关闭和数据库连接清理

## 业务流程

### 📥 资料提交流程

1. **发送媒体组** - 管理员发送图片/视频/文档组合
2. **收到确认** - 机器人确认接收，提示下一步操作
3. **发送验证视频** - 在 60 秒内发送验证视频
4. **获得编号** - 系统保存到数据库，返回唯一资料编号

### ⏰ 超时处理

- 如果 60 秒内未收到验证视频，系统会：
  - 发送超时提醒
  - 清理当前会话
  - 提示重新提交流程

## 快速开始

### 1. 环境准备

确保你的系统已安装：

- Node.js (≥ 16.0.0)
- MySQL (≥ 5.7)

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

在 `.env` 文件中配置：

```env
# Telegram机器人配置
BOT_TOKEN=你的机器人token

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=telegram_bot

# 业务配置
COLLECTION_TIMEOUT=60000
WAITING_NOTICE_INTERVAL=15000

# 环境配置
NODE_ENV=development
```

> 💡 从 [@BotFather](https://t.me/BotFather) 获取你的机器人 Token

### 4. 初始化数据库

```bash
# 快速设置数据库（推荐）
npm run setup-db

# 或手动执行SQL脚本
mysql -u root -p < scripts/init-database.sql
```

### 5. 运行项目

#### 开发模式（推荐）

```bash
npm run dev
```

#### 生产模式

```bash
# 构建项目
npm run build

# 启动机器人
npm start
```

## 开发指南

### 项目结构

```
TIC-Bot/
├── src/
│   ├── bot/
│   │   └── bot.ts              # 机器人主逻辑
│   └── utils/
│       ├── database.ts         # 数据库连接和操作
│       └── upload-session.ts   # 上传会话管理
├── scripts/
│   ├── init-database.sql       # 数据库初始化脚本
│   └── setup-database.js       # 数据库快速设置工具
├── dist/                       # 构建输出目录
├── docs/                       # 项目文档
├── .env.example               # 环境变量模板
├── .gitignore                # Git忽略文件
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
└── README.md                 # 项目说明
```

### 可用脚本

```bash
npm run build      # 编译TypeScript代码
npm run dev        # 开发模式（nodemon + tsx：直接运行TypeScript，无需编译）
npm run dev:direct # 直接运行一次（tsx：快速测试代码）
npm run dev:watch  # 开发模式（tsc-watch：监听文件变化，自动编译并运行）
npm run dev:build  # 开发模式（仅编译监听，不运行）
npm start          # 生产模式运行
npm run clean      # 清理构建文件
npm run setup-db   # 快速设置数据库
```

### 数据库结构

#### resources 表

| 字段        | 类型               | 说明             |
| ----------- | ------------------ | ---------------- |
| id          | INT AUTO_INCREMENT | 资料 ID（主键）  |
| user_id     | BIGINT             | 用户 Telegram ID |
| caption     | TEXT               | 资料标题/描述    |
| media_count | INT                | 媒体文件数量     |
| has_video   | BOOLEAN            | 是否包含验证视频 |
| media_files | JSON               | 媒体文件信息     |
| video_file  | JSON               | 验证视频信息     |
| created_at  | TIMESTAMP          | 创建时间         |

### 技术栈

- **TypeScript**: 主要开发语言
- **Grammy**: Telegram Bot 框架
- **MySQL2**: 数据库连接驱动
- **Node.js**: 运行环境
- **dotenv**: 环境变量管理
- **tsx**: 现代 TypeScript 运行器（无需编译）
- **tsc-watch**: 开发时自动编译和热重载

### 开发特性

- ⚡ **零编译开发**: 使用 `tsx` + `nodemon` 直接运行 TypeScript 代码
- 🔥 **热重载**: 文件变化时自动重启，无需手动编译
- 📦 **增量编译**: 可选的 TypeScript 增量编译模式
- 🛠️ **多种开发模式**: 直接运行、监听编译、仅编译等选项
- 🗄️ **数据库集成**: 完整的 MySQL 数据库操作层

> 📖 详细的开发指南请参考 [docs/development.md](docs/development.md)

## 部署说明

### 1. 服务器环境准备

- Node.js 16+
- MySQL 5.7+
- PM2（推荐用于进程管理）

### 2. 部署步骤

```bash
# 1. 克隆代码
git clone <your-repo>
cd TIC-Bot

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
npm run setup-db

# 5. 构建项目
npm run build

# 6. 启动服务（使用PM2）
pm2 start dist/bot/bot.js --name "tic-bot"

# 或直接启动
npm start
```

### 3. 进程管理（PM2）

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs tic-bot

# 重启服务
pm2 restart tic-bot

# 停止服务
pm2 stop tic-bot
```

## API 文档

### DatabaseManager 主要方法

```typescript
// 保存资料
const resourceId = await db.saveResource(resourceData);

// 查询资料
const resource = await db.getResourceById(id);

// 查询用户所有资料
const userResources = await db.getResourcesByUserId(userId);
```

### UploadSessionManager 主要方法

```typescript
// 开始收集会话
await sessionManager.startPost(userId, message);

// 添加媒体文件
sessionManager.appendMedia(userId, message);

// 添加验证视频
await sessionManager.addVerification(userId, message);
```

## 故障排除

### 常见问题

1. **数据库连接失败**

   ```bash
   # 检查MySQL服务状态
   systemctl status mysql

   # 测试数据库连接
   npm run setup-db
   ```

2. **机器人无响应**

   ```bash
   # 检查Token是否正确
   # 检查网络连接
   # 查看日志输出
   ```

3. **环境变量问题**
   ```bash
   # 确保.env文件存在且格式正确
   # 检查所有必需的环境变量
   ```

### 日志调试

项目包含详细的日志输出：

- 🆕 会话创建
- 📸 媒体添加
- 🎥 验证视频
- ✅ 保存成功
- ⏰ 超时处理
- ❌ 错误信息

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证

## 更新日志

### v2.0.0 (Latest)

- ✅ 实现完整的 MySQL 数据库集成
- ✅ 数据库自增 ID 作为资料编号
- ✅ 完善的用户反馈机制
- ✅ 60 秒超时处理
- ✅ 优雅的错误处理
- ✅ 数据库连接池管理

### v1.0.0

- ✅ 基础机器人框架
- ✅ 媒体组收集功能
- ✅ 临时编号生成

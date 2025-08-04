# 开发指南

## 零编译开发模式

本项目配置了 `tsx` + `nodemon` 来实现**零编译开发**，让你可以直接运行 TypeScript 代码，省去编译步骤。

### 开发模式说明

#### 1. 主要开发模式（推荐） - 零编译

```bash
npm run dev
```

- ⚡ **无需编译**: 直接运行 TypeScript 源代码
- 🔥 **自动重启**: 监听文件变化，自动重启机器人
- 🚀 **启动更快**: 省去编译时间，立即看到效果
- 🛡️ **类型安全**: 仍然提供完整的 TypeScript 类型检查

#### 2. 快速测试模式

```bash
npm run dev:direct
```

- 直接运行一次 TypeScript 代码
- 用于快速测试代码变更
- 不监听文件变化

#### 3. 编译+运行模式

```bash
npm run dev:watch
```

- 监听 TypeScript 文件变化
- 自动编译到 `dist/` 目录
- 编译成功后自动运行机器人
- 适用于需要构建产物的调试场景

#### 4. 仅编译模式

```bash
npm run dev:build
```

- 只监听和编译，不运行机器人
- 适用于调试编译问题或检查类型错误
- 不清除控制台输出

### tsx + nodemon 的优势

- **⚡ 极速启动**: 无编译步骤，直接运行源码
- **🔄 即时反馈**: 保存即重启，开发体验丝滑
- **🛡️ 类型安全**: 保持完整的 TypeScript 类型检查
- **🎯 ES 模块兼容**: 完美支持现代 JavaScript 特性
- **💾 节省磁盘**: 不生成中间编译文件

### 开发工作流

1. 配置你的机器人 Token：

   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加真实的 BOT_TOKEN
   ```

2. 启动开发服务器：

   ```bash
   npm run dev
   ```

3. 修改 `src/bot/bot.ts` 文件

4. 保存文件后，nodemon + tsx 会：

   - 🔍 自动检测文件变化
   - ⚡ 直接重新运行 TypeScript 代码（无编译）
   - 🚀 立即重启机器人
   - 📋 显示详细的运行日志

5. 查看控制台输出了解机器人状态

### 配置说明

项目包含了一个优化的 `nodemon.json` 配置文件：

```json
{
  "watch": ["src"], // 监听 src 目录
  "ext": "ts,js,json", // 监听的文件扩展名
  "ignore": [
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "dist/**/*",
    "node_modules/**/*"
  ],
  "exec": "tsx src/bot/bot.ts", // 使用 tsx 执行
  "env": { "NODE_ENV": "development" }, // 设置开发环境
  "delay": 1000, // 防抖延迟
  "verbose": true // 详细输出
}
```

### 故障排除

如果开发模式出现问题，可以：

1. 使用直接运行模式测试：

   ```bash
   npm run dev:direct
   ```

2. 切换到编译模式调试：

   ```bash
   npm run dev:watch
   ```

3. 手动编译检查错误：

   ```bash
   npm run build
   ```

4. 清理并重新开始：
   ```bash
   npm run clean && npm run dev
   ```

### 性能对比

| 模式                              | 启动时间 | 重启时间 | 磁盘占用 | 推荐场景    |
| --------------------------------- | -------- | -------- | -------- | ----------- |
| `npm run dev` (tsx)               | ~1s      | ~0.5s    | 低       | ✅ 日常开发 |
| `npm run dev:watch` (tsc-watch)   | ~3s      | ~1s      | 中       | 调试构建    |
| `npm run dev:direct` (tsx 一次性) | ~1s      | -        | 低       | 快速测试    |

### 技术细节

#### tsx vs ts-node

- **tsx**: 现代化的 TypeScript 运行器，专为 ESM 设计
- **ts-node**: 传统的 TypeScript 运行器，在 ESM 模式下需要额外配置
- **选择**: 项目使用 `"type": "module"`，tsx 是更好的选择

#### nodemon 配置优化

- `delay: 1000`: 防止频繁文件变化导致的重复重启
- `verbose: true`: 提供详细的监听和重启信息
- 精确的文件过滤：只监听源码，忽略测试和构建文件


1、初化化机器人
2、判断是否在频道
3、

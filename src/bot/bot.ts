/**
 * Telegram机器人主入口文件
 * 使用grammy框架开发
 */

import { Bot } from "grammy";
import dotenv from "dotenv";
import { UploadSessionManager } from "../utils/upload-session.js";
import { DatabaseManager } from "../utils/database.js";





// 加载环境变量
dotenv.config();

// 检查必要的环境变量
if (!process.env.BOT_TOKEN) {
    console.error("错误: BOT_TOKEN环境变量未设置");
    console.error("请检查 .env 文件或环境变量配置");
    process.exit(1);
}

// 初始化机器人实例
const bot = new Bot(process.env.BOT_TOKEN);

// 初始化数据库
const db = new DatabaseManager();

const sessionManager = new UploadSessionManager(bot, db);

// 错误处理中间件
bot.catch((err) => {
    console.error("Bot发生错误:", err);
});

// 注册/start命令处理
bot.command("start", async (ctx) => {
    try {
        const user = ctx.from;
        console.log(`用户 ${user?.username || user?.first_name} (ID: ${user?.id}) 执行了 /start 命令`);

        await ctx.reply(
            "🤖 欢迎使用 TIC-Bot!\n\n" +
            "这是一个基于 Grammy 框架开发的 Telegram 信息采集机器人。\n", { reply_markup: { remove_keyboard: true, selective: true } }
        );
    } catch (error) {
        console.error("处理 /start 命令时出错:", error);
        await ctx.reply("抱歉，处理命令时发生了错误。请稍后重试。");
    }
});

bot.command("get", async (ctx) => {
    try {
        const user = ctx.from;
        console.log(`用户 ${user?.username || user?.first_name}(ID ${user?.id})执行了 /Get 命令  `);
        await ctx.reply(``);
    } catch (error) {

    }
})



bot.on("message", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const msg = ctx.message;

    if (msg.media_group_id) {
        if (!sessionManager.hasSession(userId)) {
            await sessionManager.startPost(userId, msg);
        } else {
            sessionManager.appendMedia(userId, msg);
        }
    } else if (msg.video) {
        await sessionManager.addVerification(userId, msg);
    }
});

// 优雅关闭处理
const gracefulShutdown = async () => {
    console.log("\n正在关闭机器人...");

    try {
        // 停止机器人
        bot.stop();
        console.log("🤖 机器人已停止");

        // 关闭数据库连接
        await db.close();
        console.log("🔒 数据库连接已关闭");

        console.log("✅ 程序已安全退出");
        process.exit(0);
    } catch (error) {
        console.error("关闭程序时发生错误:", error);
        process.exit(1);
    }
};

// 监听进程信号
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// 启动机器人
console.log("正在启动 TIC-Bot...");

async function startBot() {
    try {
        // 测试数据库连接
        console.log("🔄 正在测试数据库连接...");
        const dbConnected = await db.testConnection();
        if (!dbConnected) {
            console.error("❌ 数据库连接失败，程序退出");
            process.exit(1);
        }

        // 初始化数据库表
        console.log("🔄 正在初始化数据库表...");
        await db.initializeTables();

        // 启动机器人
        await bot.start({
            onStart: () => {
                console.log("✅ TIC-Bot 已成功启动！");
                console.log("📊 数据库连接正常");
                console.log("🚀 机器人准备就绪，等待接收资料...");
            }
        });
    } catch (error) {
        console.error("启动机器人时发生错误:", error);
        process.exit(1);
    }
}

startBot();

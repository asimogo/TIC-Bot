import type { Message } from "grammy/types";
import type { Bot } from "grammy";
import dotenv from 'dotenv';
import { DatabaseManager, messagesToJson, videoMessageToJson, type ResourceData } from "./database.js";

type UploadState = "idle" | "post" | "verification" | "success";
interface UploadSession {
    state: UploadState;
    mediaGroupMessages: Message[],
    caption?: string;
    videoMessage?: Message;
    timeoutHandle?: NodeJS.Timeout;
}

// 加载环境变量
dotenv.config();

export class UploadSessionManager {
    private sessions: Map<number, UploadSession> = new Map();
    private timeoutMs = Number(process.env.COLLECTION_TIMEOUT) * 1000 || 60000;
    private bot: Bot;
    private db: DatabaseManager;

    constructor(bot: Bot, db: DatabaseManager) {
        this.bot = bot;
        this.db = db;
    }

    async startPost(userId: number, message: Message) {
        // 如果已有会话，先清理
        const existingSession = this.sessions.get(userId);
        if (existingSession) {
            console.warn(`用户 ${userId} 已有活跃会话，清理后重新开始`);
            if (existingSession.timeoutHandle) {
                clearTimeout(existingSession.timeoutHandle);
            }
        }

        const session: UploadSession = {
            state: "post",
            mediaGroupMessages: [message],
            caption: message.caption || "",
            timeoutHandle: this.setTimeout(userId),
        };
        this.sessions.set(userId, session);
        console.log(`🆕 创建新会话，用户ID: ${userId}，标题: "${session.caption}"`);

        // 发送确认消息和下一步指引
        try {
            await this.bot.api.sendMessage(
                userId,
                "📥 资料收集已开始\n\n" +
                "✅ 已接收您的媒体组\n" +
                `⏰ 请在${process.env.COLLECTION_TIMEOUT}秒内发送验证视频以完成提交\n\n` +
                "📝 当前状态：等待验证视频"
            );
        } catch (error) {
            console.error(`发送开始确认消息失败，用户ID: ${userId}`, error);
        }
    }

    private setTimeout(userId: number): NodeJS.Timeout {
        return setTimeout(async () => {
            const session = this.sessions.get(userId);
            if (session) {
                console.warn(`⏰ 会话超时，清除用户 ${userId}，状态: ${session.state}`);

                // 发送超时提示给用户
                try {
                    await this.bot.api.sendMessage(
                        userId,
                        "⏰ 资料收集超时\n\n" +
                        `您的媒体组已接收，但在${process.env.COLLECTION_TIMEOUT}秒内未收到验证视频。\n` +
                        "本次提交已被忽略，请重新发送完整资料。\n\n" +
                        "📝 提交流程：\n" +
                        "1️⃣ 发送媒体组（图片/视频）\n" +
                        `2️⃣ 在${process.env.COLLECTION_TIMEOUT}秒内发送验证视频`
                    );
                } catch (error) {
                    console.error(`发送超时通知失败，用户ID: ${userId}`, error);
                }

                this.sessions.delete(userId);
            }
        }, this.timeoutMs);
    }

    appendMedia(userId: number, message: Message) {
        const session = this.sessions.get(userId);
        if (!session) {
            console.warn(`尝试向不存在的会话添加媒体，用户ID: ${userId}`);
            return;
        }

        if (session.state !== "post") {
            console.warn(`会话状态不正确，无法添加媒体。用户ID: ${userId}，当前状态: ${session.state}`);
            return;
        }

        session.mediaGroupMessages.push(message);
        console.log(`📸 添加媒体到会话，用户ID: ${userId}，媒体总数: ${session.mediaGroupMessages.length}`);
    }

    async addVerification(userId: number, message: Message) {
        const session = this.sessions.get(userId);
        if (!session) {
            console.warn(`尝试为不存在的会话添加验证视频，用户ID: ${userId}`);
            return;
        }

        if (session.state !== 'post') {
            console.warn(`会话状态不正确，无法添加验证视频。用户ID: ${userId}，当前状态: ${session.state}`);
            return;
        }

        session.videoMessage = message;
        session.state = 'verification';
        console.log(`🎥 添加验证视频，用户ID: ${userId}，进入验证状态`);
        await this.finalize(userId);
    }

    private async finalize(userId: number) {
        const session = this.sessions.get(userId);
        if (!session) {
            console.warn(`尝试完成不存在的会话，用户ID: ${userId}`);
            return;
        }

        try {
            // 准备保存到数据库的数据
            const resourceData: ResourceData = {
                userId,
                caption: session.caption || '',
                mediaCount: session.mediaGroupMessages.length,
                hasVideo: !!session.videoMessage,
                mediaFiles: messagesToJson(session.mediaGroupMessages),
                videoFile: session.videoMessage ? videoMessageToJson(session.videoMessage) : ''
            };

            // 保存到数据库，获取自增ID
            const resourceId = await this.db.saveResource(resourceData);

            console.log("✅ 会话完成，数据已保存", {
                resourceId,
                userId,
                caption: session.caption,
                mediaCount: session.mediaGroupMessages.length,
                hasVideo: !!session.videoMessage,
            });

            // 发送成功反馈给用户，使用数据库自增ID
            await this.bot.api.sendMessage(
                userId,
                "✅ 资料提交成功！\n\n" +
                `📋 资料编号: #${resourceId}\n` +
                `📸 媒体文件: ${session.mediaGroupMessages.length} 个\n` +
                `🎥 验证视频: 已提供\n`
            );

            session.state = 'success';

            // 安全地清理超时句柄
            if (session.timeoutHandle) {
                clearTimeout(session.timeoutHandle);
            }

            this.sessions.delete(userId);
        } catch (error) {
            console.error(`完成会话时发生错误，用户ID: ${userId}`, error);

            // 发送错误通知给用户
            try {
                await this.bot.api.sendMessage(
                    userId,
                    "❌ 资料保存失败\n\n" +
                    "系统在保存您的资料时遇到了错误，请稍后重试。"
                );
            } catch (notifyError) {
                console.error(`发送错误通知失败，用户ID: ${userId}`, notifyError);
            }

            // 即使出错也要清理会话
            if (session.timeoutHandle) {
                clearTimeout(session.timeoutHandle);
            }
            this.sessions.delete(userId);
        }
    }



    getSession(userId: number): UploadSession | undefined {
        return this.sessions.get(userId);
    }

    hasSession(userId: number): boolean {
        return this.sessions.has(userId);
    }

}

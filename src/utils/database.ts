/**
 * MySQL数据库连接和操作模块
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import type { Message } from "grammy/types";

// 加载环境变量
dotenv.config();

// 数据库连接配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'telegram_bot',
    charset: 'utf8mb4'
};

// 资料信息接口
export interface ResourceData {
    id?: number;
    userId: number;
    caption: string;
    mediaCount: number;
    hasVideo: boolean;
    mediaFiles: string; // JSON字符串存储媒体文件信息
    videoFile: string; // JSON字符串存储验证视频信息
    createdAt?: Date;
}

export class DatabaseManager {
    private pool: mysql.Pool;

    constructor() {
        this.pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    /**
     * 初始化数据库表结构
     */
    async initializeTables(): Promise<void> {
        const connection = await this.pool.getConnection();

        try {
            // 创建资料表
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS resources (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    caption TEXT,
                    media_count INT NOT NULL DEFAULT 0,
                    has_video BOOLEAN NOT NULL DEFAULT FALSE,
                    media_files JSON NOT NULL,
                    video_file JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            console.log('✅ 数据库表初始化完成');
        } catch (error) {
            console.error('❌ 数据库表初始化失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 保存资料到数据库
     */
    async saveResource(data: ResourceData): Promise<number> {
        const connection = await this.pool.getConnection();

        try {
            const [result] = await connection.execute<mysql.ResultSetHeader>(`
                INSERT INTO resources (
                    user_id, caption, media_count, has_video, 
                    media_files, video_file
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                data.userId,
                data.caption || '',
                data.mediaCount,
                data.hasVideo,
                data.mediaFiles,
                data.videoFile || null
            ]);

            const resourceId = result.insertId;
            console.log(`✅ 资料保存成功，ID: ${resourceId}`);
            return resourceId;
        } catch (error) {
            console.error('❌ 保存资料失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 根据ID查询资料
     */
    async getResourceById(id: number): Promise<ResourceData | null> {
        const connection = await this.pool.getConnection();

        try {
            const [rows] = await connection.execute<mysql.RowDataPacket[]>(`
                SELECT * FROM resources WHERE id = ?
            `, [id]);

            if (rows.length === 0) {
                return null;
            }

            const row = rows[0]!;
            return {
                id: row.id,
                userId: row.user_id,
                caption: row.caption,
                mediaCount: row.media_count,
                hasVideo: row.has_video,
                mediaFiles: row.media_files,
                videoFile: row.video_file,
                createdAt: row.created_at
            };
        } catch (error) {
            console.error('❌ 查询资料失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 查询用户的所有资料
     */
    async getResourcesByUserId(userId: number): Promise<ResourceData[]> {
        const connection = await this.pool.getConnection();

        try {
            const [rows] = await connection.execute<mysql.RowDataPacket[]>(`
                SELECT * FROM resources WHERE user_id = ? ORDER BY created_at DESC
            `, [userId]);

            return rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                caption: row.caption,
                mediaCount: row.media_count,
                hasVideo: row.has_video,
                mediaFiles: row.media_files,
                videoFile: row.video_file,
                createdAt: row.created_at
            }));
        } catch (error) {
            console.error('❌ 查询用户资料失败:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 测试数据库连接
     */
    async testConnection(): Promise<boolean> {
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            console.log('✅ 数据库连接正常');
            return true;
        } catch (error) {
            console.error('❌ 数据库连接失败:', error);
            return false;
        }
    }

    /**
     * 关闭数据库连接池
     */
    async close(): Promise<void> {
        await this.pool.end();
        console.log('🔒 数据库连接池已关闭');
    }
}

/**
 * 将Telegram消息转换为JSON字符串
 */
export function messagesToJson(messages: Message[]): string {
    return JSON.stringify(messages.map(msg => ({
        messageId: msg.message_id,
        mediaGroupId: msg.media_group_id,
        caption: msg.caption,
        photo: msg.photo?.map(p => ({
            fileId: p.file_id,
            fileUniqueId: p.file_unique_id,
            fileSize: p.file_size
        })),
        video: msg.video ? {
            fileId: msg.video.file_id,
            fileUniqueId: msg.video.file_unique_id,
            duration: msg.video.duration,
            fileSize: msg.video.file_size
        } : undefined,
        date: msg.date
    })));
}

/**
 * 将单个验证视频消息转换为JSON字符串
 */
export function videoMessageToJson(message: Message): string {
    return JSON.stringify({
        messageId: message.message_id,
        caption: message.caption,
        video: message.video ? {
            fileId: message.video.file_id,
            fileUniqueId: message.video.file_unique_id,
            duration: message.video.duration,
            fileSize: message.video.file_size
        } : undefined,
        date: message.date
    });
}
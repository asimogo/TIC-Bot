-- TIC-Bot 数据库初始化脚本
-- 创建数据库和表结构

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS telegram_bot 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE telegram_bot;

-- 创建资料表
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '资料ID（自增）',
    user_id BIGINT NOT NULL COMMENT '用户Telegram ID',
    caption TEXT COMMENT '资料标题/描述',
    media_count INT NOT NULL DEFAULT 0 COMMENT '媒体文件数量',
    has_video BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否包含验证视频',
    media_files JSON NOT NULL COMMENT '媒体文件信息（JSON格式）',
    video_file JSON COMMENT '验证视频信息（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_has_video (has_video)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资料信息表';

-- 插入测试数据（可选）
-- INSERT INTO resources (user_id, caption, media_count, has_video, media_files, video_file) 
-- VALUES (
--     123456789, 
--     '测试资料', 
--     2, 
--     true, 
--     '{"test": "media data"}',
--     '{"test": "video data"}'
-- );

-- 显示表结构
DESCRIBE resources;

-- 显示创建的表
SHOW TABLES;

SELECT 'Database initialization completed successfully!' AS status;
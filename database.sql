-- *******************************************
-- 步骤 1: 数据库创建
-- *******************************************

-- 创建数据库 website_db，指定字符集为 utf8mb4 以支持中文和特殊符号
CREATE DATABASE IF NOT EXISTS website_db
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 切换到该数据库
USE website_db;

-- *******************************************
-- 步骤 2: 创建数据表
-- *******************************************

-- 1. 用户表 (users)
-- 存储用户信息及角色（admin/user）
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' 或 'user'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 文章表 (articles)
-- 存储文章内容、分类、作者外键及附件路径
CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content MEDIUMTEXT NOT NULL, -- 使用 MEDIUMTEXT 以支持较长的文章
    category VARCHAR(50) DEFAULT 'domestic', -- 新增：文章分类 (domestic, international, clinical, pharmacy)
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author_id INT NOT NULL,
    attachment VARCHAR(255), -- 附件文件名

    -- 外键约束：当用户被删除时，其发布的文章也会被级联删除
    CONSTRAINT fk_articles_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 邮箱验证码表 (email_codes)
-- 用于注册流程的临时验证码
CREATE TABLE IF NOT EXISTS email_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    code CHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 添加索引以加快查询速度
    INDEX idx_email (email),
    INDEX idx_expire (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- *******************************************
-- 步骤 3: 数据库用户权限配置
-- *******************************************

-- 创建应用专用用户 'yang'，密码 'mm2006515070910'
-- 如果用户已存在，先删除再重建（开发环境方便重置，生产环境请谨慎）
DROP USER IF EXISTS 'yang'@'localhost';
CREATE USER 'yang'@'localhost' IDENTIFIED BY 'mm2006515070910';

-- 授予 'yang' 用户对 website_db 数据库的所有操作权限
GRANT ALL PRIVILEGES ON website_db.* TO 'yang'@'localhost';

-- 刷新权限，使其立即生效
FLUSH PRIVILEGES;

-- *******************************************
-- 步骤 4: 验证
-- *******************************************

SHOW TABLES;
DESCRIBE articles; -- 检查是否包含 category 字段
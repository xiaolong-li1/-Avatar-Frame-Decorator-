-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- 头像表
CREATE TABLE avatars (
    id UUID PRIMARY KEY,
    file_url VARCHAR(255) NOT NULL,
    user_id UUID, -- 可选，关联用户表
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 头像框表
CREATE TABLE frames (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(50),
  thumbnail_url TEXT,
  frame_url TEXT,
  is_preset BOOLEAN DEFAULT false,
  is_animated BOOLEAN DEFAULT false,
  tags TEXT[],
  user_id VARCHAR(50) REFERENCES users(id)
);
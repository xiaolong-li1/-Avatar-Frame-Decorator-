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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(50) REFERENCES users(id)
);

-- 文本生成图像历史记录表
CREATE TABLE text_to_image_history (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,
    width INTEGER DEFAULT 512,
    height INTEGER DEFAULT 512,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 生成图像记录表
CREATE TABLE ai_generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),  -- 类型改为 INTEGER
    task_type VARCHAR(50) NOT NULL,
    original_image_url TEXT,
    prompt TEXT,
    result_url TEXT NOT NULL,
    openai_model VARCHAR(50),
    parameters JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 风格库表
CREATE TABLE ai_styles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    prompt_template TEXT NOT NULL, -- 风格转换的提示词模板
    preview_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

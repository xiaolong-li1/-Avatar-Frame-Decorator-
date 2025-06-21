-- 删除已存在的表（如果需要重新创建）
DROP TABLE IF EXISTS ai_generated_images CASCADE;
DROP TABLE IF EXISTS text_to_image_history CASCADE;
DROP TABLE IF EXISTS ai_styles CASCADE;
DROP TABLE IF EXISTS frames CASCADE;
DROP TABLE IF EXISTS avatars CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表 - 使用UUID作为主键
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 头像表
CREATE TABLE avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 头像框表 - 修复数据类型一致性
CREATE TABLE frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'custom',
  thumbnail_url TEXT,
  frame_url TEXT NOT NULL,
  is_preset BOOLEAN DEFAULT false,
  is_animated BOOLEAN DEFAULT false,
  tags TEXT[],
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 文本生成图像历史记录表
CREATE TABLE text_to_image_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    model VARCHAR(50) DEFAULT 'dall-e-3',
    quality VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI 生成图像记录表
CREATE TABLE ai_generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    original_image_url TEXT,
    prompt TEXT,
    result_url TEXT NOT NULL,
    openai_model VARCHAR(50),
    parameters JSONB,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 风格库表
CREATE TABLE ai_styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    prompt_template TEXT NOT NULL,
    preview_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 任务状态表 - 用于跟踪异步任务
CREATE TABLE task_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    result_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分享记录表
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id VARCHAR(50) UNIQUE NOT NULL,
    image_url TEXT NOT NULL,
    share_type VARCHAR(20) DEFAULT 'wechat',
    qr_code_url TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_frames_user_id ON frames(user_id);
CREATE INDEX idx_frames_category ON frames(category);
CREATE INDEX idx_frames_is_preset ON frames(is_preset);
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_text_to_image_history_user_id ON text_to_image_history(user_id);
CREATE INDEX idx_ai_generated_images_user_id ON ai_generated_images(user_id);
CREATE INDEX idx_ai_generated_images_task_type ON ai_generated_images(task_type);
CREATE INDEX idx_task_status_user_id ON task_status(user_id);
CREATE INDEX idx_task_status_status ON task_status(status);
CREATE INDEX idx_shares_share_id ON shares(share_id);

-- 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_frames_updated_at BEFORE UPDATE ON frames FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_status_updated_at BEFORE UPDATE ON task_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 初始化预设数据
-- ===========================================

-- 插入预设头像框数据 (基于 upload_frames.js 的逻辑)
-- 注意：这里使用占位符URL，实际使用时需要替换为真实的Cloudinary URL

-- 节日主题头像框
INSERT INTO frames (id, name, category, thumbnail_url, frame_url, is_preset, is_animated, tags, description) VALUES
(gen_random_uuid(), '节日头像框', '节日', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/01.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/01.png', true, false, ARRAY['预设', '节日'], '适合节日庆祝的装饰头像框'),

-- 经典主题头像框
(gen_random_uuid(), '经典头像框', '经典', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/02.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/02.png', true, false, ARRAY['预设', '经典'], '经典简约风格的头像框'),

-- 时尚主题头像框
(gen_random_uuid(), '时尚头像框', '时尚', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/03.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/03.png', true, false, ARRAY['预设', '时尚'], '现代时尚风格的头像框'),

-- 复古主题头像框
(gen_random_uuid(), '复古头像框', '复古', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/04.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/04.png', true, false, ARRAY['预设', '复古'], '复古怀旧风格的头像框'),

-- 更多预设头像框示例
(gen_random_uuid(), '圆形经典', '经典', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/classic-circle.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/classic-circle.png', true, false, ARRAY['预设', '经典', '圆形'], '经典的圆形头像框'),

(gen_random_uuid(), '方形简约', '经典', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/square-simple.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/square-simple.png', true, false, ARRAY['预设', '经典', '方形'], '简约的方形边框'),

(gen_random_uuid(), '春节特别版', '节日', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/spring-festival.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/spring-festival.png', true, false, ARRAY['预设', '节日', '春节'], '春节主题装饰框'),

(gen_random_uuid(), '圣诞特别版', '节日', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/christmas.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/christmas.png', true, false, ARRAY['预设', '节日', '圣诞'], '圣诞节主题装饰框'),

(gen_random_uuid(), '霓虹时尚', '时尚', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/neon-fashion.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/neon-fashion.png', true, false, ARRAY['预设', '时尚', '霓虹'], '霓虹灯效果时尚框'),

(gen_random_uuid(), '几何时尚', '时尚', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/geometric-fashion.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/geometric-fashion.png', true, false, ARRAY['预设', '时尚', '几何'], '几何图案时尚框'),

(gen_random_uuid(), '70年代复古', '复古', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/70s-retro.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/70s-retro.png', true, false, ARRAY['预设', '复古', '70年代'], '70年代复古风格框'),

(gen_random_uuid(), '胶片复古', '复古', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/film-retro.png', 'https://res.cloudinary.com/your-cloud/image/upload/v1/frames/film-retro.png', true, false, ARRAY['预设', '复古', '胶片'], '胶片相机复古框');

-- 插入AI风格数据
INSERT INTO ai_styles (id, name, category, prompt_template, preview_url, is_active) VALUES
(gen_random_uuid(), '油画大师', 'artistic', '将这张图片转换为油画风格，具有丰富的纹理和笔触，色彩饱满，如同大师级作品', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/oil-painting.jpg', true),

(gen_random_uuid(), '水彩画风', 'artistic', '将这张图片转换为水彩画风格，色彩柔和流动，具有自然的水彩晕染效果', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/watercolor.jpg', true),

(gen_random_uuid(), '卡通动漫', 'cartoon', '将这张图片转换为卡通风格，色彩鲜艳，线条简化，具有动漫特色', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/cartoon.jpg', true),

(gen_random_uuid(), '素描写实', 'artistic', '将这张图片转换为铅笔素描风格，线条细腻，明暗对比强烈', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/sketch.jpg', true),

(gen_random_uuid(), '赛博朋克', 'futuristic', '将这张图片转换为赛博朋克风格，霓虹色彩，未来主义元素，科技感十足', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/cyberpunk.jpg', true),

(gen_random_uuid(), '古典宫廷', 'classical', '将这张图片转换为古典宫廷画风格，典雅华贵，具有文艺复兴时期的特色', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/classical-court.jpg', true),

(gen_random_uuid(), '印象派', 'artistic', '将这张图片转换为印象派风格，色彩斑斓，笔触明显，光影变化丰富', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/impressionist.jpg', true),

(gen_random_uuid(), '日式浮世绘', 'traditional', '将这张图片转换为日式浮世绘风格，线条简洁，色彩平面，具有东方艺术特色', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/ukiyo-e.jpg', true),

(gen_random_uuid(), '波普艺术', 'modern', '将这张图片转换为波普艺术风格，色彩鲜艳对比强烈，具有现代艺术感', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/pop-art.jpg', true),

(gen_random_uuid(), '蒸汽朋克', 'steampunk', '将这张图片转换为蒸汽朋克风格，机械元素，复古工业感，铜色金属质感', 'https://res.cloudinary.com/your-cloud/image/upload/v1/styles/steampunk.jpg', true);

-- 创建默认测试用户（可选）
INSERT INTO users (id, username, password, email) VALUES
(gen_random_uuid(), 'testuser', '$2b$10$XY1Z.abc123def456ghi789jklmnopqrstuvwxyz', 'test@example.com'),
(gen_random_uuid(), 'admin', '$2b$10$ABC.def123ghi456jkl789mnopqrstuvwxyz123456', 'admin@example.com');

-- 显示初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '✅ 数据库初始化完成！';
    RAISE NOTICE '📊 创建的表: users, avatars, frames, text_to_image_history, ai_generated_images, ai_styles, task_status, shares';
    RAISE NOTICE '🖼️ 预设头像框数量: %', (SELECT COUNT(*) FROM frames WHERE is_preset = true);
    RAISE NOTICE '🎨 AI风格数量: %', (SELECT COUNT(*) FROM ai_styles WHERE is_active = true);
    RAISE NOTICE '👤 测试用户数量: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '🔧 请记得更新Cloudinary URL为真实地址！';
END $$;
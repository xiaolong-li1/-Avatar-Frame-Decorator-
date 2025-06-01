from PIL import Image, ImageDraw
import numpy as np
import sys
import io
import os
import json

def create_circular_mask(size):
    """创建一个圆形蒙版"""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    return mask

def apply_frame(avatar_path, frame_path, output_path, opacity=0.8):
    """
    应用头像框并裁剪为圆形
    
    参数:
    avatar_path: 头像文件路径
    frame_path: 头像框文件路径
    output_path: 输出文件路径
    opacity: 透明度 (0-1)
    """
    try:
        # 打开图像
        avatar = Image.open(avatar_path).convert("RGBA")
        frame = Image.open(frame_path).convert("RGBA")
        
        # 打印尺寸信息
        print(f"原始头像尺寸: {avatar.width}x{avatar.height}")
        print(f"原始头像框尺寸: {frame.width}x{frame.height}")
        
        # 计算方形裁剪区域
        square_size = min(avatar.width, avatar.height)
        left = (avatar.width - square_size) // 2
        top = (avatar.height - square_size) // 2
        
        # 裁剪头像为正方形
        avatar_square = avatar.crop((left, top, left + square_size, top + square_size))
        print(f"裁剪为正方形: {square_size}x{square_size}")
        
        # 限制处理尺寸
        max_size = 1200
        process_size = square_size
        if square_size > max_size:
            process_size = max_size
            print(f"图像缩放处理: {square_size} -> {process_size}")
            avatar_square = avatar_square.resize((process_size, process_size), Image.LANCZOS)
        
        # 调整头像框尺寸
        frame_resized = frame.resize((process_size, process_size), Image.LANCZOS)
        print(f"调整头像框尺寸为: {process_size}x{process_size}")
        
        # 调整透明度
        frame_array = np.array(frame_resized)
        frame_array[..., 3] = (frame_array[..., 3] * opacity).astype(np.uint8)
        frame_resized = Image.fromarray(frame_array)
        
        # 合成图像
        result = Image.alpha_composite(avatar_square, frame_resized)
        
        # 创建圆形蒙版并应用
        mask = create_circular_mask(process_size)
        result.putalpha(mask)
        
        # 如果原图很大，可以选择性地恢复一些分辨率
        if square_size > max_size:
            output_size = min(square_size, 2000)
            print(f"将结果放大到: {output_size}x{output_size}")
            result = result.resize((output_size, output_size), Image.LANCZOS)
        
        # 保存结果
        result.save(output_path)
        print(f"处理完成，结果已保存到: {output_path}")
        return True
    except Exception as e:
        print(f"处理失败: {str(e)}")
        return False

# 如果直接运行此脚本
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("用法: python process_image.py <头像路径> <头像框路径> <输出路径> [透明度]")
        sys.exit(1)
    
    avatar_path = sys.argv[1]
    frame_path = sys.argv[2]
    output_path = sys.argv[3]
    opacity = float(sys.argv[4]) if len(sys.argv) > 4 else 0.8
    
    success = apply_frame(avatar_path, frame_path, output_path, opacity)
    result = {"success": success, "outputPath": output_path if success else None}
    print(json.dumps(result))
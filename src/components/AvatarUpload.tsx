import React, { useState } from 'react';
import { Upload, message, Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { api } from '../services/api'; // 确保路径正确，指向你的 api 服务

const { Dragger } = Upload;

interface AvatarData {
  fileId: string;
  url: string;
}

interface AvatarUploadProps {
  onImageChange: (data: AvatarData) => void;
  accept?: string;
  maxSize?: number; // MB
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onImageChange,
  accept = 'image/*',
  maxSize = 5,
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'avatar',
    multiple: false,
    accept,
    showUploadList: false,
    beforeUpload: async (file) => {
      // 检查文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }

      // 检查文件大小
      const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
      if (!isLtMaxSize) {
        message.error(`图片大小不能超过 ${maxSize}MB!`);
        return false;
      }

      // 上传文件到后端
      setUploading(true);
      try {
        const response: any = await api.uploadAvatar(file);
        const { fileId, originalUrl } = response.data; // 根据 UploadResponse 结构提取字段
        onImageChange({ fileId, url: originalUrl });
        message.success('头像上传成功！');
      } catch (error) {
        console.error('头像上传失败:', error);
        message.error('头像上传失败，请稍后重试');
      } finally {
        setUploading(false);
      }
    },
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <Dragger {...uploadProps} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
        <p className="ant-upload-hint">
          支持 JPG、PNG、WebP 格式，文件大小不超过 {maxSize}MB
        </p>
      </Dragger>

      {uploading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin tip="上传中..." />
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
import React, { useState } from 'react';
import { Upload, message } from 'antd';
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
        const response = await api.uploadAvatar(file);
        const { fileId, originalUrl } = response.data; // 根据 UploadResponse 结构提取字段
        onImageChange({ fileId, url: originalUrl });
        message.success('头像上传成功！');
      } catch (error) {
        console.error('头像上传失败:', error);
        message.error('头像上传失败，请稍后重试');
      } finally {
        setUploading(false);
      }

      return false; // 阻止默认上传
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Dragger {...uploadProps} style={{ padding: '20px' }} disabled={uploading}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
      <p className="ant-upload-hint">
        支持 JPG、PNG、WebP 格式，文件大小不超过 {maxSize}MB
      </p>
    </Dragger>
  );
};

export default AvatarUpload;
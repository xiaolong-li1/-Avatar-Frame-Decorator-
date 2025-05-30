import React, { useState } from 'react'
import { Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

const { Dragger } = Upload

interface AvatarUploadProps {
  onImageChange: (imageUrl: string) => void
  accept?: string
  maxSize?: number // MB
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onImageChange,
  accept = 'image/*',
  maxSize = 5
}) => {
  const [uploading, setUploading] = useState(false)

  const uploadProps: UploadProps = {
    name: 'avatar',
    multiple: false,
    accept,
    showUploadList: false,
    beforeUpload: (file) => {
      // 检查文件类型
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return false
      }

      // 检查文件大小
      const isLtMaxSize = file.size / 1024 / 1024 < maxSize
      if (!isLtMaxSize) {
        message.error(`图片大小不能超过 ${maxSize}MB!`)
        return false
      }

      // 转换为base64预览
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageChange(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)

      return false // 阻止自动上传
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
  }

  return (
    <Dragger {...uploadProps} style={{ padding: '20px' }}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
      <p className="ant-upload-hint">
        支持 JPG、PNG、WebP 格式，文件大小不超过 {maxSize}MB
      </p>
    </Dragger>
  )
}

export default AvatarUpload 
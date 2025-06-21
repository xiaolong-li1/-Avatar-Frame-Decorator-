import React from 'react'
import { Badge, Popover, List, Typography, Progress, Button, Space } from 'antd'
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAITask, AITask, AITaskType } from '../contexts/AITaskContext'

const { Text } = Typography

const AITaskIndicator: React.FC = () => {
  const { tasks, removeTask } = useAITask()

  // 只显示未完成的任务
  const activeTasks = tasks.filter(task => 
    task.status === 'processing' || task.status === 'pending'
  )

  // 任务类型中文映射
  const taskTypeMap: Record<AITaskType, string> = {
    'super-resolution': '超分辨率',
    'style-transfer': '风格迁移',
    'text-to-image': '文生图',
    'background-blur': '背景虚化',
    'dynamic-effects': '动态特效'
  }

  // 获取任务状态图标
  const getStatusIcon = (status: AITask['status']) => {
    switch (status) {
      case 'pending':
        return <LoadingOutlined style={{ color: '#1890ff' }} />
      case 'processing':
        return <LoadingOutlined style={{ color: '#52c41a' }} spin />
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return null
    }
  }

  // 格式化经过时间
  const formatElapsedTime = (startTime: number) => {
    const elapsed = Date.now() - startTime
    const seconds = Math.floor(elapsed / 1000)
    
    if (seconds < 60) {
      return `${seconds}秒`
    } else {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}分${seconds % 60}秒`
    }
  }

  const content = (
    <div style={{ width: 320 }}>
      <Text strong style={{ marginBottom: 8, display: 'block' }}>
        AI处理任务 ({activeTasks.length})
      </Text>
      
      {activeTasks.length === 0 ? (
        <Text type="secondary">暂无进行中的任务</Text>
      ) : (
        <List
          size="small"
          dataSource={activeTasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                <Button
                  key="remove"
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeTask(task.id)}
                  danger
                >
                  移除
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(task.status)}
                title={
                  <Space>
                    <Text>{taskTypeMap[task.type]}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatElapsedTime(task.startTime)}
                    </Text>
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {task.status === 'pending' && '等待处理...'}
                      {task.status === 'processing' && '正在处理...'}
                    </Text>
                    {task.progress !== undefined && (
                      <Progress
                        percent={task.progress}
                        size="small"
                        style={{ marginTop: 4 }}
                        showInfo={false}
                      />
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  if (activeTasks.length === 0) {
    return null
  }

  return (
    <Popover
      content={content}
      title={null}
      trigger="hover"
      placement="bottomRight"
    >
      <Badge count={activeTasks.length} size="small">
        <LoadingOutlined 
          spin 
          style={{ 
            fontSize: 16, 
            color: '#1890ff',
            cursor: 'pointer'
          }} 
        />
      </Badge>
    </Popover>
  )
}

export default AITaskIndicator 
import React, { useState, useEffect } from 'react';
import { Card, Typography, Tabs, List, Button, Image, message, Tag, Space, Pagination, Empty, Modal } from 'antd';
import { DownloadOutlined, ShareAltOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { api, handleApiError } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

interface HistoryRecord {
  id: string;
  task_type: string;
  input_prompt: string;
  result_url: string;
  model_used: string;
  parameters: any;
  created_at: string;
  status: string;
}

interface HistoryData {
  records: HistoryRecord[];
  total: number;
  page: number;
  totalPages: number;
}

// 定义API响应的联合类型
interface ApiHistoryResponse {
  records: HistoryRecord[];
  total: number;
  page: number;
  totalPages?: number;
  limit?: number;
}

const AIHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [historyData, setHistoryData] = useState<{ [key: string]: HistoryData }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({});

  // 历史记录类型配置
  const historyTypes = [
    { key: 'all', label: '全部记录' },
    { key: 'super-resolution', label: '超分辨率' },
    { key: 'style-transfer', label: '风格迁移' },
    { key: 'background-blur', label: '背景模糊' },
    { key: 'background-replace', label: '背景替换' },
    { key: 'text-to-image', label: '文本生成图像' }
  ];

  // 调用对应的API
  const callHistoryAPI = async (type: string, page: number, limit: number) => {
    switch (type) {
      case 'all':
        return await api.getAIHistory(undefined, page, limit);
      case 'super-resolution':
        return await api.getSuperResolutionHistory(page, limit);
      case 'style-transfer':
        return await api.getStyleTransferHistory(page, limit);
      case 'background-blur':
        return await api.getBackgroundBlurHistory(page, limit);
      case 'background-replace':
        return await api.getBackgroundReplaceHistory(page, limit);
      case 'text-to-image':
        return await api.getTextToImageHistory(page, limit);
      default:
        throw new Error(`未知的历史记录类型: ${type}`);
    }
  };

  // 标准化API响应数据
  const normalizeHistoryData = (data: ApiHistoryResponse, currentPage: number): HistoryData => {
    const limit = data.limit || 10;
    const totalPages = data.totalPages || Math.ceil(data.total / limit);
    
    return {
      records: data.records || [],
      total: data.total || 0,
      page: data.page || currentPage,
      totalPages: totalPages
    };
  };

  // 加载历史记录
  const loadHistory = async (type: string, page: number = 1) => {
    const typeConfig = historyTypes.find(t => t.key === type);
    if (!typeConfig) return;

    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      const response = await callHistoryAPI(type, page, 10);
      
      if (response.success && response.data) {
        // 标准化数据结构
        const normalizedData = normalizeHistoryData(response.data, page);
        setHistoryData(prev => ({ ...prev, [type]: normalizedData }));
        setCurrentPage(prev => ({ ...prev, [type]: page }));
      } else {
        // 如果API返回失败，设置空数据
        const emptyData: HistoryData = {
          records: [],
          total: 0,
          page: 1,
          totalPages: 0
        };
        setHistoryData(prev => ({ ...prev, [type]: emptyData }));
      }
    } catch (error: any) {
      console.error(`加载${typeConfig.label}历史记录失败:`, error);
      
      // 如果是404错误，说明该功能暂未实现，显示空数据而不是错误
      if (error.message?.includes('404')) {
        console.warn(`${typeConfig.label}历史记录接口暂未实现`);
        const emptyData: HistoryData = {
          records: [],
          total: 0,
          page: 1,
          totalPages: 0
        };
        setHistoryData(prev => ({ ...prev, [type]: emptyData }));
      } else {
        message.error(`加载${typeConfig.label}历史记录失败`);
      }
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // 初始加载
  useEffect(() => {
    loadHistory(activeTab);
  }, [activeTab]);

  // 处理标签切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!historyData[key]) {
      loadHistory(key);
    }
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    loadHistory(activeTab, page);
  };

  // 下载图片
  const handleDownload = async (record: HistoryRecord) => {
    try {
      const response = await fetch(record.result_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-${record.task_type}-${record.id}-${Date.now()}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      message.success('图片下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  // 分享图片
  const handleShare = async (record: HistoryRecord) => {
    try {
      const response = await api.createShare(record.result_url, 'wechat', {
        resultFileId: record.result_url,
        description: `我的AI处理结果 - ${getTaskTypeLabel(record.task_type)}`
      });
      
      if (response.success && response.data) {
        message.success('分享链接创建成功');
      }
    } catch (error) {
      console.error('分享失败:', error);
      handleApiError(error);
    }
  };

  // 删除单个记录
  const handleDeleteRecord = async (record: HistoryRecord) => {
    confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.deleteAIRecord(record.id);
          if (response.success) {
            message.success('记录删除成功');
            // 重新加载当前页面数据
            loadHistory(activeTab, currentPage[activeTab] || 1);
          }
        } catch (error) {
          console.error('删除记录失败:', error);
          handleApiError(error);
        }
      }
    });
  };

  // 批量删除记录
  const handleBatchDelete = async (recordIds: string[]) => {
    if (recordIds.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }

    confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${recordIds.length} 条记录吗？删除后无法恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.deleteMultipleAIRecords(recordIds);
          if (response.success) {
            message.success(`成功删除 ${response.data.deletedCount} 条记录`);
            // 重新加载当前页面数据
            loadHistory(activeTab, currentPage[activeTab] || 1);
          }
        } catch (error) {
          console.error('批量删除失败:', error);
          handleApiError(error);
        }
      }
    });
  };

  // 删除所有记录
  const handleDeleteAll = async () => {
    const taskType = activeTab === 'all' ? undefined : activeTab;
    const typeName = historyTypes.find(t => t.key === activeTab)?.label || '全部';

    confirm({
      title: '删除所有记录',
      content: `确定要删除所有${typeName}记录吗？此操作无法恢复！`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.deleteAllAIRecords(taskType);
          if (response.success) {
            message.success(`成功删除 ${response.data.deletedCount} 条记录`);
            // 重新加载当前页面数据
            loadHistory(activeTab, 1);
          }
        } catch (error) {
          console.error('删除所有记录失败:', error);
          handleApiError(error);
        }
      }
    });
  };

  // 获取任务类型标签
  const getTaskTypeLabel = (taskType: string) => {
    const typeMap: { [key: string]: string } = {
      'super_resolution': '超分辨率',
      'style-transfer': '风格迁移', 
      'background_blur': '背景模糊',
      'background-replace': '背景替换',
      'text-to-image': '文本生成图像'
    };
    return typeMap[taskType] || taskType;
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'completed': 'success',
      'processing': 'processing',
      'failed': 'error',
      'pending': 'default'
    };
    return colorMap[status] || 'default';
  };

  // 渲染历史记录项
  const renderHistoryItem = (record: HistoryRecord) => (
    <List.Item
      key={record.id}
      actions={[
        <Button 
          key="preview"
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => window.open(record.result_url, '_blank')}
        >
          预览
        </Button>,
        <Button 
          key="download"
          type="text" 
          icon={<DownloadOutlined />} 
          onClick={() => handleDownload(record)}
        >
          下载
        </Button>,
        <Button 
          key="share"
          type="text" 
          icon={<ShareAltOutlined />} 
          onClick={() => handleShare(record)}
        >
          分享
        </Button>,
        <Button 
          key="delete"
          type="text" 
          danger
          icon={<DeleteOutlined />} 
          onClick={() => handleDeleteRecord(record)}
        >
          删除
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={
          <Image
            width={80}
            height={80}
            src={record.result_url}
            style={{ borderRadius: '8px' }}
            placeholder
          />
        }
        title={
          <Space>
            <Text strong>{getTaskTypeLabel(record.task_type)}</Text>
            <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
          </Space>
        }
        description={
          <div>
            <Paragraph 
              ellipsis={{ rows: 2 }} 
              style={{ margin: 0, color: '#666' }}
            >
              {record.input_prompt || '无描述'}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              创建时间: {new Date(record.created_at).toLocaleString()}
            </Text>
            {record.parameters && (
              <div style={{ marginTop: '4px' }}>
                {Object.entries(record.parameters).map(([key, value]) => (
                  <Tag key={key} style={{ fontSize: '10px' }}>
                    {key}: {String(value)}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        }
      />
    </List.Item>
  );

  // 渲染历史记录列表
  const renderHistoryList = (type: string) => {
    const data = historyData[type];
    const isLoading = loading[type];
    const page = currentPage[type] || 1;

    if (isLoading) {
      return <List loading />;
    }

    if (!data || data.records.length === 0) {
      return (
        <Empty 
          description="暂无历史记录" 
          style={{ padding: '40px 0' }}
        />
      );
    }

    return (
      <>
        {/* 批量操作按钮 */}
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Space>
            <Button 
              danger 
              onClick={handleDeleteAll}
              disabled={data.records.length === 0}
            >
              删除所有记录
            </Button>
          </Space>
        </div>

        <List
          itemLayout="horizontal"
          dataSource={data.records}
          renderItem={renderHistoryItem}
        />
        {data.totalPages > 1 && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={10}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
              }
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fade-in-up">
      <Title level={2} style={{ marginBottom: '8px' }}>
        AI处理历史
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        查看您的所有AI图像处理历史记录，支持预览、下载和分享
      </Paragraph>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
        >
          {historyTypes.map(type => (
            <TabPane tab={type.label} key={type.key}>
              {renderHistoryList(type.key)}
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default AIHistory;
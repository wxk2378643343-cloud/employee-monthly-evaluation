import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Avatar, Button, Empty, Spin, Pagination, Space } from 'antd';
import {
  EditOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  WarningOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/store';
import { markAllRead, fetchUnreadCount } from '@/store/remindSlice';
import * as remindApi from '@/api/remind';
import type { Remind } from '@/types';
import { RemindType } from '@/types';

const remindTypeConfig: Record<
  RemindType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  [RemindType.PENDING]: { icon: <EditOutlined />, color: '#1890ff', label: '待评价' },
  [RemindType.DEADLINE]: { icon: <ClockCircleOutlined />, color: '#faad14', label: '即将截止' },
  [RemindType.VOTE]: { icon: <CheckSquareOutlined />, color: '#722ed1', label: '投票' },
  [RemindType.WARNING]: { icon: <WarningOutlined />, color: '#f5222d', label: '预警' },
};

const RemindList: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [reminds, setReminds] = useState<Remind[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadReminds();
  }, [pageNum]);

  const loadReminds = async () => {
    setLoading(true);
    try {
      const data = await remindApi.getRemindList({ pageNum, pageSize });
      setReminds(data.list);
      setTotal(data.total);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await remindApi.markRead(id);
      loadReminds();
      dispatch(fetchUnreadCount());
    } catch {
      // 忽略
    }
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead());
    loadReminds();
  };

  return (
    <Card
      title="消息中心"
      extra={
        <Button type="link" onClick={handleMarkAllRead}>
          全部已读
        </Button>
      }
    >
      <Spin spinning={loading}>
        {reminds.length > 0 ? (
          <>
            <List
              itemLayout="horizontal"
              dataSource={reminds}
              renderItem={(item) => {
                const config = remindTypeConfig[item.remindType as RemindType];
                return (
                  <List.Item
                    actions={
                      !item.isRead
                        ? [
                            <Button
                              key="read"
                              type="link"
                              icon={<CheckOutlined />}
                              onClick={() => handleMarkRead(item.id)}
                            >
                              标记已读
                            </Button>,
                          ]
                        : []
                    }
                    style={{
                      background: item.isRead ? 'transparent' : '#f6ffed',
                      padding: '12px 16px',
                      marginBottom: 8,
                      borderRadius: 4,
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={config?.icon}
                          style={{ backgroundColor: config?.color }}
                        />
                      }
                      title={
                        <Space>
                          <Tag color={config?.color}>{config?.label}</Tag>
                          {!item.isRead && <Tag color="green">未读</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>{item.remindContent}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>{item.createTime}</div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Pagination
                current={pageNum}
                total={total}
                pageSize={pageSize}
                onChange={setPageNum}
                showTotal={(total) => `共 ${total} 条消息`}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无消息" />
        )}
      </Spin>
    </Card>
  );
};

export default RemindList;

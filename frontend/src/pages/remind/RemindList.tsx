import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Avatar, Button, Empty, Spin, Pagination, Space, Grid } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useAppDispatch } from '@/store';
import { markAllRead, fetchUnreadCount } from '@/store/remindSlice';
import * as remindApi from '@/api/remind';
import { Remind } from '@/types';

const RemindList: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [reminds, setReminds] = useState<Remind[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 10;

  const loadReminds = async () => {
    setLoading(true);
    try {
      const data = await remindApi.getRemindList({ pageNum, pageSize });
      setReminds(data.list);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminds();
  }, [pageNum]);

  const handleMarkRead = async (id: number) => {
    await remindApi.markRead(id);
    await loadReminds();
    dispatch(fetchUnreadCount());
  };

  return (
    <Card
      title="消息中心"
      extra={<Button type="link" onClick={() => dispatch(markAllRead()).then(() => loadReminds())}>全部已读</Button>}
    >
      <Spin spinning={loading}>
        {reminds.length > 0 ? (
          <>
            <List
              itemLayout={isMobile ? 'vertical' : 'horizontal'}
              className={isMobile ? 'remind-list-mobile' : ''}
              dataSource={reminds}
              renderItem={(item) => (
                <List.Item
                  className={`${isMobile ? 'remind-list-mobile-item ' : ''}${!item.isRead ? 'remind-item--unread' : ''}`}
                  actions={
                    !item.isRead
                      ? [<Button key="read" type="link" size={isMobile ? 'small' : 'middle'} icon={<CheckOutlined />} onClick={() => handleMarkRead(item.id)}>标记已读</Button>]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} />}
                    title={
                      <Space size={8}>
                        {!item.isRead && <span className="remind-unread-dot" />}
                        <Tag>{item.remindType}</Tag>
                        {!item.isRead && <Tag color="green">未读</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <div className={!item.isRead ? 'remind-content remind-content--unread' : 'remind-content'}>{item.remindContent}</div>
                        <div>{item.createTime}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div style={{ textAlign: isMobile ? 'center' : 'right', marginTop: 16 }}>
              <Pagination
                current={pageNum}
                total={total}
                pageSize={pageSize}
                onChange={setPageNum}
                size={isMobile ? 'small' : 'default'}
                simple={isMobile}
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

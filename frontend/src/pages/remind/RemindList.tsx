import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Avatar, Button, Empty, Spin, Pagination, Space, Grid } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { markAllRead, fetchUnreadCount } from '@/store/remindSlice';
import * as remindApi from '@/api/remind';
import { Remind } from '@/types';

const REMIND_TYPE_LABEL: Record<string, string> = {
  SCORE: '评分提醒',
  VOTE: '投票提醒',
};

const RemindList: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reminds, setReminds] = useState<Remind[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 10;

  const loadReminds = async () => {
    setLoading(true);
    try {
      const [data, unread] = await Promise.all([
        remindApi.getRemindList({ pageNum, pageSize }),
        remindApi.getUnreadCount(),
      ]);
      setReminds(data.list);
      setTotal(data.total);
      setUnreadCount(unread);
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

  const handleMarkUnread = async (id: number) => {
    await remindApi.markUnread(id);
    await loadReminds();
    dispatch(fetchUnreadCount());
  };

  const handleGoto = async (item: Remind) => {
    if (!item.isRead) {
      await remindApi.markRead(item.id);
      dispatch(fetchUnreadCount());
    }
    if (item.remindType === 'VOTE') {
      navigate(item.periodId ? `/vote/list?periodId=${item.periodId}` : '/vote/list');
      return;
    }
    navigate(item.periodId ? `/score/pending?periodId=${item.periodId}` : '/score/pending');
  };

  return (
    <Card
      title="消息中心"
      className="remind-center-card"
      extra={
        <Button
          className="remind-center-read-all-btn"
          type="primary"
          ghost
          disabled={unreadCount === 0}
          onClick={() => dispatch(markAllRead()).then(() => loadReminds())}
        >
          全部已读
        </Button>
      }
    >
      <Spin spinning={loading}>
        {reminds.length > 0 ? (
          <>
            <List
              itemLayout={isMobile ? 'vertical' : 'horizontal'}
              className={`remind-center-list ${isMobile ? 'remind-list-mobile' : ''}`}
              dataSource={reminds}
              renderItem={(item) => (
                <List.Item
                  className={`remind-center-item ${isMobile ? 'remind-list-mobile-item ' : ''}${!item.isRead ? 'remind-item--unread' : ''}`}
                  actions={[
                    ...(!item.isRead
                      ? [
                          <Button
                            key="read"
                            type="link"
                            size={isMobile ? 'small' : 'middle'}
                            icon={<CheckOutlined />}
                            onClick={() => handleMarkRead(item.id)}
                          >
                            标记已读
                          </Button>,
                        ]
                      : []),
                    ...(item.isRead
                      ? [
                          <Button key="unread" type="link" size={isMobile ? 'small' : 'middle'} onClick={() => handleMarkUnread(item.id)}>
                            设为未读
                          </Button>,
                        ]
                      : []),
                    <Button key="goto" type="link" size={isMobile ? 'small' : 'middle'} onClick={() => handleGoto(item)}>
                      去处理
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} />}
                    title={
                      <Space size={8}>
                        {!item.isRead && <span className="remind-unread-dot" />}
                        <Tag color={item.remindType === 'VOTE' ? 'geekblue' : 'red'}>{REMIND_TYPE_LABEL[item.remindType] || '消息提醒'}</Tag>
                        {!item.isRead && <Tag color="green">未读</Tag>}
                      </Space>
                    }
                    description={
                      <div className="remind-center-item__desc">
                        <div className={!item.isRead ? 'remind-content remind-content--unread' : 'remind-content'}>{item.remindContent}</div>
                        <div className="remind-time">{item.createTime}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div className={`remind-center-pager ${isMobile ? 'remind-center-pager--mobile' : ''}`}>
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

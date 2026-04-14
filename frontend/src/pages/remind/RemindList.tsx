import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Avatar, Button, Empty, Spin, Pagination, Space, Grid, Modal, Form, Input, Select } from 'antd';
import { BellOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { markAllRead, fetchUnreadCount } from '@/store/remindSlice';
import * as adminApi from '@/api/admin';
import * as remindApi from '@/api/remind';
import { EvalPeriod, Remind, User } from '@/types';
import { hasPermission, PermissionCode } from '@/utils/permission';

const REMIND_TYPE_LABEL: Record<string, string> = {
  SCORE: '评分提醒',
  VOTE: '投票提醒',
  NOTICE: '系统消息',
};

const RemindList: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const canPublish = hasPermission(currentUser, PermissionCode.REMIND_MANAGE);
  const [loading, setLoading] = useState(false);
  const [reminds, setReminds] = useState<Remind[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [publishVisible, setPublishVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [periodOptions, setPeriodOptions] = useState<EvalPeriod[]>([]);
  const [publishForm] = Form.useForm<{ periodId: number; userIds: number[]; content: string }>();
  const pageSize = 10;
  const ALL_USERS_VALUE = -1;

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

  useEffect(() => {
    if (!canPublish || userOptions.length > 0) return;
    Promise.all([adminApi.getUserList(), adminApi.getPeriodList()])
      .then(([users, periods]) => {
        setUserOptions(users);
        setPeriodOptions(periods);
        const latest = [...periods].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          if (a.month !== b.month) return b.month - a.month;
          return b.id - a.id;
        })[0];
        if (latest) {
          publishForm.setFieldValue('periodId', latest.id);
        }
      })
      .catch(() => undefined);
  }, [canPublish, userOptions.length, publishForm]);

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
    if (item.remindType === 'NOTICE') {
      await loadReminds();
      return;
    }
    navigate(item.periodId ? `/score/pending?periodId=${item.periodId}` : '/score/pending');
  };

  const handlePublish = async () => {
    const values = await publishForm.validateFields();
    const allUserIds = userOptions.map((item) => item.id);
    const selectedUserIds = values.userIds.includes(ALL_USERS_VALUE) ? allUserIds : values.userIds;
    setPublishing(true);
    try {
      await remindApi.publishMessage({
        periodId: values.periodId,
        userIds: selectedUserIds,
        content: values.content.trim(),
      });
      setPublishVisible(false);
      publishForm.resetFields();
      await loadReminds();
      dispatch(fetchUnreadCount());
    } finally {
      setPublishing(false);
    }
  };

  const handleUserSelectChange = (value: number[]) => {
    if (value.includes(ALL_USERS_VALUE)) {
      publishForm.setFieldValue('userIds', [ALL_USERS_VALUE]);
      return;
    }
    publishForm.setFieldValue('userIds', value);
  };

  return (
    <Card
      title="消息中心"
      className="remind-center-card"
      extra={
        <Space>
          {canPublish && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishVisible(true)}>
              发布消息
            </Button>
          )}
          <Button
            className="remind-center-read-all-btn"
            type="primary"
            ghost
            disabled={unreadCount === 0}
            onClick={() => dispatch(markAllRead()).then(() => loadReminds())}
          >
            全部已读
          </Button>
        </Space>
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
                      {item.remindType === 'NOTICE' ? '查看消息' : '去处理'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} />}
                    title={
                      <Space size={8}>
                        {!item.isRead && <span className="remind-unread-dot" />}
                        <Tag color={item.remindType === 'VOTE' ? 'geekblue' : item.remindType === 'NOTICE' ? 'gold' : 'red'}>
                          {REMIND_TYPE_LABEL[item.remindType] || '消息提醒'}
                        </Tag>
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

      <Modal
        title="发布消息"
        open={publishVisible}
        onOk={handlePublish}
        okText="发布"
        confirmLoading={publishing}
        onCancel={() => setPublishVisible(false)}
      >
        <Form form={publishForm} layout="vertical">
          <Form.Item name="periodId" label="评价周期" rules={[{ required: true, message: '请选择评价周期' }]}>
            <Select
              placeholder="请选择评价周期"
              options={periodOptions.map((item) => ({
                value: item.id,
                label: item.periodName,
              }))}
            />
          </Form.Item>
          <Form.Item name="userIds" label="接收人" rules={[{ required: true, message: '请选择接收人' }]}>
            <Select
              mode="multiple"
              placeholder="请选择接收人"
              optionFilterProp="label"
              onChange={handleUserSelectChange}
              options={[
                { value: ALL_USERS_VALUE, label: '全部人员' },
                ...userOptions.map((item) => ({
                  value: item.id,
                  label: `${item.realName}${item.phone ? `（${item.phone}）` : ''}`,
                })),
              ]}
            />
          </Form.Item>
          <Form.Item name="content" label="消息内容" rules={[{ required: true, message: '请输入消息内容' }]}>
            <Input.TextArea rows={5} maxLength={500} showCount placeholder="请输入要发布的消息内容" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RemindList;

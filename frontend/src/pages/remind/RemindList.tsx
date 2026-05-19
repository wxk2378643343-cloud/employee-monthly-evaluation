import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Avatar, Button, Empty, Spin, Pagination, Space, Grid, Modal, Form, Input, Select } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { markAllRead, fetchUnreadCount } from '@/store/remindSlice';
import * as adminApi from '@/api/admin';
import * as remindApi from '@/api/remind';
import { Remind, User } from '@/types';
import { hasPermission, PermissionCode } from '@/utils/permission';

const REMIND_TYPE_LABEL: Record<string, string> = {
  SCORE: '评分提醒',
  VOTE: '投票提醒',
  NOTICE: '系统公告',
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
  const [editingNoticeId, setEditingNoticeId] = useState<number>();
  const [publishing, setPublishing] = useState(false);
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [publishForm] = Form.useForm<{ userIds: number[]; content: string }>();
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
    adminApi.getUserList()
      .then((users) => setUserOptions(users))
      .catch(() => undefined);
  }, [canPublish, userOptions.length]);

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
    if (editingNoticeId) {
      const values = await publishForm.validateFields(['content']);
      setPublishing(true);
      try {
        await remindApi.updateNotice(editingNoticeId, { content: values.content.trim() });
        setPublishVisible(false);
        setEditingNoticeId(undefined);
        publishForm.resetFields();
        await loadReminds();
        dispatch(fetchUnreadCount());
      } finally {
        setPublishing(false);
      }
      return;
    }

    const values = await publishForm.validateFields();
    const allUserIds = userOptions.map((item) => item.id);
    const selectedUserIds = values.userIds.includes(ALL_USERS_VALUE) ? allUserIds : values.userIds;
    setPublishing(true);
    try {
      await remindApi.publishMessage({
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

  const handleEditNotice = (item: Remind) => {
    if (!item.noticeId) return;
    setEditingNoticeId(item.noticeId);
    publishForm.setFieldsValue({
      userIds: [],
      content: item.remindContent,
    });
    setPublishVisible(true);
  };

  const handleRecallNotice = (item: Remind) => {
    if (!item.noticeId) return;
    Modal.confirm({
      title: '确认撤回公告？',
      content: '撤回后，接收人的公告通知也会同步撤回。',
      okText: '撤回',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await remindApi.recallNotice(item.noticeId!);
        await loadReminds();
        dispatch(fetchUnreadCount());
      },
    });
  };

  const openPublishModal = () => {
    setEditingNoticeId(undefined);
    publishForm.resetFields();
    setPublishVisible(true);
  };

  const closePublishModal = () => {
    setPublishVisible(false);
    setEditingNoticeId(undefined);
    publishForm.resetFields();
  };

  return (
    <Card
      title="公告中心"
      className="remind-center-card"
      extra={
        <Space>
          {canPublish && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openPublishModal}>
              发布公告
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
                    ...(canPublish && item.remindType === 'NOTICE' && item.noticeId
                      ? [
                          <Button
                            key="editNotice"
                            type="link"
                            size={isMobile ? 'small' : 'middle'}
                            icon={<EditOutlined />}
                            onClick={() => handleEditNotice(item)}
                          >
                            编辑
                          </Button>,
                          <Button
                            key="recallNotice"
                            type="link"
                            danger
                            size={isMobile ? 'small' : 'middle'}
                            icon={<DeleteOutlined />}
                            onClick={() => handleRecallNotice(item)}
                          >
                            撤回
                          </Button>,
                        ]
                      : []),
                    <Button key="goto" type="link" size={isMobile ? 'small' : 'middle'} onClick={() => handleGoto(item)}>
                      {item.remindType === 'NOTICE' ? '查看公告' : '去处理'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} />}
                    title={
                      <Space size={8}>
                        {!item.isRead && <span className="remind-unread-dot" />}
                        <Tag color={item.remindType === 'VOTE' ? 'geekblue' : item.remindType === 'NOTICE' ? 'gold' : 'red'}>
                          {REMIND_TYPE_LABEL[item.remindType] || '公告提醒'}
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
          <Empty description="暂无公告" />
        )}
      </Spin>

      <Modal
        title={editingNoticeId ? '编辑公告' : '发布公告'}
        open={publishVisible}
        onOk={handlePublish}
        okText={editingNoticeId ? '保存' : '发布'}
        confirmLoading={publishing}
        onCancel={closePublishModal}
      >
        <Form form={publishForm} layout="vertical">
          {!editingNoticeId && (
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
          )}
          <Form.Item name="content" label="公告内容" rules={[{ required: true, message: '请输入公告内容' }]}>
            <Input.TextArea rows={5} maxLength={500} showCount placeholder="请输入要发布的公告内容" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RemindList;

import React from 'react';
import { App as AntdApp } from 'antd';
import { setMessageApi } from '@/utils/message';

const MessageBridge: React.FC = () => {
  const { message } = AntdApp.useApp();

  React.useEffect(() => {
    setMessageApi(message);
  }, [message]);

  return null;
};

export default MessageBridge;

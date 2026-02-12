import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

export function setMessageApi(api: MessageInstance) {
  messageApi = api;
}

export const message = {
  success(content: any) {
    messageApi?.success(content);
  },
  error(content: any) {
    messageApi?.error(content);
  },
  warning(content: any) {
    messageApi?.warning(content);
  },
  info(content: any) {
    messageApi?.info(content);
  },
};

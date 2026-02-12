import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { App as AntdApp } from 'antd';
import { store } from '@/store';
import MessageBridge from '@/components/MessageBridge';
import App from './App';
import './index.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AntdApp>
      <MessageBridge />
      <Provider store={store}>
        <App />
      </Provider>
    </AntdApp>
  </React.StrictMode>
);

import React, { useState } from 'react';
import { Alert, Button, Card, Space, Table, Typography, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { InboxOutlined } from '@ant-design/icons';
import * as adminApi from '@/api/admin';
import { UserImportResult } from '@/types';
import { message } from '@/utils/message';

const { Dragger } = Upload;
const { Paragraph, Text } = Typography;

const UserImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UserImportResult | null>(null);

  const uploadProps: UploadProps = {
    maxCount: 1,
    accept: '.xlsx,.xls',
    fileList,
    beforeUpload: (file) => {
      setFileList([file]);
      setSelectedFile(file);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setSelectedFile(null);
      return true;
    },
  };

  const handleImport = async () => {
    if (!selectedFile) {
      message.warning('请先选择 Excel 文件');
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi.importUsersByExcel(selectedFile);
      setResult(data);
      message.success('导入执行完成');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="人员 Excel 导入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Paragraph style={{ marginBottom: 0 }}>
            <Text strong>模板要求：</Text>
            使用
            <a href="/人员导入模板.xlsx" download style={{ margin: '0 4px' }}>
              人员导入模板.xlsx
            </a>
            ，按列填写“部门、网格、姓名、用户名(工号)、角色、手机号”。
          </Paragraph>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            角色映射：普通员工=EMPLOYEE，网格负责人=GROUP_LEADER，分管领导=DEPT_LEADER，单位领导/领导=LEADER，系统管理员=SYS_ADMIN。
          </Paragraph>

          <Dragger {...uploadProps} disabled={loading}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到这里上传</p>
            <p className="ant-upload-hint">仅支持 .xlsx/.xls</p>
          </Dragger>

          <Button type="primary" onClick={handleImport} loading={loading}>
            开始导入
          </Button>
        </Space>
      </Card>

      {result && (
        <Card title="导入结果">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={result.failedCount > 0 ? 'warning' : 'success'}
              showIcon
              message={`总计 ${result.totalRows} 行，成功 ${result.successCount} 行（新增 ${result.createdCount}，更新 ${result.updatedCount}），失败 ${result.failedCount} 行`}
            />
            <Table
              size="small"
              rowKey={(row) => `${row.index}-${row.error}`}
              pagination={{ pageSize: 10 }}
              dataSource={result.errors.map((error, index) => ({ index: index + 1, error }))}
              columns={[
                { title: '序号', dataIndex: 'index', width: 100 },
                { title: '失败原因', dataIndex: 'error' },
              ]}
            />
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default UserImport;

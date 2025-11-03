import React from 'react';
import { Upload, message, Button } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import AV from '../config/leancloud';

const { Dragger } = Upload;

const CloudUpload = ({ 
  onUploadSuccess, 
  onFileRemove, 
  uploadedFiles = [],
  maxFiles = 10,
  folder = 'general',
  listType = 'picture',
  dragger = true,
  ...props 
}) => {

  const customRequest = async ({ file, onProgress, onSuccess: antOnSuccess, onError }) => {
    try {
      // Validate file before upload
      if (!file) {
        throw new Error('无效的文件对象');
      }

      const leanFile = new AV.File(file.name, file);
      
      const savedFile = await leanFile.save({
        onprogress: (e) => {
          if (e.percent) {
            onProgress({ percent: e.percent });
          }
        },
      });

      // Validate saved file has required properties
      if (!savedFile || !savedFile.id || !savedFile.url() || !savedFile.name()) {
        throw new Error('文件上传返回数据不完整');
      }

      const fileData = {
        uid: savedFile.id,
        name: savedFile.name(),
        status: 'done',
        url: savedFile.url(),
        objectId: savedFile.id // LeanCloud object ID, useful for deletion
      };
      
      // Call the parent component's onUploadSuccess callback
      if (onUploadSuccess) {
        onUploadSuccess(fileData);
      }

      // Tell Ant Design Upload component that upload is successful
      antOnSuccess(fileData);
      
      message.success(`${file.name} 上传成功`);

    } catch (error) {
      console.error('❌ 文件上传失败:', error);
      message.error(`${file.name} 上传失败: ${error.message || '未知错误'}`);
      onError(error);
    }
  };

  const handleRemove = (file) => {
    if (onFileRemove) {
      onFileRemove(file);
    }
    return true;
  };

  const uploadProps = {
    customRequest,
    onRemove: handleRemove,
    fileList: uploadedFiles,
    listType,
    multiple: true,
    maxCount: maxFiles,
    ...props
  };

  if (dragger) {
    return (
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持单个或批量上传，最多 {maxFiles} 个文件
        </p>
      </Dragger>
    );
  }

  return (
    <Upload {...uploadProps}>
      {props.children || (
        <Button icon={<UploadOutlined />}>点击上传</Button>
      )}
    </Upload>
  );
};

export default CloudUpload;


import React from 'react';
import { Upload, message } from 'antd';
import AV from '../config/leancloud';

const CloudUpload = ({ onSuccess, onRemove, folder = 'general', ...props }) => {

  const customRequest = async ({ file, onProgress, onSuccess: antOnSuccess, onError }) => {
    try {
      const leanFile = new AV.File(file.name, file);
      
      const savedFile = await leanFile.save({
        onprogress: (e) => {
          if (e.percent) {
            onProgress({ percent: e.percent });
          }
        },
      });

      const fileData = {
        name: savedFile.name(),
        url: savedFile.url(),
        objectId: savedFile.id // LeanCloud object ID, useful for deletion
      };
      
      // Call the parent component's onSuccess callback
      if (onSuccess) {
        onSuccess(fileData);
      }

      // Tell Ant Design Upload component that upload is successful
      antOnSuccess(fileData);
      
      message.success(`${file.name} file uploaded successfully.`);

    } catch (error) {
      console.error('Upload failed:', error);
      message.error(`${file.name} file upload failed.`);
      onError(error);
    }
  };

  return (
    <Upload
      customRequest={customRequest}
      onRemove={onRemove}
      {...props}
    >
      {props.children}
    </Upload>
  );
};

export default CloudUpload;


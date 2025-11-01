/**
 * 文件上传工具函数 - LeanCloud集成
 * 用于合同文件、项目文件等的上传
 */

import axios from 'axios';

// LeanCloud配置
const LEANCLOUD_APP_ID = import.meta.env.VITE_LEANCLOUD_APP_ID || '';
const LEANCLOUD_APP_KEY = import.meta.env.VITE_LEANCLOUD_APP_KEY || '';
const LEANCLOUD_SERVER_URL = import.meta.env.VITE_LEANCLOUD_SERVER_URL || 'https://api.leancloud.cn';

/**
 * 上传文件到LeanCloud
 * @param {File} file - 要上传的文件对象
 * @param {string} folder - 文件夹名称（可选）
 * @returns {Promise<Object>} 返回文件信息对象
 */
export const uploadFileToLeanCloud = async (file, folder = 'contracts') => {
  try {
    // 如果没有配置LeanCloud，使用模拟上传（开发环境）
    if (!LEANCLOUD_APP_ID || !LEANCLOUD_APP_KEY) {
      console.warn('LeanCloud未配置，使用模拟上传');
      return mockFileUpload(file, folder);
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);

    // 上传到LeanCloud
    const response = await axios.post(
      `${LEANCLOUD_SERVER_URL}/1.1/files/${file.name}`,
      formData,
      {
        headers: {
          'X-LC-Id': LEANCLOUD_APP_ID,
          'X-LC-Key': LEANCLOUD_APP_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // 返回文件信息
    return {
      file_name: file.name,
      file_url: response.data.url,
      objectId: response.data.objectId,
      file_size: file.size,
      file_type: file.type,
      uploaded_at: new Date()
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    throw new Error('文件上传失败: ' + (error.response?.data?.error || error.message));
  }
};

/**
 * 模拟文件上传（开发环境使用）
 * @param {File} file - 要上传的文件对象
 * @param {string} folder - 文件夹名称
 * @returns {Promise<Object>} 返回模拟的文件信息
 */
const mockFileUpload = async (file, folder) => {
  // 模拟上传延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 创建本地URL（仅用于预览）
  const localUrl = URL.createObjectURL(file);

  return {
    file_name: file.name,
    file_url: localUrl,
    objectId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file_size: file.size,
    file_type: file.type,
    uploaded_at: new Date(),
    _isMock: true // 标记为模拟数据
  };
};

/**
 * 从LeanCloud删除文件
 * @param {string} objectId - LeanCloud文件对象ID
 * @returns {Promise<void>}
 */
export const deleteFileFromLeanCloud = async (objectId) => {
  try {
    // 如果是模拟文件，直接返回
    if (objectId.startsWith('mock_')) {
      console.warn('模拟文件，无需删除');
      return;
    }

    if (!LEANCLOUD_APP_ID || !LEANCLOUD_APP_KEY) {
      console.warn('LeanCloud未配置，跳过删除');
      return;
    }

    await axios.delete(
      `${LEANCLOUD_SERVER_URL}/1.1/files/${objectId}`,
      {
        headers: {
          'X-LC-Id': LEANCLOUD_APP_ID,
          'X-LC-Key': LEANCLOUD_APP_KEY
        }
      }
    );

  } catch (error) {
    console.error('文件删除失败:', error);
    // 删除失败不抛出错误，避免影响主流程
  }
};

/**
 * 下载文件
 * @param {string} fileUrl - 文件URL
 * @param {string} fileName - 文件名
 */
export const downloadFile = (fileUrl, fileName) => {
  try {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('文件下载失败:', error);
    // 如果下载失败，尝试在新窗口打开
    window.open(fileUrl, '_blank');
  }
};

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {string[]} allowedTypes - 允许的文件类型数组
 * @returns {boolean}
 */
export const validateFileType = (file, allowedTypes = ['.pdf', '.doc', '.docx']) => {
  const fileName = file.name.toLowerCase();
  return allowedTypes.some(type => fileName.endsWith(type));
};

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSizeMB - 最大文件大小（MB）
 * @returns {boolean}
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default {
  uploadFileToLeanCloud,
  deleteFileFromLeanCloud,
  downloadFile,
  validateFileType,
  validateFileSize,
  formatFileSize
};


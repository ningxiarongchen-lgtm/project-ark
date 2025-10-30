const crypto = require('crypto');
const axios = require('axios');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

/**
 * 🔒 计算文件的SHA-256哈希值（从URL下载文件）
 * @param {string} fileUrl - 文件的URL地址
 * @returns {Promise<Object>} - { hash: string, size: number }
 */
async function calculateFileHashFromUrl(fileUrl) {
  try {
    console.log('📊 开始计算文件哈希值:', fileUrl);
    
    // 创建SHA-256哈希对象
    const hash = crypto.createHash('sha256');
    let fileSize = 0;
    
    // 从URL下载文件并计算哈希
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    // 获取文件大小（如果有Content-Length头）
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      fileSize = parseInt(contentLength, 10);
    }
    
    // 创建一个变量来累计实际下载的字节数
    let downloadedSize = 0;
    
    // 通过流式处理计算哈希值
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        hash.update(chunk);
        downloadedSize += chunk.length;
      });
      
      response.data.on('end', () => {
        const hashValue = hash.digest('hex');
        const actualSize = downloadedSize || fileSize;
        
        console.log('✅ 文件哈希计算完成:', {
          hash: hashValue,
          size: actualSize
        });
        
        resolve({
          hash: hashValue,
          size: actualSize
        });
      });
      
      response.data.on('error', (error) => {
        console.error('❌ 文件哈希计算失败:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ 下载文件失败:', error.message);
    throw new Error(`无法计算文件哈希值: ${error.message}`);
  }
}

/**
 * 🔒 计算Buffer的SHA-256哈希值
 * @param {Buffer} buffer - 文件Buffer
 * @returns {string} - 哈希值
 */
function calculateFileHashFromBuffer(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * 🔒 比较两个哈希值是否相同
 * @param {string} hash1 - 第一个哈希值
 * @param {string} hash2 - 第二个哈希值
 * @returns {boolean} - 是否匹配
 */
function compareHashes(hash1, hash2) {
  if (!hash1 || !hash2) {
    return false;
  }
  return hash1.toLowerCase() === hash2.toLowerCase();
}

/**
 * 🔒 验证文件的哈希值（从URL下载并计算，然后与预期哈希值比较）
 * @param {string} fileUrl - 文件的URL地址
 * @param {string} expectedHash - 预期的哈希值
 * @returns {Promise<Object>} - { match: boolean, actualHash: string, expectedHash: string }
 */
async function verifyFileHash(fileUrl, expectedHash) {
  try {
    const { hash: actualHash } = await calculateFileHashFromUrl(fileUrl);
    const match = compareHashes(actualHash, expectedHash);
    
    if (!match) {
      console.warn('⚠️ 文件哈希值不匹配!', {
        expected: expectedHash,
        actual: actualHash
      });
    } else {
      console.log('✅ 文件哈希值验证通过');
    }
    
    return {
      match,
      actualHash,
      expectedHash
    };
  } catch (error) {
    console.error('❌ 文件哈希验证失败:', error);
    throw error;
  }
}

/**
 * 🔒 格式化哈希值显示（取前8位和后8位，中间用...连接）
 * @param {string} hash - 完整哈希值
 * @returns {string} - 格式化后的哈希值
 */
function formatHashForDisplay(hash) {
  if (!hash || hash.length < 16) {
    return hash || '';
  }
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

module.exports = {
  calculateFileHashFromUrl,
  calculateFileHashFromBuffer,
  compareHashes,
  verifyFileHash,
  formatHashForDisplay
};


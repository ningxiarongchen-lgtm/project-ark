const fs = require('fs');
const https = require('https');

// 配置
const API_HOST = 'project-ark-efy7.onrender.com';
const ADMIN_PHONE = '18322695661';
const ADMIN_PASSWORD = '090807';

// 读取导出的数据
const actuators = JSON.parse(fs.readFileSync('./actuators.json', 'utf-8'));

console.log(`📦 准备导入 ${actuators.length} 条执行器数据...`);

// HTTP 请求封装
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: API_HOST,
      port: 443,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(response.message || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function importData() {
  try {
    // 1. 登录获取 token
    console.log('🔐 正在登录...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.accessToken;
    console.log('✅ 登录成功！');
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    
    // 2. 批量导入数据
    let successCount = 0;
    let failCount = 0;
    
    console.log('📤 开始导入数据...\n');
    
    for (let i = 0; i < actuators.length; i++) {
      const actuator = actuators[i];
      
      try {
        // 移除 MongoDB 的 _id 字段和可能导致验证失败的空字段
        const { _id, __v, createdAt, updatedAt, ...actuatorData } = actuator;
        
        // 字段映射：model_base -> model
        if (actuatorData.model_base) {
          actuatorData.model = actuatorData.model_base;
          delete actuatorData.model_base;
        }
        
        // 清理空值和undefined
        Object.keys(actuatorData).forEach(key => {
          if (actuatorData[key] === null || actuatorData[key] === undefined || actuatorData[key] === '') {
            delete actuatorData[key];
          }
        });
        
        // 确保必填字段存在
        if (!actuatorData.model || !actuatorData.series) {
          throw new Error(`缺少必填字段: model=${actuatorData.model}, series=${actuatorData.series}`);
        }
        
        await makeRequest('POST', '/data-management/actuators', actuatorData, token);
        
        successCount++;
        
        // 每10条显示一次进度
        if ((i + 1) % 10 === 0) {
          console.log(`✅ 已导入 ${i + 1}/${actuators.length} 条`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ 导入失败 [${actuator.model || 'unknown'}]: ${error.message}`);
      }
      
      // 避免请求过快，每条数据间隔 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n========== 导入完成 ==========');
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${failCount} 条`);
    console.log('=============================\n');
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    process.exit(1);
  }
}

importData();

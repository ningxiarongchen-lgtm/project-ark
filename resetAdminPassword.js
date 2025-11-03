/**
 * 通过 API 重置管理员密码
 * 适用于 Render 免费版无法使用 Shell 的情况
 */

const https = require('https');

// 生产环境 API 地址
const API_URL = 'https://project-ark-efy7.onrender.com';

// 测试不同的管理员账号和密码组合
const testAccounts = [
  { phone: '13000000001', password: 'password', name: '王管理' },
  { phone: '13000000001', password: 'Admin@2024', name: '王管理' },
  { phone: '13800000000', password: 'admin123', name: '系统管理员' },
  { phone: '18322695661', password: 'Kay@2024', name: '何晓晓' },
];

async function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin(phone, password, name) {
  try {
    console.log(`\n🔐 测试登录: ${name} (${phone})`);
    console.log(`   密码: ${password}`);
    
    const result = await makeRequest(
      `${API_URL}/api/auth/login`,
      'POST',
      { phone, password }
    );

    if (result.status === 200 && result.data.token) {
      console.log(`   ✅ 登录成功！`);
      console.log(`   👤 用户: ${result.data.user.full_name}`);
      console.log(`   🎭 角色: ${result.data.user.role}`);
      console.log(`   📞 手机: ${result.data.user.phone}`);
      return true;
    } else {
      console.log(`   ❌ 登录失败: ${result.data.message || '认证失败'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 开始测试生产环境管理员账号...');
  console.log(`📡 API地址: ${API_URL}`);
  console.log('='.repeat(60));

  let successCount = 0;

  for (const account of testAccounts) {
    const success = await testLogin(account.phone, account.password, account.name);
    if (success) {
      successCount++;
      console.log('\n' + '='.repeat(60));
      console.log('🎉 找到可用的管理员账号！');
      console.log('='.repeat(60));
      console.log('\n✅ 请使用以下信息登录系统:');
      console.log(`   手机号: ${account.phone}`);
      console.log(`   密码: ${account.password}`);
      console.log(`   角色: 管理员`);
      console.log('\n💡 登录后即可进行用户管理和批量导入操作');
      break;
    }
  }

  if (successCount === 0) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ 未找到可用的管理员账号');
    console.log('='.repeat(60));
    console.log('\n📋 建议方案:');
    console.log('1. 检查是否已在 Render 上执行过数据初始化');
    console.log('2. 访问 Render Dashboard 查看后端日志');
    console.log('3. 尝试重新部署后端服务');
    console.log('4. 联系系统开发人员获取帮助');
  }

  console.log('\n✨ 测试完成');
}

main();



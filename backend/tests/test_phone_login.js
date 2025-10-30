/**
 * 测试脚本：验证手机号登录功能
 * 
 * 运行方法：
 * node tests/test_phone_login.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

// 测试用户列表
const testUsers = [
  { phone: '13800138000', password: 'admin123', role: 'Administrator', name: 'Admin User' },
  { phone: '13800138001', password: 'tech123', role: 'Technical Engineer', name: 'John Engineer' },
  { phone: '13800138002', password: 'manager123', role: 'Sales Manager', name: 'Sarah Sales' },
  { phone: '13800138003', password: 'sales123', role: 'Sales Engineer', name: 'Mike Commerce' }
];

// 测试结果
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试登录功能
async function testLogin(user) {
  console.log(`\n🧪 测试登录: ${user.name} (${user.phone})`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      phone: user.phone,
      password: user.password
    }, {
      withCredentials: true,
      validateStatus: null // 接受所有状态码
    });
    
    if (response.status === 200 && response.data) {
      const userData = response.data;
      
      // 验证返回数据
      const checks = [
        { name: '状态码为200', pass: response.status === 200 },
        { name: '返回用户手机号', pass: userData.phone === user.phone },
        { name: '返回用户姓名', pass: userData.full_name !== undefined },
        { name: '返回用户角色', pass: userData.role === user.role },
        { name: '不返回密码', pass: userData.password === undefined },
        { name: '不返回token（在cookie中）', pass: userData.token === undefined }
      ];
      
      let allPassed = true;
      checks.forEach(check => {
        const status = check.pass ? '✅' : '❌';
        console.log(`  ${status} ${check.name}`);
        if (!check.pass) allPassed = false;
      });
      
      if (allPassed) {
        console.log(`✅ 登录成功！用户: ${userData.full_name} (${userData.role})`);
        results.passed++;
        results.tests.push({
          test: `登录: ${user.name}`,
          status: 'PASS',
          details: `成功登录，返回正确的用户信息`
        });
        return true;
      } else {
        console.log(`❌ 登录验证失败`);
        results.failed++;
        results.tests.push({
          test: `登录: ${user.name}`,
          status: 'FAIL',
          details: '部分检查项未通过'
        });
        return false;
      }
    } else {
      console.log(`❌ 登录失败: 状态码 ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data)}`);
      results.failed++;
      results.tests.push({
        test: `登录: ${user.name}`,
        status: 'FAIL',
        details: `状态码: ${response.status}`
      });
      return false;
    }
  } catch (error) {
    console.log(`❌ 登录错误: ${error.message}`);
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   响应: ${JSON.stringify(error.response.data)}`);
    }
    results.failed++;
    results.tests.push({
      test: `登录: ${user.name}`,
      status: 'ERROR',
      details: error.message
    });
    return false;
  }
}

// 测试错误的手机号
async function testInvalidPhone() {
  console.log(`\n🧪 测试无效手机号登录`);
  
  const invalidPhones = [
    { phone: 'admin', desc: '旧用户名格式' },
    { phone: '12345678901', desc: '错误的手机号格式' },
    { phone: '138001380', desc: '手机号位数不足' }
  ];
  
  for (const testCase of invalidPhones) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        phone: testCase.phone,
        password: 'admin123'
      }, {
        withCredentials: true,
        validateStatus: null
      });
      
      if (response.status === 400 || response.status === 401 || response.status === 429) {
        console.log(`  ✅ ${testCase.desc}: 正确拒绝 (${response.status}${response.status === 429 ? ' - 速率限制' : ''})`);
        results.passed++;
      } else {
        console.log(`  ❌ ${testCase.desc}: 应该被拒绝但返回了 ${response.status}`);
        results.failed++;
      }
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 401 || error.response.status === 429)) {
        console.log(`  ✅ ${testCase.desc}: 正确拒绝 (${error.response.status}${error.response.status === 429 ? ' - 速率限制' : ''})`);
        results.passed++;
      } else {
        console.log(`  ❌ ${testCase.desc}: 出现意外错误`);
        results.failed++;
      }
    }
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     手机号登录功能测试                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📡 API地址: ${API_BASE_URL}`);
  
  // 测试所有用户登录
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  测试1: 有效用户登录');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const user of testUsers) {
    await testLogin(user);
    await new Promise(resolve => setTimeout(resolve, 500)); // 延迟避免请求过快
  }
  
  // 测试无效手机号
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  测试2: 无效手机号登录');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testInvalidPhone();
  
  // 显示测试报告
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     测试报告                                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ 通过: ${results.passed} 个测试`);
  console.log(`❌ 失败: ${results.failed} 个测试`);
  console.log(`📊 总计: ${results.passed + results.failed} 个测试`);
  
  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！手机号登录功能正常工作！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查以下内容：');
    results.tests.filter(t => t.status !== 'PASS').forEach(t => {
      console.log(`   ❌ ${t.test}: ${t.details}`);
    });
  }
  
  console.log('\n提示：');
  console.log('  1. 确保后端服务器正在运行 (npm run dev)');
  console.log('  2. 确保MongoDB数据库已启动');
  console.log('  3. 确保已运行数据迁移脚本');
  console.log('  4. 检查 .env 文件中的配置');
}

// 执行测试
runAllTests().catch(error => {
  console.error('\n❌ 测试执行失败:', error.message);
  process.exit(1);
});


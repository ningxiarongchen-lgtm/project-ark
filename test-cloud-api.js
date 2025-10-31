/**
 * 云端API测试脚本
 * 测试Render后端和MongoDB Atlas数据
 */

const axios = require('axios');

const API_URL = 'https://project-ark-efy7.onrender.com';

console.log('🧪 开始测试云端API...\n');
console.log('📍 API地址：', API_URL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // 测试1：健康检查
  console.log('📌 测试1：健康检查接口');
  try {
    const response = await axios.get(`${API_URL}/api/health`, {
      timeout: 10000
    });
    console.log('   ✅ 健康检查通过');
    console.log('   状态：', response.data.status);
    console.log('   消息：', response.data.message);
    testsPassed++;
  } catch (error) {
    console.log('   ❌ 健康检查失败');
    console.log('   错误：', error.message);
    testsFailed++;
  }
  console.log('');

  // 测试2：用户登录
  console.log('📌 测试2：用户登录（测试迁移的用户数据）');
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      phone: '13800138000',
      password: '123456'
    }, {
      timeout: 10000
    });
    
    console.log('   ✅ 登录成功');
    console.log('   用户名：', response.data.user.name);
    console.log('   角色：', response.data.user.role);
    console.log('   Token已获取：', response.data.token ? '是' : '否');
    
    // 保存token用于后续测试
    global.authToken = response.data.token;
    testsPassed++;
  } catch (error) {
    console.log('   ❌ 登录失败');
    if (error.response) {
      console.log('   错误：', error.response.data.message || error.message);
    } else {
      console.log('   错误：', error.message);
    }
    testsFailed++;
  }
  console.log('');

  // 测试3：获取执行器数据
  console.log('📌 测试3：获取执行器数据（测试产品数据迁移）');
  if (global.authToken) {
    try {
      const response = await axios.get(`${API_URL}/api/actuators?limit=5`, {
        headers: {
          Authorization: `Bearer ${global.authToken}`
        },
        timeout: 10000
      });
      
      console.log('   ✅ 执行器数据获取成功');
      console.log('   数据总数：', response.data.total || response.data.actuators?.length || '未知');
      if (response.data.actuators && response.data.actuators.length > 0) {
        console.log('   示例产品：', response.data.actuators[0].model_base);
        console.log('   系列：', response.data.actuators[0].series);
      }
      testsPassed++;
    } catch (error) {
      console.log('   ❌ 执行器数据获取失败');
      console.log('   错误：', error.response?.data?.message || error.message);
      testsFailed++;
    }
  } else {
    console.log('   ⏭️  跳过（登录失败，无Token）');
  }
  console.log('');

  // 测试4：获取供应商数据
  console.log('📌 测试4：获取供应商数据（测试供应商迁移）');
  if (global.authToken) {
    try {
      const response = await axios.get(`${API_URL}/api/suppliers`, {
        headers: {
          Authorization: `Bearer ${global.authToken}`
        },
        timeout: 10000
      });
      
      console.log('   ✅ 供应商数据获取成功');
      console.log('   供应商数量：', response.data.length || response.data.suppliers?.length || 0);
      if (response.data.length > 0 || (response.data.suppliers && response.data.suppliers.length > 0)) {
        const suppliers = response.data.suppliers || response.data;
        console.log('   示例供应商：', suppliers[0].name);
      }
      testsPassed++;
    } catch (error) {
      console.log('   ❌ 供应商数据获取失败');
      console.log('   错误：', error.response?.data?.message || error.message);
      testsFailed++;
    }
  } else {
    console.log('   ⏭️  跳过（登录失败，无Token）');
  }
  console.log('');

  // 测试5：获取项目数据
  console.log('📌 测试5：获取项目数据（测试项目迁移）');
  if (global.authToken) {
    try {
      const response = await axios.get(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${global.authToken}`
        },
        timeout: 10000
      });
      
      console.log('   ✅ 项目数据获取成功');
      console.log('   项目数量：', response.data.total || response.data.projects?.length || 0);
      if (response.data.projects && response.data.projects.length > 0) {
        console.log('   示例项目：', response.data.projects[0].projectNumber);
        console.log('   客户：', response.data.projects[0].client?.name);
      }
      testsPassed++;
    } catch (error) {
      console.log('   ❌ 项目数据获取失败');
      console.log('   错误：', error.response?.data?.message || error.message);
      testsFailed++;
    }
  } else {
    console.log('   ⏭️  跳过（登录失败，无Token）');
  }
  console.log('');

  // 测试6：获取配件数据
  console.log('📌 测试6：获取配件数据（测试配件迁移）');
  if (global.authToken) {
    try {
      const response = await axios.get(`${API_URL}/api/accessories`, {
        headers: {
          Authorization: `Bearer ${global.authToken}`
        },
        timeout: 10000
      });
      
      console.log('   ✅ 配件数据获取成功');
      console.log('   配件数量：', response.data.total || response.data.accessories?.length || 0);
      if (response.data.accessories && response.data.accessories.length > 0) {
        console.log('   示例配件：', response.data.accessories[0].name);
      }
      testsPassed++;
    } catch (error) {
      console.log('   ❌ 配件数据获取失败');
      console.log('   错误：', error.response?.data?.message || error.message);
      testsFailed++;
    }
  } else {
    console.log('   ⏭️  跳过（登录失败，无Token）');
  }
  console.log('');

  // 显示测试结果
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果汇总\n');
  console.log(`   ✅ 通过：${testsPassed} 个测试`);
  console.log(`   ❌ 失败：${testsFailed} 个测试`);
  console.log(`   🎯 成功率：${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('');

  if (testsFailed === 0) {
    console.log('🎉 所有测试通过！云端数据迁移成功！');
    console.log('');
    console.log('✅ 确认：');
    console.log('   - 后端API运行正常');
    console.log('   - 用户数据已成功迁移');
    console.log('   - 执行器数据已成功迁移');
    console.log('   - 供应商数据已成功迁移');
    console.log('   - 项目数据已成功迁移');
    console.log('   - 配件数据已成功迁移');
    console.log('');
    console.log('🚀 下一步：部署前端到Vercel');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行失败：', error.message);
  process.exit(1);
});


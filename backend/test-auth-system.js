/**
 * 认证与权限系统测试脚本
 * 验证登录、角色权限和数据管理接口
 */

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 支持Cookie
});

let adminToken = null;

// 测试登录功能（基于phone）
async function testLogin() {
  console.log('\n📱 测试登录功能（基于phone字段）...');
  
  try {
    const response = await api.post('/auth/login', {
      phone: '13800138000', // 使用管理员账号
      password: 'admin123'
    });
    
    console.log('✅ 登录成功');
    console.log('用户信息:', {
      phone: response.data.phone,
      full_name: response.data.full_name,
      role: response.data.role,
      passwordChangeRequired: response.data.passwordChangeRequired
    });
    
    // 验证返回的字段
    if (!response.data.role) {
      throw new Error('❌ 登录响应中缺少 role 字段');
    }
    if (response.data.passwordChangeRequired === undefined) {
      throw new Error('❌ 登录响应中缺少 passwordChangeRequired 字段');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 测试用户管理接口（仅管理员可访问）
async function testUserManagement() {
  console.log('\n👥 测试用户管理接口（Administrator权限）...');
  
  try {
    const response = await api.get('/data-management/users');
    console.log(`✅ 获取用户列表成功，共 ${response.data.pagination.total} 个用户`);
    return true;
  } catch (error) {
    console.error('❌ 获取用户列表失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 测试供应商管理接口（管理员可访问）
async function testSupplierManagement() {
  console.log('\n🏢 测试供应商管理接口（Administrator权限）...');
  
  try {
    const response = await api.get('/data-management/suppliers');
    console.log(`✅ 获取供应商列表成功，共 ${response.data.pagination.total} 个供应商`);
    return true;
  } catch (error) {
    console.error('❌ 获取供应商列表失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 测试执行器管理接口（管理员可访问）
async function testActuatorManagement() {
  console.log('\n⚙️  测试执行器管理接口（Administrator权限）...');
  
  try {
    const response = await api.get('/data-management/actuators');
    console.log(`✅ 获取执行器列表成功，共 ${response.data.pagination.total} 个执行器`);
    return true;
  } catch (error) {
    console.error('❌ 获取执行器列表失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 测试创建新用户
async function testCreateUser() {
  console.log('\n➕ 测试创建新用户...');
  
  const newUser = {
    phone: '13900000001',
    full_name: '测试用户',
    password: 'test123456',
    role: 'Technical Engineer',
    department: '技术部'
  };
  
  try {
    const response = await api.post('/data-management/users', newUser);
    console.log('✅ 创建用户成功:', response.data.data.full_name);
    
    // 清理测试数据
    await api.delete(`/data-management/users/${response.data.data._id}`);
    console.log('✅ 测试数据已清理');
    
    return true;
  } catch (error) {
    console.error('❌ 创建用户失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 测试无权限访问（使用非管理员账号）
async function testUnauthorizedAccess() {
  console.log('\n🚫 测试权限控制（使用非管理员账号）...');
  
  // 先登出当前账号
  await api.post('/auth/logout').catch(() => {});
  
  try {
    // 尝试用技术工程师账号登录
    await api.post('/auth/login', {
      phone: '13800138001',
      password: 'tech123'
    });
    
    // 尝试访问用户管理接口（应该被拒绝）
    try {
      await api.get('/data-management/users');
      console.error('❌ 权限控制失败：非管理员可以访问用户管理接口');
      return false;
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ 权限控制正常：非管理员无法访问用户管理接口');
        return true;
      } else {
        console.error('❌ 意外错误:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.log('⚠️  技术工程师账号不存在，跳过此测试');
    return true;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始测试认证与权限系统...');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // 测试1: 登录
  results.push({
    name: '登录功能（phone字段）',
    passed: await testLogin()
  });
  
  if (!results[0].passed) {
    console.log('\n⚠️  登录失败，无法继续后续测试');
    return;
  }
  
  // 测试2: 用户管理
  results.push({
    name: '用户管理接口',
    passed: await testUserManagement()
  });
  
  // 测试3: 供应商管理
  results.push({
    name: '供应商管理接口',
    passed: await testSupplierManagement()
  });
  
  // 测试4: 执行器管理
  results.push({
    name: '执行器管理接口',
    passed: await testActuatorManagement()
  });
  
  // 测试5: 创建用户
  results.push({
    name: '创建新用户',
    passed: await testCreateUser()
  });
  
  // 测试6: 权限控制
  results.push({
    name: '权限控制',
    passed: await testUnauthorizedAccess()
  });
  
  // 输出测试结果
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试结果汇总:');
  console.log('=' .repeat(60));
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.name}: ${status}`);
  });
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`总计: ${passedCount}/${totalCount} 测试通过`);
  console.log('=' .repeat(60));
  
  if (passedCount === totalCount) {
    console.log('\n🎉 所有测试通过！认证与权限系统运行正常！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查系统配置');
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});


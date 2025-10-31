/**
 * 认证模块单元测试
 * 
 * 测试框架: Jest + Supertest
 * 测试对象: controllers/authController.js
 * 
 * 运行测试:
 *   npm test
 *   npm test -- auth.test.js
 *   npm test -- --coverage
 * 
 * 功能覆盖:
 *   - 手机号登录
 *   - 强制修改密码
 *   - Token 验证
 *   - 用户注册
 *   - 密码重置
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// 在所有测试之前连接到测试数据库
beforeAll(async () => {
  // 使用测试数据库
  const testDbUrl = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/cmax-test';
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(testDbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// 在所有测试之后断开数据库连接
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// 在每个测试之前清理数据库
beforeEach(async () => {
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
});

describe('认证 API 测试', () => {
  
  // ==================== 用户注册测试 ====================
  describe('POST /api/auth/register - 用户注册', () => {
    
    test('应该成功注册新用户（使用手机号）', async () => {
      const newUser = {
        phone: '13800138000',
        full_name: '张三',
        password: 'test123456',
        role: 'Technical Engineer',
        department: '技术部'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);
      
      expect(response.body).toHaveProperty('_id');
      expect(response.body.phone).toBe(newUser.phone);
      expect(response.body.full_name).toBe(newUser.full_name);
      expect(response.body.role).toBe(newUser.role);
      expect(response.body).not.toHaveProperty('password'); // 不应返回密码
      expect(response.body).not.toHaveProperty('token'); // token在cookie中
      
      // 验证Cookie中有token
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
    });
    
    test('应该拒绝无效的手机号格式', async () => {
      const invalidPhones = [
        '12345678901',  // 错误的开头数字
        '138001380',    // 位数不足
        '138001380000', // 位数过多
        'admin',        // 字母
        '138-0013-8000' // 包含特殊字符
      ];
      
      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            phone,
            full_name: '测试用户',
            password: 'test123',
            role: 'Technical Engineer'
          })
          .expect(400);
        
        expect(response.body).toHaveProperty('message');
      }
    });
    
    test('应该拒绝重复的手机号', async () => {
      const user = {
        phone: '13800138001',
        full_name: '李四',
        password: 'test123',
        role: 'Business Engineer'
      };
      
      // 第一次注册应该成功
      await request(app)
        .post('/api/auth/register')
        .send(user)
        .expect(201);
      
      // 第二次注册应该失败
      const response = await request(app)
        .post('/api/auth/register')
        .send(user)
        .expect(400);
      
      expect(response.body.message).toMatch(/已被注册/);
    });
    
    test('应该要求提供必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '13800138002'
          // 缺少 full_name 和 password
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });
  
  // ==================== 用户登录测试 ====================
  describe('POST /api/auth/login - 用户登录', () => {
    
    // 测试用户数据
    let testUser;
    
    beforeEach(async () => {
      // 创建测试用户
      testUser = await User.create({
        phone: '13800138010',
        full_name: '测试用户',
        password: 'password123',
        role: 'Technical Engineer',
        department: '研发部',
        passwordChangeRequired: true // 新用户需要修改密码
      });
    });
    
    test('应该使用正确的手机号和密码成功登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138010',
          password: 'password123'
        })
        .expect(200);
      
      // 验证返回的用户信息
      expect(response.body.phone).toBe('13800138010');
      expect(response.body.full_name).toBe('测试用户');
      expect(response.body.role).toBe('Technical Engineer');
      expect(response.body.department).toBe('研发部');
      expect(response.body).not.toHaveProperty('password');
      
      // 验证 passwordChangeRequired 字段
      expect(response.body.passwordChangeRequired).toBe(true);
      
      // 验证Cookie中有token
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true);
      
      // 验证Cookie设置了 HttpOnly 和 SameSite
      const accessTokenCookie = cookies.find(cookie => cookie.includes('accessToken'));
      expect(accessTokenCookie).toMatch(/HttpOnly/);
      expect(accessTokenCookie).toMatch(/SameSite=Strict/i);
    });
    
    test('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138010',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/Invalid credentials/);
    });
    
    test('应该拒绝不存在的手机号', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138999', // 未注册的手机号
          password: 'password123'
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/Invalid credentials/);
    });
    
    test('应该拒绝无效的手机号格式', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: 'invalidphone',
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
    
    test('应该拒绝未激活的用户', async () => {
      // 创建一个未激活的用户
      await User.create({
        phone: '13800138020',
        full_name: '未激活用户',
        password: 'password123',
        role: 'Business Engineer',
        isActive: false
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138020',
          password: 'password123'
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/inactive/i);
    });
    
    test('应该要求提供手机号和密码', async () => {
      // 缺少密码
      let response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138010'
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/请提供手机号和密码/);
      
      // 缺少手机号
      response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/请提供手机号和密码/);
    });
    
    test('登录成功后应该更新 lastLogin 字段', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138010',
          password: 'password123'
        })
        .expect(200);
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(new Date(updatedUser.lastLogin).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });
  
  // ==================== 强制修改密码流程测试 ====================
  describe('强制修改密码流程', () => {
    
    let testUser;
    let accessToken;
    
    beforeEach(async () => {
      // 创建需要修改密码的测试用户
      testUser = await User.create({
        phone: '13800138030',
        full_name: '新员工',
        password: 'temp123456',
        role: 'Business Engineer',
        passwordChangeRequired: true // 强制修改密码标志
      });
      
      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138030',
          password: 'temp123456'
        });
      
      // 从Cookie中提取token
      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
      accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    });
    
    test('登录后应该检测到 passwordChangeRequired 为 true', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138030',
          password: 'temp123456'
        })
        .expect(200);
      
      expect(response.body.passwordChangeRequired).toBe(true);
    });
    
    test('应该成功修改密码', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'temp123456',
          newPassword: 'newpassword123'
        })
        .expect(200);
      
      expect(response.body.message).toMatch(/密码修改成功/);
      expect(response.body.passwordChangeRequired).toBe(false);
    });
    
    test('修改密码后，passwordChangeRequired 应该变为 false', async () => {
      // 修改密码
      await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'temp123456',
          newPassword: 'newpassword123'
        })
        .expect(200);
      
      // 验证数据库中的字段已更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordChangeRequired).toBe(false);
      
      // 使用新密码登录，验证 passwordChangeRequired 为 false
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138030',
          password: 'newpassword123'
        })
        .expect(200);
      
      expect(loginResponse.body.passwordChangeRequired).toBe(false);
    });
    
    test('应该拒绝错误的当前密码', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/当前密码不正确/);
    });
    
    test('应该拒绝过短的新密码', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'temp123456',
          newPassword: '123' // 少于6个字符
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/新密码长度至少为6个字符/);
    });
    
    test('未登录用户应该无法修改密码', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'temp123456',
          newPassword: 'newpassword123'
        })
        .expect(401);
      
      expect(response.body.message).toMatch(/Not authorized/);
    });
    
    test('应该要求提供当前密码和新密码', async () => {
      // 缺少新密码
      let response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'temp123456'
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/请提供当前密码和新密码/);
      
      // 缺少当前密码
      response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          newPassword: 'newpassword123'
        })
        .expect(400);
      
      expect(response.body.message).toMatch(/请提供当前密码和新密码/);
    });
    
    test('完整的强制修改密码流程', async () => {
      // 步骤1: 新用户登录，检测需要修改密码
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138030',
          password: 'temp123456'
        })
        .expect(200);
      
      expect(loginResponse.body.passwordChangeRequired).toBe(true);
      
      // 步骤2: 用户修改密码
      const changeResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({
          currentPassword: 'temp123456',
          newPassword: 'mynewpassword123'
        })
        .expect(200);
      
      expect(changeResponse.body.passwordChangeRequired).toBe(false);
      
      // 步骤3: 使用新密码重新登录
      const reLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138030',
          password: 'mynewpassword123'
        })
        .expect(200);
      
      expect(reLoginResponse.body.passwordChangeRequired).toBe(false);
      
      // 步骤4: 验证旧密码不再有效
      await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138030',
          password: 'temp123456'
        })
        .expect(401);
    });
  });
  
  // ==================== Token 验证测试 ====================
  describe('GET /api/auth/me - 获取当前用户信息', () => {
    
    let testUser;
    let accessToken;
    
    beforeEach(async () => {
      testUser = await User.create({
        phone: '13800138040',
        full_name: '测试用户',
        password: 'password123',
        role: 'Administrator',
        department: '管理部'
      });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138040',
          password: 'password123'
        });
      
      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
      accessToken = accessTokenCookie.split(';')[0].split('=')[1];
    });
    
    test('应该返回当前登录用户的信息', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      expect(response.body.phone).toBe('13800138040');
      expect(response.body.full_name).toBe('测试用户');
      expect(response.body.role).toBe('Administrator');
      expect(response.body).not.toHaveProperty('password');
    });
    
    test('未登录用户应该返回401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);
      
      expect(response.body.message).toMatch(/Not authorized/);
    });
    
    test('无效的token应该返回401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['accessToken=invalidtoken'])
        .expect(401);
      
      expect(response.body.message).toMatch(/Not authorized/);
    });
  });
  
  // ==================== 登出测试 ====================
  describe('POST /api/auth/logout - 用户登出', () => {
    
    let accessToken;
    let refreshToken;
    
    beforeEach(async () => {
      await User.create({
        phone: '13800138050',
        full_name: '测试用户',
        password: 'password123',
        role: 'Business Engineer'
      });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138050',
          password: 'password123'
        });
      
      const cookies = loginResponse.headers['set-cookie'];
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
      const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      
      accessToken = accessTokenCookie.split(';')[0].split('=')[1];
      refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    });
    
    test('应该成功登出并清除Cookies', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`])
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/Logged out successfully/);
      
      // 验证Cookies被清除
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      // 检查accessToken和refreshToken的Cookie被设置为空
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
      const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      
      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();
    });
    
    test('登出后，之前的token应该无法使用', async () => {
      // 登出
      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200);
      
      // 尝试使用旧token访问受保护的路由
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(401);
    });
  });
  
  // ==================== 边界情况和安全测试 ====================
  describe('边界情况和安全测试', () => {
    
    test('密码不应该在任何响应中返回', async () => {
      // 创建用户
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '13800138060',
          full_name: '安全测试',
          password: 'securepassword123',
          role: 'Technical Engineer'
        })
        .expect(201);
      
      expect(registerResponse.body).not.toHaveProperty('password');
      
      // 登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138060',
          password: 'securepassword123'
        })
        .expect(200);
      
      expect(loginResponse.body).not.toHaveProperty('password');
    });
    
    test('应该正确处理特殊字符的密码', async () => {
      const specialPassword = 'P@ssw0rd!#$%^&*()';
      
      await User.create({
        phone: '13800138070',
        full_name: '特殊字符测试',
        password: specialPassword,
        role: 'Business Engineer'
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '13800138070',
          password: specialPassword
        })
        .expect(200);
      
      expect(response.body.phone).toBe('13800138070');
    });
    
    test('应该正确处理中文姓名', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '13800138080',
          full_name: '张伟·李娜',
          password: 'password123',
          role: 'Technical Engineer',
          department: '研发部门'
        })
        .expect(201);
      
      expect(response.body.full_name).toBe('张伟·李娜');
      expect(response.body.department).toBe('研发部门');
    });
  });
});


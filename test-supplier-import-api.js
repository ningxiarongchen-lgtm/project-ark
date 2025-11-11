#!/usr/bin/env node

/**
 * 测试供应商批量导入API
 * 检查后端是否已更新到支持中文字段
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 生产环境后端URL（从Render获取）
const BACKEND_URL = process.env.BACKEND_URL || 'https://project-ark-d42c.onrender.com';

console.log('\n🔍 测试供应商批量导入API\n');
console.log(`后端URL: ${BACKEND_URL}\n`);

// 创建测试Excel文件（使用中文列名）
function createTestExcel() {
  console.log('📝 创建测试Excel文件（中文列名）...');
  
  const testData = [
    {
      '供应商名称': '测试供应商A',
      '联系人': '张三',
      '电话': '13800138000',
      '地址': '测试地址A',
      '经营范围': '测试范围A',
      '评级': 4,
      '认证状态': 'Certified',
      '累计交易额': 10000,
      '准时交付率': 95,
      '状态': 'active',
      '备注': '测试备注A'
    },
    {
      '供应商名称': '测试供应商B',
      '联系人': '李四',
      '电话': '13900139000',
      '地址': '测试地址B',
      '经营范围': '测试范围B',
      '评级': 5,
      '认证状态': 'Certified',
      '累计交易额': 20000,
      '准时交付率': 98,
      '状态': 'active',
      '备注': '测试备注B'
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(testData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
  
  const filePath = path.join(__dirname, 'test-suppliers-chinese.xlsx');
  XLSX.writeFile(wb, filePath);
  
  console.log(`✅ 测试文件已创建: ${filePath}\n`);
  return filePath;
}

// 测试API
async function testImportAPI() {
  try {
    // 1. 创建测试文件
    const testFile = createTestExcel();
    
    // 2. 准备FormData
    console.log('📤 准备上传数据...');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    form.append('updateOnDuplicate', 'true');
    
    // 3. 发送请求
    console.log(`🚀 发送请求到: ${BACKEND_URL}/api/data-management/suppliers/bulk-import\n`);
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${BACKEND_URL}/api/data-management/suppliers/bulk-import`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    // 4. 检查响应
    console.log(`📡 响应状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('\n📋 响应内容:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const data = JSON.parse(responseText);
      console.log(JSON.stringify(data, null, 2));
      
      // 5. 分析结果
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📊 结果分析:');
      
      if (data.success) {
        console.log(`✅ 请求成功`);
        console.log(`   总行数: ${data.summary?.totalRows || 0}`);
        console.log(`   成功导入: ${data.summary?.imported || 0}`);
        console.log(`   失败: ${data.summary?.failed || 0}`);
        
        if (data.summary?.imported > 0) {
          console.log('\n🎉 中文字段映射工作正常！');
        } else {
          console.log('\n⚠️  导入成功但没有数据，可能原因：');
          console.log('   - 字段映射未生效');
          console.log('   - 数据验证失败');
          console.log('   - 重复数据被跳过');
          
          if (data.validation) {
            console.log('\n验证结果：');
            console.log(`   有效记录: ${data.validation.valid?.length || 0}`);
            console.log(`   无效记录: ${data.validation.invalid?.length || 0}`);
            
            if (data.validation.invalid && data.validation.invalid.length > 0) {
              console.log('\n❌ 无效记录详情:');
              data.validation.invalid.forEach((item, idx) => {
                console.log(`   ${idx + 1}. 错误: ${item.errors?.join(', ')}`);
              });
            }
          }
        }
      } else {
        console.log(`❌ 请求失败: ${data.message}`);
        if (data.error) {
          console.log(`   错误详情: ${data.error}`);
        }
      }
    } catch (e) {
      console.log(responseText);
      console.log('\n❌ 响应不是有效的JSON');
    }
    
    // 6. 清理测试文件
    fs.unlinkSync(testFile);
    console.log('\n🧹 测试文件已清理');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testImportAPI();





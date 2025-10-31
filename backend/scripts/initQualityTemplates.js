// 初始化质检模板数据
// 使用方法: node backend/scripts/initQualityTemplates.js

require('dotenv').config();
const mongoose = require('mongoose');
const ChecklistTemplate = require('../models/ChecklistTemplate');

const templates = [
  // IQC 模板
  {
    name: 'IQC - 通用来料检验模板',
    productSeries: 'ALL',
    checkType: 'IQC',
    items: [
      { itemName: '外观检查', standard: '无划痕、锈蚀、变形', displayOrder: 1 },
      { itemName: '数量核对', standard: '与采购单数量一致', displayOrder: 2 },
      { itemName: '标识检查', standard: '标签清晰、规格正确', displayOrder: 3 },
      { itemName: '包装检查', standard: '包装完好、无破损', displayOrder: 4 },
      { itemName: '文件核对', standard: '随货文件齐全（合格证、说明书等）', displayOrder: 5 }
    ]
  },
  {
    name: 'IQC - 执行器主机检验模板',
    productSeries: 'AT',
    checkType: 'IQC',
    items: [
      { itemName: '外观检查', standard: '表面无划痕、锈蚀、变形', displayOrder: 1 },
      { itemName: '数量核对', standard: '与采购单数量一致', displayOrder: 2 },
      { itemName: '铭牌检查', standard: '铭牌清晰、规格型号正确', displayOrder: 3 },
      { itemName: '紧固件检查', standard: '螺栓、螺母无缺失或损坏', displayOrder: 4 },
      { itemName: '旋转测试', standard: '手动旋转无卡滞、异响', displayOrder: 5 },
      { itemName: '文件核对', standard: '合格证、检验报告齐全', displayOrder: 6 }
    ]
  },
  
  // FQC 模板
  {
    name: 'FQC - AT系列执行器成品检验模板',
    productSeries: 'AT',
    checkType: 'FQC',
    items: [
      { itemName: '外观检查', standard: '表面光洁、无划痕、涂层均匀', displayOrder: 1 },
      { itemName: '尺寸检验', standard: '关键尺寸符合图纸要求±0.1mm', displayOrder: 2 },
      { itemName: '铭牌检查', standard: '铭牌清晰、信息准确完整', displayOrder: 3 },
      { itemName: '紧固件检查', standard: '所有紧固件安装到位、扭矩正确', displayOrder: 4 },
      { itemName: '气密性测试', standard: '测试压力6bar，保压5分钟，压降<0.1%', displayOrder: 5 },
      { itemName: '开关动作测试', standard: '开关动作顺畅、无卡滞、行程正确', displayOrder: 6 },
      { itemName: '扭矩测试', standard: '输出扭矩符合规格要求±5%', displayOrder: 7 },
      { itemName: '电气测试', standard: '接线正确、绝缘电阻>10MΩ', displayOrder: 8 },
      { itemName: '附件齐全性', standard: '附件、说明书、合格证齐全', displayOrder: 9 }
    ]
  },
  {
    name: 'FQC - GT系列执行器成品检验模板',
    productSeries: 'GT',
    checkType: 'FQC',
    items: [
      { itemName: '外观检查', standard: '表面光洁、无划痕、涂层均匀', displayOrder: 1 },
      { itemName: '尺寸检验', standard: '关键尺寸符合图纸要求±0.1mm', displayOrder: 2 },
      { itemName: '铭牌检查', standard: '铭牌清晰、信息准确完整', displayOrder: 3 },
      { itemName: '紧固件检查', standard: '所有紧固件安装到位、扭矩正确', displayOrder: 4 },
      { itemName: '气密性测试', standard: '测试压力6bar，保压5分钟，压降<0.1%', displayOrder: 5 },
      { itemName: '开关动作测试', standard: '开关动作顺畅、无卡滞、行程正确', displayOrder: 6 },
      { itemName: '扭矩测试', standard: '输出扭矩符合规格要求±5%', displayOrder: 7 },
      { itemName: '电气测试', standard: '接线正确、绝缘电阻>10MΩ', displayOrder: 8 },
      { itemName: '限位开关测试', standard: '限位开关动作准确、信号正常', displayOrder: 9 },
      { itemName: '附件齐全性', standard: '附件、说明书、合格证齐全', displayOrder: 10 }
    ]
  },
  {
    name: 'FQC - PSQ系列执行器成品检验模板',
    productSeries: 'PSQ',
    checkType: 'FQC',
    items: [
      { itemName: '外观检查', standard: '表面光洁、无划痕、涂层均匀', displayOrder: 1 },
      { itemName: '尺寸检验', standard: '关键尺寸符合图纸要求±0.1mm', displayOrder: 2 },
      { itemName: '铭牌检查', standard: '铭牌清晰、信息准确完整', displayOrder: 3 },
      { itemName: '气动测试', standard: '供气压力4-7bar，动作正常', displayOrder: 4 },
      { itemName: '开关动作测试', standard: '开关角度90°±2°，动作灵活', displayOrder: 5 },
      { itemName: '扭矩测试', standard: '输出扭矩符合规格要求±5%', displayOrder: 6 },
      { itemName: '气密性测试', standard: '各接口无泄漏', displayOrder: 7 },
      { itemName: '附件齐全性', standard: '附件、说明书、合格证齐全', displayOrder: 8 }
    ]
  },
  
  // IPQC 模板
  {
    name: 'IPQC - 装配过程检验模板',
    productSeries: 'ALL',
    checkType: 'IPQC',
    items: [
      { itemName: '零件清洁度', standard: '零件清洁无油污、杂质', displayOrder: 1 },
      { itemName: '装配顺序', standard: '按工艺文件要求装配', displayOrder: 2 },
      { itemName: '紧固力矩', standard: '按规定力矩值紧固', displayOrder: 3 },
      { itemName: '密封件安装', standard: '密封件完好、安装到位', displayOrder: 4 },
      { itemName: '润滑油脂', standard: '按规定加注润滑油脂', displayOrder: 5 }
    ]
  },
  
  // OQC 模板
  {
    name: 'OQC - 出货检验模板',
    productSeries: 'ALL',
    checkType: 'OQC',
    items: [
      { itemName: '外观检查', standard: '产品外观完好、清洁', displayOrder: 1 },
      { itemName: '标识检查', standard: '铭牌、标签正确清晰', displayOrder: 2 },
      { itemName: '包装检查', standard: '包装牢固、防护措施到位', displayOrder: 3 },
      { itemName: '文件齐全性', standard: '合格证、说明书、装箱单齐全', displayOrder: 4 },
      { itemName: '数量核对', standard: '实物与发货单一致', displayOrder: 5 }
    ]
  }
];

async function initTemplates() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project-ark-platform');
    console.log('✅ 已连接到数据库');
    
    // 清空现有模板（可选，根据需要取消注释）
    // await ChecklistTemplate.deleteMany({});
    // console.log('🗑️  已清空现有模板');
    
    // 插入新模板
    for (const template of templates) {
      const existing = await ChecklistTemplate.findOne({
        checkType: template.checkType,
        productSeries: template.productSeries
      });
      
      if (existing) {
        console.log(`⚠️  模板已存在: ${template.name}，跳过`);
        continue;
      }
      
      await ChecklistTemplate.create(template);
      console.log(`✅ 创建模板: ${template.name}`);
    }
    
    console.log('\n🎉 质检模板初始化完成！');
    
    // 显示统计
    const count = await ChecklistTemplate.countDocuments();
    console.log(`\n📊 当前共有 ${count} 个检验模板`);
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 已断开数据库连接');
  }
}

initTemplates();


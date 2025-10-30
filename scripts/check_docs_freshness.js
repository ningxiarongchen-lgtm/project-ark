#!/usr/bin/env node

/**
 * 文档健康度检查脚本
 * 
 * 功能：扫描 docs/ 文件夹，检测哪些文档超过指定时间未更新
 * 用途：确保核心文档保持最新，防止文档陈旧
 * 使用：npm run docs:health-check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- 配置 ---
// 文档文件夹的路径
const DOCS_PATH = path.join(__dirname, '..', 'docs');
// 文档被认为是"陈旧"的阈值（天数）
const STALE_THRESHOLD_DAYS = 180; // 6个月

// --- 脚本主逻辑 ---
console.log('🩺 开始扫描文档健康度...');
console.log(`📂 文档目录: ${DOCS_PATH}`);
console.log(`⏰ 陈旧阈值: ${STALE_THRESHOLD_DAYS} 天\n`);

// 检查 docs 目录是否存在
if (!fs.existsSync(DOCS_PATH)) {
  console.error(`❌ 错误: 文档目录 ${DOCS_PATH} 不存在`);
  process.exit(1);
}

// 1. 获取文档目录下的所有 .md 文件
const getMarkdownFiles = (dir) => {
  try {
    return fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(dir, file));
  } catch (error) {
    console.error(`❌ 读取目录失败: ${error.message}`);
    return [];
  }
};

// 2. 获取文件的最后修改日期 (通过 Git)
const getLastModifiedDate = (filePath) => {
  try {
    // 使用 Git log 获取最后一次提交的日期，这比文件系统的日期更可靠
    const command = `git log -1 --format=%cI -- "${filePath}"`;
    const isoDate = execSync(command, { encoding: 'utf-8' }).toString().trim();
    
    if (!isoDate) {
      // 如果文件是新建的、还未提交，则返回当前日期
      return new Date();
    }
    
    return new Date(isoDate);
  } catch (error) {
    // 如果 Git 不可用或文件未跟踪，使用文件系统的修改时间
    try {
      const stats = fs.statSync(filePath);
      return stats.mtime;
    } catch (fsError) {
      return new Date();
    }
  }
};

// --- 执行扫描 ---
const allDocs = getMarkdownFiles(DOCS_PATH);

if (allDocs.length === 0) {
  console.log('⚠️  警告: 未找到任何 Markdown 文档');
  process.exit(0);
}

const today = new Date();
const staleDocs = [];
const healthyDocs = [];

for (const docPath of allDocs) {
  const lastModified = getLastModifiedDate(docPath);
  const diffTime = Math.abs(today - lastModified);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const docName = path.basename(docPath);

  if (diffDays > STALE_THRESHOLD_DAYS) {
    staleDocs.push({ name: docName, days: diffDays, path: docPath });
  } else {
    healthyDocs.push({ name: docName, days: diffDays, path: docPath });
  }
}

// --- 生成报告 ---
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('           📊 扫描报告');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 统计信息
console.log(`📈 统计信息:`);
console.log(`  - 总文档数: ${allDocs.length}`);
console.log(`  - 健康文档: ${healthyDocs.length}`);
console.log(`  - 陈旧文档: ${staleDocs.length}`);
console.log(`  - 健康率: ${((healthyDocs.length / allDocs.length) * 100).toFixed(1)}%\n`);

if (healthyDocs.length > 0) {
  console.log(`✅ 以下 ${healthyDocs.length} 份文档是健康的 (最近 ${STALE_THRESHOLD_DAYS} 天内有更新):\n`);
  healthyDocs.forEach(doc => {
    console.log(`  📄 ${doc.name}`);
    console.log(`     最后更新: ${doc.days} 天前\n`);
  });
}

if (staleDocs.length > 0) {
  console.log(`⚠️  警告：以下 ${staleDocs.length} 份文档可能已陈旧，请团队进行人工审查：\n`);
  staleDocs.forEach(doc => {
    console.log(`  📄 ${doc.name}`);
    console.log(`     最后更新: ${doc.days} 天前`);
    console.log(`     路径: ${doc.path}\n`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   🔍 审查建议:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('   1. 内容是否仍然准确？');
  console.log('      → 如果不是，请更新文档内容');
  console.log('      → 更新后 Git 提交即可刷新时间戳\n');
  console.log('   2. 这份文档是否还有存在的必要？');
  console.log('      → 如果没有，请在团队确认后归档或删除');
  console.log('      → 可移动到 legacy-docs/ 文件夹\n');
  console.log('   3. 文档是否需要拆分或重组？');
  console.log('      → 如果文档过于庞大，考虑拆分');
  console.log('      → 如果内容重复，考虑合并\n');
}

if (staleDocs.length === 0 && healthyDocs.length > 0) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 所有核心文档都保持最新状态，做得很好！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// --- 退出状态 ---
// 如果有陈旧文档，以警告状态退出（但不阻塞CI）
if (staleDocs.length > 0) {
  console.log('⚠️  检测到陈旧文档，请关注文档更新\n');
  // 不退出非零状态，避免阻塞 CI/CD
  // process.exit(1);
}

console.log('✅ 文档健康检查完成\n');
process.exit(0);


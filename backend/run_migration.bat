@echo off
REM ==========================================
REM 价格字段迁移一键运行脚本 (Windows)
REM 
REM 用途：快速执行价格字段迁移
REM 使用：run_migration.bat
REM
REM @author Project Ark 技术团队
REM @date 2025-10-27
REM ==========================================

chcp 65001 > nul
echo.
echo ═══════════════════════════════════════════════
echo   价格字段迁移脚本 - 一键运行
echo   Price Tiers Migration - Quick Start
echo ═══════════════════════════════════════════════
echo.

REM 检查是否在 backend 目录
if not exist "migration_price_tiers.js" (
    echo [错误] 请在 backend 目录下运行此脚本
    echo 提示: cd backend ^&^& run_migration.bat
    pause
    exit /b 1
)

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo [成功] Node.js 已安装: %NODE_VERSION%

REM 检查 .env 文件
if not exist ".env" (
    echo [警告] 未找到 .env 文件
    echo 将使用默认连接: mongodb://localhost:27017/cmax-selection
    echo.
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [提醒] 建议在迁移前备份数据库
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 最终确认
echo 准备开始迁移
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 迁移操作：
echo   • 从旧字段读取价格 (base_price, pricing.base_price_normal 等)
echo   • 创建新的 price_tiers 阶梯定价结构
echo   • 自动生成批量折扣档位 (5%%, 10%%, 15%%)
echo   • 提取手动操作装置和配件信息
echo.
echo 特性：
echo   • 幂等性 - 可重复运行，不会重复迁移
echo   • 安全性 - 只添加字段，不删除旧数据
echo   • 详细日志 - 显示每个文档的处理结果
echo.

set /p CONFIRM="确认开始迁移？(y/n): "
if /i not "%CONFIRM%"=="y" (
    echo 已取消迁移
    pause
    exit /b 0
)

echo.
echo [执行] 开始执行迁移...
echo.

REM 执行迁移
node migration_price_tiers.js

if %errorlevel% equ 0 (
    echo.
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo [成功] 迁移成功完成！
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo 下一步建议：
    echo   1. 验证迁移结果（查看上面的统计信息）
    echo   2. 测试 API 接口和前端功能
    echo   3. 查看详细文档: type MIGRATION_GUIDE.md
    echo.
) else (
    echo.
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo [失败] 迁移失败（退出码: %errorlevel%）
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo 故障排除：
    echo   1. 检查上面的错误信息
    echo   2. 确认 MongoDB 服务已启动: net start MongoDB
    echo   3. 确认数据库连接配置正确（.env 文件）
    echo   4. 查看迁移指南: type MIGRATION_GUIDE.md
    echo.
)

pause


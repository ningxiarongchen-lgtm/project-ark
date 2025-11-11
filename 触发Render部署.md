# 触发Render重新部署

## 方法1: 在Render Dashboard手动部署（推荐）

1. 访问 https://dashboard.render.com
2. 找到 `project-ark` 或 `model-selection-backend` 服务
3. 点击右上角的 **"Manual Deploy"** 按钮
4. 选择 **"Deploy latest commit"**
5. 等待部署完成（约2-3分钟）

---

## 方法2: 推送一个空提交触发自动部署

```bash
cd /Users/hexiaoxiao/Desktop/Model\ Selection\ System
git commit --allow-empty -m "chore: 触发Render重新部署"
git push origin main
```

---

## 方法3: 检查Render自动部署设置

1. 进入Render Dashboard
2. 选择服务
3. 进入 **Settings** 标签
4. 确认 **Auto-Deploy** 是否启用
5. 确认分支是 **main**

---

## 当前部署状态

**最新提交**: `e4fe162aa` - fix: 修复Render部署问题  
**推送时间**: 刚刚  
**预期**: Render应该自动检测到新提交并部署

---

## 如果自动部署没有触发

可能原因：
1. Render的webhook没有正确配置
2. GitHub和Render的连接有问题
3. 需要手动触发部署

**解决方案**: 使用方法1手动部署

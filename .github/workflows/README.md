# GitHub Actions 工作流

本文件夹包含 Project Ark 项目的 GitHub Actions 自动化工作流。

---

## 📚 文档健康检查 (docs-health-check.yml)

### 功能说明

自动运行文档健康检查，监测 `docs/` 文件夹中的文档是否及时更新。

### 触发条件

| 触发方式 | 说明 | 何时使用 |
|---------|------|---------|
| **定时触发** | 每月1号 UTC 00:00<br/>(北京时间 08:00) | 自动定期检查 |
| **手动触发** | 在 GitHub Actions 页面点击 "Run workflow" | 按需检查 |
| **Pull Request** | PR 涉及文档或检查脚本时 | 确保文档更新 |

### 工作流程

```
1. 📥 检出代码 (完整 Git 历史)
   ↓
2. 🔧 设置 Node.js 16 环境
   ↓
3. 📦 安装依赖 (如果需要)
   ↓
4. 🩺 运行文档健康检查
   ↓
5. 📝 创建 Issue (如果发现陈旧文档)
   ↓
6. 📤 上传检查报告
```

### 查看结果

#### 在 GitHub Actions 页面查看

1. 进入仓库的 **Actions** 标签
2. 点击 **Documentation Health Check** 工作流
3. 查看最近的运行记录
4. 展开 **Run documentation health check** 步骤查看详细报告

#### 手动触发

1. 进入仓库的 **Actions** 标签
2. 选择 **Documentation Health Check** 工作流
3. 点击 **Run workflow** 按钮
4. 选择分支（通常是 main/master）
5. 点击绿色的 **Run workflow** 按钮

### 输出示例

#### ✅ 所有文档健康

```
📚 Documentation Health Check
🩺 开始扫描文档健康度...
📂 文档目录: /home/runner/work/project/project/docs
⏰ 陈旧阈值: 180 天

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           📊 扫描报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 统计信息:
  - 总文档数: 4
  - 健康文档: 4
  - 陈旧文档: 0
  - 健康率: 100.0%

🎉 所有核心文档都保持最新状态，做得很好！
```

#### ⚠️ 检测到陈旧文档

```
⚠️  警告：以下 2 份文档可能已陈旧，请团队进行人工审查：

  📄 OLD_GUIDE.md
     最后更新: 200 天前
     路径: /home/runner/work/project/project/docs/OLD_GUIDE.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 审查建议:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. 内容是否仍然准确？
   2. 这份文档是否还有存在的必要？
   3. 文档是否需要拆分或重组？
```

### 配置选项

#### 修改检查频率

编辑 `docs-health-check.yml` 中的 cron 表达式：

```yaml
schedule:
  - cron: '0 0 1 * *'  # 每月1号
  # 其他选项：
  # - cron: '0 0 * * 1'  # 每周一
  # - cron: '0 0 1 */3 *'  # 每季度
```

#### 修改陈旧阈值

编辑 `scripts/check_docs_freshness.js` 中的阈值：

```javascript
const STALE_THRESHOLD_DAYS = 180; // 修改为需要的天数
```

#### 启用/禁用 PR 检查

编辑 `docs-health-check.yml`：

```yaml
# 启用 PR 检查
pull_request:
  paths:
    - 'docs/**'

# 禁用 PR 检查（注释掉）
# pull_request:
#   paths:
#     - 'docs/**'
```

### 通知配置

#### 方案1: 通过 Slack 通知（推荐）

添加 Slack 通知步骤：

```yaml
- name: 📢 Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "⚠️ 文档健康检查发现陈旧文档",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "请查看 GitHub Actions 日志获取详情"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### 方案2: 通过邮件通知

```yaml
- name: 📧 Send email notification
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: ⚠️ 文档健康检查警告
    to: team@example.com
    from: GitHub Actions
    body: 检测到陈旧文档，请查看 Actions 日志
```

#### 方案3: 自动创建 Issue

```yaml
- name: 📝 Create issue for stale docs
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: '⚠️ 检测到陈旧文档',
        body: '文档健康检查发现以下文档需要更新...',
        labels: ['documentation', 'maintenance']
      });
```

### 权限说明

工作流需要以下权限：

| 权限 | 用途 | 默认 |
|------|------|------|
| `contents: read` | 读取仓库代码 | ✅ 已启用 |
| `issues: write` | 创建 Issue | ⚠️ 按需启用 |
| `pull-requests: write` | PR 评论 | ⚠️ 按需启用 |

### 故障排除

#### 问题1: 工作流没有运行

**检查**:
- 确认文件路径正确: `.github/workflows/docs-health-check.yml`
- 检查 YAML 语法是否正确
- 查看 Actions 标签是否有错误提示

#### 问题2: Git log 无法获取历史

**原因**: checkout 没有获取完整历史

**解决**:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # 必须设置为 0
```

#### 问题3: npm 命令找不到

**原因**: package.json 不在根目录或脚本未定义

**解决**:
- 确认 `package.json` 在项目根目录
- 确认定义了 `docs:health-check` 脚本

#### 问题4: 工作流一直失败

**检查**:
1. 查看 Actions 日志的详细错误
2. 在本地运行 `npm run docs:health-check` 测试
3. 确认 Node.js 版本兼容

### 最佳实践

#### 1. 定期查看报告

- **每月初**: 查看自动运行的结果
- **发现问题**: 及时安排文档更新
- **无问题**: 记录在团队会议中

#### 2. 结合其他检查

可以与其他质量检查一起运行：

```yaml
# 与测试一起运行
- name: Run tests
  run: npm test

- name: Run docs health check
  run: npm run docs:health-check
```

#### 3. 保存历史记录

使用 artifact 保存检查报告：

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: docs-health-check-${{ github.run_number }}
    path: docs/
    retention-days: 90
```

### 成本考虑

GitHub Actions 免费额度（公开仓库）：
- **公开仓库**: 无限制 ✅
- **私有仓库**: 每月 2000 分钟

本工作流每次运行约 **1-2 分钟**，每月运行 1 次，成本可忽略。

### 安全考虑

- ✅ 工作流只读取代码，不修改
- ✅ 不需要敏感凭据（除非配置通知）
- ✅ 可以在 fork 中安全运行
- ⚠️ 如果添加通知，需要安全存储 secrets

---

## 🚀 快速开始

### 启用工作流

1. **提交工作流文件**
   ```bash
   git add .github/workflows/docs-health-check.yml
   git commit -m "ci: Add documentation health check workflow"
   git push
   ```

2. **首次手动运行**
   - 进入 GitHub → Actions
   - 选择 Documentation Health Check
   - 点击 Run workflow

3. **查看结果**
   - 等待工作流完成
   - 查看输出日志

### 配置通知（可选）

1. **选择通知方式**（Slack / Email / Issue）
2. **配置 Secrets**（如果需要）
   - Settings → Secrets → New repository secret
3. **修改工作流文件**添加通知步骤
4. **测试通知**

---

## 📊 监控与维护

### 定期检查

- **每月**: 查看自动运行结果
- **每季度**: 评估工作流效果
- **每年**: 更新 GitHub Actions 版本

### 性能优化

如果工作流运行时间过长：

1. **缓存依赖**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **减少检查范围**（如果文档很多）

3. **调整运行频率**

---

## 📝 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0 | 2025-10-30 | 初始版本，支持定时和手动触发 |

---

© 2025 Project Ark Team. All Rights Reserved.


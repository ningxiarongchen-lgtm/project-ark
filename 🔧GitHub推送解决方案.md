# GitHub 推送解决方案

## 当前问题
无法连接到 GitHub (端口 443 超时)

## 解决方案

### 方案 1: 配置 HTTP 代理（如果您有科学上网工具）

```bash
# 设置 HTTP/HTTPS 代理（假设代理端口是 7890）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 或者只为 GitHub 设置代理
git config --global http.https://github.com.proxy http://127.0.0.1:7890

# 常见代理端口：
# - Clash: 7890
# - V2rayU: 1087
# - Shadowsocks: 1080
```

### 方案 2: 切换到 SSH 连接

```bash
# 1. 检查是否有 SSH 密钥
ls -al ~/.ssh

# 2. 如果没有，生成 SSH 密钥（邮箱改成您的）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 3. 复制公钥到剪贴板
cat ~/.ssh/id_ed25519.pub | pbcopy

# 4. 打开 GitHub，添加 SSH 密钥：
#    Settings -> SSH and GPG keys -> New SSH key
#    粘贴公钥内容

# 5. 修改远程仓库地址为 SSH
cd "/Users/hexiaoxiao/Desktop/Model Selection System"
git remote set-url origin git@github.com:ningxiarongchen-lgtm/project-ark.git

# 6. 测试连接
ssh -T git@github.com
```

### 方案 3: 解决分叉历史问题

在网络问题解决后，处理分叉的分支：

```bash
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 选项 A: 强制推送（会覆盖远程的 84 个提交）
git push origin main --force

# 选项 B: 拉取并合并（推荐）
git pull origin main --allow-unrelated-histories
# 解决冲突后
git push origin main

# 选项 C: 变基（保持线性历史）
git pull --rebase origin main
# 解决冲突后
git push origin main
```

### 方案 4: 使用 GitHub 镜像（临时方案）

```bash
# 修改为国内镜像（不推荐长期使用）
git remote set-url origin https://github.com.cnpmjs.org/ningxiarongchen-lgtm/project-ark.git
```

## 推荐流程

1. **首先配置代理**（如果有）
2. **测试连接**：`git fetch origin`
3. **解决分支分叉问题**
4. **推送代码**：`git push origin main`

## 快速诊断

```bash
# 检查当前 Git 配置
git config --list | grep -E "proxy|remote"

# 测试网络连接
curl -I https://github.com

# 检查分支状态
git status
git log --oneline -10
```

## 注意事项

⚠️ 使用 `--force` 推送会覆盖远程历史，确保：
- 团队其他成员已经同步
- 远程的 84 个提交不重要或已备份
- 或者您是唯一的开发者


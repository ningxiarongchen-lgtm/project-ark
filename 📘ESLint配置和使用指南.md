# 📘 ESLint配置和使用指南

## 🎯 为什么需要ESLint？

ESLint可以帮助我们：
1. **自动发现代码问题**：在推送前发现错误
2. **统一代码风格**：保持团队代码一致性
3. **防止常见错误**：如中文引号、未使用变量等
4. **提高代码质量**：遵循最佳实践

---

## 📦 已配置的功能

### ✅ 核心检查规则

#### 1. 中文标点符号检查 ⭐ 最重要
```javascript
// ❌ 错误：会导致Vercel构建失败
<Alert description="这是"错误"的用法" />

// ✅ 正确
<Alert description="这是正确的用法" />
```

**规则**：`no-irregular-whitespace`
- 检测JSX属性值中的中文引号
- 检测不规则的空白字符
- 防止Vercel/Netlify构建失败

#### 2. JSX语法检查
```javascript
// ❌ 错误：不必要的花括号
<div className={'container'}>

// ✅ 正确
<div className="container">
```

**规则**：`react/jsx-curly-brace-presence`
- 确保简单字符串不使用花括号
- 保持JSX代码简洁

#### 3. 调试代码检查
```javascript
// ⚠️ 警告：不应该提交到生产环境
console.log('debug info')
debugger

// ✅ 允许：错误日志
console.error('Error:', error)
console.warn('Warning:', warning)
```

**规则**：`no-console`, `no-debugger`
- 警告 console.log
- 错误 debugger
- 允许 console.warn 和 console.error

#### 4. 未使用变量检查
```javascript
// ⚠️ 警告：未使用的变量
const unusedVar = 'test'

// ✅ 正确：以下划线开头可忽略
const _unusedVar = 'test'
```

**规则**：`no-unused-vars`
- 检测未使用的变量、函数、参数
- 以 `_` 开头的变量会被忽略

#### 5. React Hooks检查
```javascript
// ❌ 错误：Hook在条件语句中
if (condition) {
  useEffect(() => {}, [])
}

// ✅ 正确：Hook在组件顶层
useEffect(() => {
  if (condition) {
    // ...
  }
}, [condition])
```

**规则**：`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`
- 确保Hooks调用顺序一致
- 检查useEffect依赖项

---

## 🚀 使用方法

### 1. 安装依赖

首次使用需要安装ESLint相关依赖：

```bash
cd frontend
npm install
```

这会安装：
- `eslint` - 核心工具
- `eslint-plugin-react` - React规则
- `eslint-plugin-react-hooks` - React Hooks规则
- `eslint-plugin-react-refresh` - React Fast Refresh规则

### 2. 日常使用命令

#### 检查代码
```bash
# 在frontend目录下
npm run lint

# 或在项目根目录
cd frontend && npm run lint
```

#### 自动修复
```bash
# 自动修复可修复的问题
npm run lint:fix
```

#### 严格检查（CI/CD）
```bash
# 不允许任何警告
npm run lint:check
```

### 3. 在编辑器中使用

#### VS Code
1. 安装扩展：`ESLint`（作者：Microsoft）
2. 配置自动修复（`.vscode/settings.json`）：
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ]
}
```

#### Cursor
Cursor内置ESLint支持，安装依赖后自动启用。

---

## 🔍 自动检查脚本

### 使用预推送检查脚本

在推送代码前，运行自动检查：

```bash
# 在项目根目录
./scripts/pre-push-check.sh
```

**检查内容**：
1. ✅ 中文标点符号检查
2. ⚠️ 调试代码检查
3. ✅ ESLint代码质量检查
4. ⚠️ Git未追踪文件检查
5. ⚠️ 大文件检查

**输出示例**：
```
🔍 开始代码推送前检查...

📝 检查1：中文标点符号检查
✅ 通过：未发现中文标点符号问题

📝 检查2：调试代码检查
✅ 通过：未发现调试代码

📝 检查3：ESLint代码质量检查
✅ 通过：ESLint检查通过

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 所有关键检查通过！可以安全推送
```

---

## ⚙️ 配置文件说明

### `.eslintrc.cjs`
主配置文件，定义所有ESLint规则。

### `.eslintignore`
忽略文件，排除不需要检查的目录：
- `node_modules/`
- `dist/`
- `build/`
- 等

---

## 🐛 常见问题

### Q1: ESLint报错但代码能运行？
**A**: ESLint是静态分析工具，发现的是潜在问题。即使代码能运行，也建议修复这些问题以提高代码质量。

### Q2: 如何临时禁用某个规则？
**A**: 使用注释：
```javascript
// 禁用整行
// eslint-disable-next-line no-console
console.log('This is ok')

// 禁用整个文件
/* eslint-disable no-console */
console.log('File-level disable')
/* eslint-enable no-console */
```

### Q3: 规则太严格怎么办？
**A**: 修改 `.eslintrc.cjs` 中的规则严格程度：
```javascript
rules: {
  'no-console': 'off',     // 关闭
  'no-console': 'warn',    // 警告
  'no-console': 'error',   // 错误
}
```

### Q4: 第三方库代码报错？
**A**: 第三方库不应该被检查，确保 `.eslintignore` 包含 `node_modules/`。

### Q5: 构建时ESLint检查太慢？
**A**: 可以在 `package.json` 的 `build` 脚本中移除ESLint检查，只在开发时检查：
```json
{
  "scripts": {
    "build": "vite build",  // 不包含lint
    "build:check": "npm run lint:check && vite build"  // 包含lint
  }
}
```

---

## 📝 推荐工作流程

### 开发中
1. 编辑器实时显示ESLint错误和警告
2. 保存时自动修复（如果配置了）
3. 定期运行 `npm run lint:fix`

### 提交前
1. 运行 `./scripts/pre-push-check.sh`
2. 修复所有 ❌ 标记的问题
3. 确认通过后提交

### CI/CD
在GitHub Actions或其他CI中添加：
```yaml
- name: Lint check
  run: cd frontend && npm run lint:check
```

---

## 🎯 最佳实践

### 1. 定期更新依赖
```bash
cd frontend
npm update eslint eslint-plugin-react eslint-plugin-react-hooks
```

### 2. 团队规则一致
确保所有团队成员使用相同的 `.eslintrc.cjs` 配置。

### 3. 渐进式采用
- 新代码：严格遵循所有规则
- 旧代码：可以临时禁用某些规则，逐步改进

### 4. 代码审查
在PR审查时，确保：
- ESLint检查通过
- 没有新增 `eslint-disable` 注释（除非有充分理由）

---

## 📚 相关文档

- [ESLint官方文档](https://eslint.org/)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [代码推送前完整自检清单](./📋代码推送前-完整自检清单.md)
- [个人资料和设置功能自检报告](./✅个人资料和设置功能-完整自检报告.md)

---

## 🔄 更新日志

**2025-11-01**
- ✅ 初始ESLint配置
- ✅ 添加中文标点符号检查
- ✅ 添加JSX语法检查
- ✅ 创建自动检查脚本
- ✅ 添加VSCode配置建议

---

**维护者**：开发团队
**最后更新**：2025-11-01


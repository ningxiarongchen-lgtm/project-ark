module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    // React相关
    'react/prop-types': 'off', // 不强制PropTypes，项目未使用
    'react/jsx-no-target-blank': 'warn',
    
    // ⭐ JSX字符串检查 - 防止中文引号等问题
    'react/jsx-curly-brace-presence': ['error', { 
      props: 'never', 
      children: 'never' 
    }],
    
    // ⭐ 检查不规则空白字符和特殊字符
    'no-irregular-whitespace': ['error', { 
      skipStrings: false,
      skipComments: false,
      skipRegExps: false,
      skipTemplates: false
    }],
    
    // 代码质量
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': ['warn', { 
      allow: ['warn', 'error'] 
    }],
    'no-debugger': 'error',
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}


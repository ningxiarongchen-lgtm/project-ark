/**
 * PM2 配置文件
 * Project Ark - CMAX系统
 * 
 * 使用方法：
 * pm2 start ecosystem.config.js --env production
 * pm2 start ecosystem.config.js --env development
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'cmax-backend',
      
      // 脚本路径
      cwd: './backend',
      script: 'server.js',
      
      // 实例配置
      instances: 2,  // 启动2个实例实现负载均衡
      exec_mode: 'cluster',  // 集群模式
      
      // 开发环境配置
      env: {
        NODE_ENV: 'development',
        PORT: 5001,
        MONGODB_URI: 'mongodb://localhost:27017/cmax'
      },
      
      // 生产环境配置
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
        // 其他配置从 .env.production 文件读取
      },
      
      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 进程管理
      autorestart: true,  // 自动重启
      max_restarts: 10,  // 最大重启次数
      min_uptime: '10s',  // 最小运行时间
      max_memory_restart: '1G',  // 内存超过1G自动重启
      
      // 监控配置
      watch: false,  // 生产环境不建议开启文件监控
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git'
      ],
      
      // 其他配置
      kill_timeout: 5000,  // 强制终止前等待时间
      wait_ready: true,  // 等待应用准备就绪
      listen_timeout: 10000  // 监听超时时间
    }
  ],
  
  /**
   * 部署配置（可选）
   */
  deploy: {
    // 生产环境部署配置
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourname/project-ark.git',
      path: '/var/www/cmax',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    // 测试环境部署配置
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:yourname/project-ark.git',
      path: '/var/www/cmax-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};


/** PM2 ecosystem — production process manager config
 *  Start:   pm2 start ecosystem.config.js --env production
 *  Cluster: pm2 start ecosystem.config.js --env production -i max
 */
module.exports = {
  apps: [
    {
      name: "wesleypaul",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,
      instances: "max",          // use all CPU cores
      exec_mode: "cluster",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Logging
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Auto-restart policy
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      // Watch — disabled in production (redeploy manually)
      watch: false,
    },
  ],
};

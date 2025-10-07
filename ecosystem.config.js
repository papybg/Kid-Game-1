module.exports = {
  apps: [
    {
      name: 'kidgame-server',
      script: 'tsx watch server/index.ts',
      instances: 1,
      autorestart: true,
      watch: ['server'],
      ignore_watch: ['node_modules', 'client'],
      env: {
        NODE_ENV: 'development',
  PORT: 3005
      }
    },
    {
      name: 'kidgame-client',
      script: 'vite',
      instances: 1,
      autorestart: true,
  args: '--host --port 8080 --strict-port',
      cwd: './client',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
// PM2 process for the Level Up Com site. Runs the production Next.js server on port 3002
// (levelup = 3000 and levelup-ai = 3001 are already live on this server).
module.exports = {
  apps: [
    {
      name: "levelup-com",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      env: { NODE_ENV: "production", PORT: "3002" },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
    },
  ],
};

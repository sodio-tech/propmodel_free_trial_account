module.exports = {
    apps : [{
      name      : 'admin_challenges',
      script    : './src/server.js',
      instances : '2', // or a specific number like 4
      exec_mode : 'cluster',
      watch     : false, // Restart on file changes
    }]
  
  }
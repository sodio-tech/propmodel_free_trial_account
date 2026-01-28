module.exports = {
    apps : [{
      name      : 'propmodel_free_trial_account',
      script    : './src/server.js',
      instances : '2', // or a specific number like 4
      exec_mode : 'cluster',
      watch     : false, // Restart on file changes
    }]
  
  }

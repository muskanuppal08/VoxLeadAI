const formatTime = () => new Date().toISOString().substring(11, 23);

export const logger = {
  info: (msg, meta = '') => console.log(`\x1b[36m[${formatTime()}] [INFO]\x1b[0m ${msg}`, meta ? meta : ''),
  voice: (msg, meta = '') => console.log(`\x1b[35m[${formatTime()}] [VOICE]\x1b[0m ${msg}`, meta ? meta : ''),
  success: (msg, meta = '') => console.log(`\x1b[32m[${formatTime()}] [SUCCESS]\x1b[0m ${msg}`, meta ? meta : ''),
  warn: (msg, meta = '') => console.warn(`\x1b[33m[${formatTime()}] [WARN]\x1b[0m ${msg}`, meta ? meta : ''),
  error: (msg, err = '') => console.error(`\x1b[31m[${formatTime()}] [ERROR]\x1b[0m ${msg}`, err ? err : '')
};

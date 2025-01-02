export const logger = {
  info: (data: Record<string, unknown>) => {
    console.log(JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      level: 'info'
    }, null, 2));
  },
  error: (data: Record<string, unknown>) => {
    console.error(JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      level: 'error'
    }, null, 2));
  }
};
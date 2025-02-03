export const logger = {
  debug: (data: Record<string, unknown>) => {
    console.debug(JSON.stringify({ level: 'debug', ...data }))
  },
  info: (data: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', ...data }))
  },
  warn: (data: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', ...data }))
  },
  error: (data: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', ...data }))
  }
}
export const logger = {
  info: (data: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', ...data }))
  },
  error: (data: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', ...data }))
  }
}
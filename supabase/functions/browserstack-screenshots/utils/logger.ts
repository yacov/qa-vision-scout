export const logger = {
  info: (data: Record<string, unknown>) => {
    console.log(JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      level: 'info'
    }))
  },
  error: (data: Record<string, unknown>) => {
    console.error(JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      level: 'error'
    }))
  }
}
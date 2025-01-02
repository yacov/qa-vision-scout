export const logger = {
  info: (data: Record<string, unknown>) => {
    console.log(JSON.stringify(data, null, 2));
  },
  error: (data: Record<string, unknown>) => {
    console.error(JSON.stringify(data, null, 2));
  }
}; 
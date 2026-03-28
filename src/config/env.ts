export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string || 'http://localhost:3000',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

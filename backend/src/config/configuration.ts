export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES ?? '30d',
  },
  wompi: {
    publicKey: process.env.WOMPI_PUBLIC_KEY ?? '',
    privateKey: process.env.WOMPI_PRIVATE_KEY ?? '',
    eventsSecret: process.env.WOMPI_EVENTS_SECRET ?? '',
    apiUrl:
      process.env.NODE_ENV === 'production'
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  },
  email: {
    from: process.env.EMAIL_FROM ?? 'noreply@nexuspos.app',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
  },
});

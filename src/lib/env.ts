export const IS_DB_CONFIGURED =
  typeof process.env.DATABASE_URL === 'string' &&
  /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || '');

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
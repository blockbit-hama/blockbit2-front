// src/config/environment.ts
// Manages configuration values based on environment.

// Environment type definition
type Environment = 'development' | 'production' | 'test';

// Current environment setting (default: development)
const currentEnv: Environment = 
  (process.env.NODE_ENV as Environment) || 'development';

// Environment-specific configuration values
const config = {
  development: {
    apiBaseUrl: 'http://localhost:8080',
    apiTimeout: 30000, // 30 seconds
  },
  production: {
    apiBaseUrl: 'https://api.blockbit.com', // Change to actual production URL when ready
    apiTimeout: 30000,
  },
  test: {
    apiBaseUrl: 'http://localhost:8080',
    apiTimeout: 5000,
  },
};

// Export configuration for current environment
export const env = config[currentEnv];

// Export individual config values for convenience
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
export const API_TIMEOUT = env.apiTimeout;

// 기타 환경 설정
export const APP_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = APP_ENV === 'production';
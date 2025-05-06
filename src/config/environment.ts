// src/config/environment.ts
// 환경에 따른 설정 값을 관리합니다.

// 환경 타입 정의
type Environment = 'development' | 'production' | 'test';

// 현재 환경 설정 (기본값: development)
const currentEnv: Environment = 
  (process.env.NODE_ENV as Environment) || 'development';

// 환경별 설정 값
const config = {
  development: {
    apiBaseUrl: 'http://localhost:8080',
    apiTimeout: 30000, // 30초
  },
  production: {
    apiBaseUrl: 'https://api.blockbit.com', // 실제 프로덕션 URL로 변경 필요
    apiTimeout: 30000,
  },
  test: {
    apiBaseUrl: 'http://localhost:8080',
    apiTimeout: 5000,
  },
};

// 현재 환경에 맞는 설정 내보내기
export const env = config[currentEnv];

// 편의를 위한 개별 설정 값 내보내기
export const API_BASE_URL = env.apiBaseUrl;
export const API_TIMEOUT = env.apiTimeout;

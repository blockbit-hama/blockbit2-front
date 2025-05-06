// src/services/apiService.ts
// API 호출을 위한 공통 서비스 모듈

import { API_BASE_URL } from '@/config/environment';
import { getCookie } from '@/lib/auth';

// API 오류 클래스 정의
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 기본 API 요청 옵션
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
};

/**
 * 인증 토큰을 포함한 API 요청을 수행하는 함수
 * @param endpoint API 엔드포인트 (슬래시(/)로 시작)
 * @param options 요청 옵션
 * @returns 응답 객체 또는 에러
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // 인증 토큰 가져오기
  const token = getCookie('auth_token');
  
  // 옵션 병합
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    },
  };
  
  try {
    // 요청 URL 생성 (이미 http://로 시작하는 경우 그대로 사용)
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // API 요청 실행
    const response = await fetch(url, mergedOptions);
    
    // 인증 오류 처리
    if (response.status === 401) {
      // 로그인 페이지로 리디렉션 또는 로그아웃 처리
      window.location.href = '/login';
      throw new ApiError('인증이 필요합니다.', 401);
    }
    
    // 응답이 성공적이지 않은 경우 에러 처리
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || '요청 처리 중 오류가 발생했습니다.',
        response.status,
        errorData
      );
    }
    
    // 빈 응답인 경우 처리
    if (response.status === 204) {
      return {} as T;
    }
    
    // 응답 데이터 파싱
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 기타 오류 처리
    throw new ApiError(
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      0
    );
  }
};

/**
 * GET 요청을 수행하는 함수
 * @param endpoint API 엔드포인트
 * @param params URL 쿼리 파라미터 (선택적)
 */
export const apiGet = async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
  // 쿼리 파라미터 처리
  let url = endpoint;
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    url = `${endpoint}?${queryParams.toString()}`;
  }
  
  return apiRequest<T>(url, { method: 'GET' });
};

/**
 * POST 요청을 수행하는 함수
 * @param endpoint API 엔드포인트
 * @param data 요청 본문 데이터
 */
export const apiPost = async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT 요청을 수행하는 함수
 * @param endpoint API 엔드포인트
 * @param data 요청 본문 데이터
 */
export const apiPut = async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PATCH 요청을 수행하는 함수
 * @param endpoint API 엔드포인트
 * @param data 요청 본문 데이터
 */
export const apiPatch = async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE 요청을 수행하는 함수
 * @param endpoint API 엔드포인트
 */
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

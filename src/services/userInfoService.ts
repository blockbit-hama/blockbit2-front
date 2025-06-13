// src/services/userInfoService.ts
// 사용자 정보 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';

/**
 * 사용자 정보 응답 인터페이스 (백엔드 UserInfoResponseDTO 매칭)
 */
export interface UserInfo extends CommonFields {
  usiNum?: number;          // 사용자 번호
  usiId: string;            // 사용자 ID
  usiPwd?: string;          // 비밀번호 (응답시 제외됨)
  usiName: string;          // 사용자명
  usiPhoneNum?: string;     // 전화번호
  usiEmail?: string;        // 이메일
  usiLoginDat?: string;     // 로그인일자 (YYYYMMDD)
  usiLoginTim?: string;     // 로그인시간 (HHMMSS)
  usiLastLoginDat?: string; // 지난로그인일자 (YYYYMMDD)
  usiLastLoginTim?: string; // 지난로그인시간 (HHMMSS)
}

/**
 * 사용자 정보 요청 인터페이스 (백엔드 UserInfoRequestDTO 매칭)
 */
export interface UserInfoRequest {
  usiNum?: number;
  usiId: string;
  usiPwd?: string;
  usiName: string;
  usiPhoneNum?: string;
  usiEmail?: string;
  [key: string]: unknown;
}

/**
 * 사용자 정보 생성 응답 인터페이스
 */
export interface UserInfoCreateResponse extends CreateResponse {
  data?: {
    usiNum: number;
  };
}

/**
 * 로그인 요청 인터페이스
 */
export interface LoginRequest {
  usiId: string;
  usiPwd: string;
  [key: string]: unknown;
}

/**
 * 로그인 응답 인터페이스
 */
export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: UserInfo;
  };
  message?: string;
}

/**
 * 사용자 목록 조회 (페이징 지원)
 * GET /api/usi/list
 * @param params 페이징 파라미터 (offset, limit)
 * @returns 사용자 목록
 */
export const getUserInfoList = async (params?: ListParams): Promise<UserInfo[]> => {
  const response = await apiGet<ApiResponse<UserInfo[]>>('/api/users', params as Record<string, string | number | boolean>);
  return response.data || [];
};

/**
 * 사용자 단건 조회
 * GET /api/usi/{usiNum}
 * @param usiNum 사용자 번호
 * @returns 사용자 정보
 */
export const getUserInfoById = async (usiNum: number): Promise<UserInfo> => {
  const response = await apiGet<ApiResponse<UserInfo>>(`/api/usi/${usiNum}`);
  if (!response.data) {
    throw new Error('User not found');
  }
  return response.data;
};

/**
 * 사용자 등록
 * POST /api/usi
 * @param userInfo 사용자 정보
 * @returns 생성된 사용자 번호 포함 응답
 */
export const createUserInfo = async (userInfo: UserInfoRequest): Promise<UserInfoCreateResponse> => {
  return apiPost<UserInfoCreateResponse, UserInfoRequest>('/api/usi', userInfo);
};

/**
 * 사용자 수정
 * PUT /api/usi/{usiNum}
 * @param usiNum 사용자 번호
 * @param userInfo 수정할 사용자 정보
 * @returns 수정 완료 응답
 */
export const updateUserInfo = async (usiNum: number, userInfo: UserInfoRequest): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, UserInfoRequest>(`/api/usi/${usiNum}`, userInfo);
};

/**
 * 사용자 삭제 (논리삭제)
 * DELETE /api/usi/{usiNum}
 * @param usiNum 사용자 번호
 * @returns 삭제 완료 응답
 */
export const deleteUserInfo = async (usiNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/usi/${usiNum}`);
};

// ========== 인증 관련 함수들 ==========

/**
 * 로그인
 * POST /api/auth/login
 * @param credentials 로그인 정보
 * @returns 토큰과 사용자 정보
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiPost<LoginResponse, LoginRequest>('/api/auth/login', credentials);
};

/**
 * 로그아웃
 * POST /api/auth/logout
 * @returns 로그아웃 완료 응답
 */
export const logout = async (): Promise<SimpleResponse> => {
  return apiPost<SimpleResponse>('/api/auth/logout');
};

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 * @returns 현재 로그인한 사용자 정보
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await apiGet<ApiResponse<UserInfo>>('/api/auth/me');
  if (!response.data) {
    throw new Error('User not authenticated');
  }
  return response.data;
};

/**
 * 비밀번호 변경
 * PUT /api/auth/password
 * @param data 비밀번호 변경 정보
 * @returns 변경 완료 응답
 */
export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, typeof data>('/api/auth/password', data);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 사용자 ID로 사용자 정보 조회
 * @param userId 사용자 ID
 * @returns 사용자 정보 (없으면 null)
 */
export const getUserInfoByUserId = async (userId: string): Promise<UserInfo | null> => {
  const users = await getUserInfoList();
  return users.find(user => 
    user.usiId === userId && 
    user.active === '1'
  ) || null;
};

/**
 * 이메일로 사용자 정보 조회
 * @param email 이메일
 * @returns 사용자 정보 (없으면 null)
 */
export const getUserInfoByEmail = async (email: string): Promise<UserInfo | null> => {
  const users = await getUserInfoList();
  return users.find(user => 
    user.usiEmail === email && 
    user.active === '1'
  ) || null;
};

/**
 * 활성 사용자 목록만 조회
 * @returns 활성 상태인 사용자 목록
 */
export const getActiveUsers = async (): Promise<UserInfo[]> => {
  const users = await getUserInfoList();
  return users.filter(user => user.active === '1');
};

/**
 * 사용자 검색
 * @param searchTerm 검색어 (사용자명, 사용자ID, 이메일)
 * @returns 검색된 사용자 목록
 */
export const searchUsers = async (searchTerm: string): Promise<UserInfo[]> => {
  const users = await getUserInfoList();
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  
  return users.filter(user => 
    user.active === '1' && (
      user.usiName.toLowerCase().includes(lowercaseSearchTerm) ||
      user.usiId.toLowerCase().includes(lowercaseSearchTerm) ||
      (user.usiEmail && user.usiEmail.toLowerCase().includes(lowercaseSearchTerm))
    )
  );
};

/**
 * 사용자 ID 중복 확인
 * @param userId 확인할 사용자 ID
 * @returns 중복 여부 (true: 중복됨, false: 사용가능)
 */
export const checkUserIdExists = async (userId: string): Promise<boolean> => {
  try {
    const user = await getUserInfoByUserId(userId);
    return user !== null;
  } catch (error) {
    return false;
  }
};

/**
 * 이메일 중복 확인
 * @param email 확인할 이메일
 * @returns 중복 여부 (true: 중복됨, false: 사용가능)
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const user = await getUserInfoByEmail(email);
    return user !== null;
  } catch (error) {
    return false;
  }
};

/**
 * 사용자 프로필 업데이트 (비밀번호 제외)
 * @param usiNum 사용자 번호
 * @param profileData 프로필 정보
 * @returns 업데이트 완료 응답
 */
export const updateUserProfile = async (
  usiNum: number, 
  profileData: Pick<UserInfoRequest, 'usiName' | 'usiPhoneNum' | 'usiEmail'>
): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, typeof profileData>(`/api/usi/${usiNum}/profile`, profileData);
};
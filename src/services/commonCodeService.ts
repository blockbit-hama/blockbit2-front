import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';

/**
 * 공통코드 응답 인터페이스 (백엔드 CommonCodeResponseDTO 매칭)
 */
export interface CommonCode extends CommonFields {
  codNum?: number;        // 코드 번호
  codType: string;        // 코드 타입 (예: docRoleType, status)
  codKey: string;         // 코드 키 (예: 1, 2, 3)
  codVal: string;         // 코드 값 (예: Admin, User, Guest)
  codDesc?: string;       // 코드 설명
}

/**
 * 공통코드 요청 인터페이스 (백엔드 CommonCodeRequestDTO 매칭)
 */
export interface CommonCodeRequest {
  codNum?: number;
  codType: string;
  codKey: string;
  codVal: string;
  codDesc?: string;
  [key: string]: unknown;
}

/**
 * 공통코드 생성 응답 인터페이스
 */
export interface CommonCodeCreateResponse extends CreateResponse {
  data?: {
    codNum: number;
  };
}

/**
 * 공통코드 목록 조회 (페이징 지원)
 * GET /api/cod/list
 * @param params 페이징 파라미터 (offset, limit)
 * @returns 공통코드 목록
 */
export const getCommonCodeList = async (params?: ListParams): Promise<CommonCode[]> => {
  const response = await apiGet<ApiResponse<CommonCode[]>>('/api/cod/list', params as Record<string, string | number | boolean>);
  return response.data || [];
};

/**
 * 공통코드 단건 조회
 * GET /api/cod/{codNum}
 * @param codNum 코드 번호
 * @returns 공통코드 정보
 */
export const getCommonCodeById = async (codNum: number): Promise<CommonCode> => {
  const response = await apiGet<ApiResponse<CommonCode>>(`/api/cod/${codNum}`);
  if (!response.data) {
    throw new Error('Common code not found');
  }
  return response.data;
};

/**
 * 공통코드 등록
 * POST /api/cod
 * @param commonCode 공통코드 정보
 * @returns 생성된 코드 번호 포함 응답
 */
export const createCommonCode = async (commonCode: CommonCodeRequest): Promise<CommonCodeCreateResponse> => {
  return apiPost<CommonCodeCreateResponse, CommonCodeRequest>('/api/cod', commonCode);
};

/**
 * 공통코드 수정
 * PUT /api/cod
 * @param commonCode 수정할 공통코드 정보 (codNum 필수)
 * @returns 수정 완료 응답
 */
export const updateCommonCode = async (commonCode: CommonCodeRequest & { codNum: number }): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, CommonCodeRequest>('/api/cod', commonCode);
};

/**
 * 공통코드 삭제 (논리삭제)
 * DELETE /api/cod/{codNum}
 * @param codNum 코드 번호
 * @returns 삭제 완료 응답
 */
export const deleteCommonCode = async (codNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/cod/${codNum}`);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 코드 타입별 공통코드 조회
 * @param codType 코드 타입 (예: 'docRoleType', 'status')
 * @returns 해당 타입의 활성 공통코드 목록
 */
export const getCommonCodesByType = async (codType: string): Promise<CommonCode[]> => {
  const codes = await getCommonCodeList();
  return codes.filter(code => 
    code.codType === codType && 
    code.active === '1'
  ).sort((a, b) => a.codKey.localeCompare(b.codKey));
};

/**
 * 코드 키로 공통코드 값 조회
 * @param codType 코드 타입
 * @param codKey 코드 키
 * @returns 코드 값 (없으면 null)
 */
export const getCommonCodeValue = async (codType: string, codKey: string): Promise<string | null> => {
  const codes = await getCommonCodesByType(codType);
  const code = codes.find(c => c.codKey === codKey);
  return code?.codVal || null;
};

/**
 * 코드 값으로 공통코드 키 조회
 * @param codType 코드 타입
 * @param codVal 코드 값
 * @returns 코드 키 (없으면 null)
 */
export const getCommonCodeKey = async (codType: string, codVal: string): Promise<string | null> => {
  const codes = await getCommonCodesByType(codType);
  const code = codes.find(c => c.codVal === codVal);
  return code?.codKey || null;
};

/**
 * 활성 공통코드 목록만 조회
 * @returns 활성 상태인 공통코드 목록
 */
export const getActiveCommonCodes = async (): Promise<CommonCode[]> => {
  const codes = await getCommonCodeList();
  return codes.filter(code => code.active === '1');
};

/**
 * 공통코드 검색
 * @param searchTerm 검색어 (코드값 또는 설명)
 * @returns 검색된 공통코드 목록
 */
export const searchCommonCodes = async (searchTerm: string): Promise<CommonCode[]> => {
  const codes = await getCommonCodeList();
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  
  return codes.filter(code => 
    code.active === '1' && (
      code.codVal.toLowerCase().includes(lowercaseSearchTerm) ||
      (code.codDesc && code.codDesc.toLowerCase().includes(lowercaseSearchTerm))
    )
  );
};

/**
 * 코드 타입 목록 조회 (중복 제거)
 * @returns 사용 중인 코드 타입 목록
 */
export const getCodeTypes = async (): Promise<string[]> => {
  const codes = await getActiveCommonCodes();
  const types = codes.map(code => code.codType);
  return [...new Set(types)].sort();
};

/**
 * 특정 타입의 코드를 키-값 매핑 객체로 반환
 * @param codType 코드 타입
 * @returns 키-값 매핑 객체
 */
export const getCommonCodeMap = async (codType: string): Promise<Record<string, string>> => {
  const codes = await getCommonCodesByType(codType);
  const map: Record<string, string> = {};
  
  codes.forEach(code => {
    map[code.codKey] = code.codVal;
  });
  
  return map;
};

/**
 * 공통코드를 Select 옵션 형태로 변환
 * @param codType 코드 타입
 * @returns Select 옵션 배열
 */
export const getCommonCodeOptions = async (codType: string): Promise<Array<{ value: string; label: string; description?: string }>> => {
  const codes = await getCommonCodesByType(codType);
  
  return codes.map(code => ({
    value: code.codKey,
    label: code.codVal,
    description: code.codDesc
  }));
};
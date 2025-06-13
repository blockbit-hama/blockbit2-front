// src/services/walletUserMappingService.ts
// 지갑-사용자 매핑 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';

/**
 * 지갑 역할 타입 정의
 */
export type WalletRole = 'owner' | 'admin' | 'viewer' | 'signer';

/**
 * 지갑-사용자 매핑 응답 인터페이스
 */
export interface WalletUserMapping extends CommonFields {
  wumNum?: number;        // 매핑 번호
  usiNum: number;         // 사용자 번호
  walNum: number;         // 지갑 번호
  wumRole: WalletRole;    // 지갑 역할
}

/**
 * 지갑-사용자 매핑 요청 인터페이스
 */
export interface WalletUserMappingRequest {
  wumNum?: number;
  usiNum: number;
  walNum: number;
  wumRole: WalletRole;
  [key: string]: unknown;
}

/**
 * 지갑-사용자 매핑 생성 응답 인터페이스
 */
export interface WalletUserMappingCreateResponse extends CreateResponse {
  data?: {
    wumNum: number;
  };
}

/**
 * 지갑-사용자 매핑 목록 조회 (페이징 지원)
 * GET /api/wum/list
 * @param params 페이징 파라미터 (offset, limit)
 * @returns 매핑 목록
 */
export const getWalletUserMappingList = async (params?: ListParams): Promise<WalletUserMapping[]> => {
  const response = await apiGet<ApiResponse<WalletUserMapping[]>>('/api/wum/list', params as Record<string, string | number | boolean> | undefined);
  return response.data || [];
};

/**
 * 지갑-사용자 매핑 단건 조회
 * GET /api/wum/{wumNum}
 * @param wumNum 매핑 번호
 * @returns 매핑 정보
 */
export const getWalletUserMappingById = async (wumNum: number): Promise<WalletUserMapping> => {
  const response = await apiGet<ApiResponse<WalletUserMapping>>(`/api/wum/${wumNum}`);
  if (!response.data) {
    throw new Error('Wallet user mapping not found');
  }
  return response.data;
};

/**
 * 지갑-사용자 매핑 등록
 * POST /api/wum
 * @param mapping 매핑 정보
 * @returns 생성된 매핑 번호 포함 응답
 */
export const createWalletUserMapping = async (mapping: WalletUserMappingRequest): Promise<WalletUserMappingCreateResponse> => {
  return apiPost<WalletUserMappingCreateResponse, WalletUserMappingRequest>('/api/wum', mapping);
};

/**
 * 지갑-사용자 매핑 수정
 * PUT /api/wum/{wumNum}
 * @param wumNum 매핑 번호
 * @param mapping 수정할 매핑 정보
 * @returns 수정 완료 응답
 */
export const updateWalletUserMapping = async (wumNum: number, mapping: WalletUserMappingRequest): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, WalletUserMappingRequest>(`/api/wum/${wumNum}`, mapping);
};

/**
 * 지갑-사용자 매핑 삭제 (논리삭제)
 * DELETE /api/wum/{wumNum}
 * @param wumNum 매핑 번호
 * @returns 삭제 완료 응답
 */
export const deleteWalletUserMapping = async (wumNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/wum/${wumNum}`);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 사용자별 지갑 매핑 조회
 * @param usiNum 사용자 번호
 * @returns 해당 사용자의 지갑 매핑 목록
 */
export const getWalletMappingsByUser = async (usiNum: number): Promise<WalletUserMapping[]> => {
  const mappings = await getWalletUserMappingList();
  return mappings.filter(mapping => 
    mapping.usiNum === usiNum && 
    mapping.active === '1'
  );
};

/**
 * 지갑별 사용자 매핑 조회
 * @param walNum 지갑 번호
 * @returns 해당 지갑의 사용자 매핑 목록
 */
export const getUserMappingsByWallet = async (walNum: number): Promise<WalletUserMapping[]> => {
  const mappings = await getWalletUserMappingList();
  return mappings.filter(mapping => 
    mapping.walNum === walNum && 
    mapping.active === '1'
  );
};

/**
 * 역할별 지갑 매핑 조회
 * @param role 지갑 역할
 * @returns 해당 역할의 매핑 목록
 */
export const getWalletMappingsByRole = async (role: WalletRole): Promise<WalletUserMapping[]> => {
  const mappings = await getWalletUserMappingList();
  return mappings.filter(mapping => 
    mapping.wumRole === role && 
    mapping.active === '1'
  );
};

/**
 * 특정 사용자의 특정 지갑에서의 역할 조회
 * @param usiNum 사용자 번호
 * @param walNum 지갑 번호
 * @returns 사용자의 지갑 역할 (없으면 null)
 */
export const getUserWalletRole = async (usiNum: number, walNum: number): Promise<WalletRole | null> => {
  const mappings = await getWalletUserMappingList();
  const mapping = mappings.find(m => 
    m.usiNum === usiNum && 
    m.walNum === walNum && 
    m.active === '1'
  );
  return mapping?.wumRole || null;
};

/**
 * 사용자가 지갑에 대한 권한을 가지고 있는지 확인
 * @param usiNum 사용자 번호
 * @param walNum 지갑 번호
 * @param requiredRoles 필요한 역할들
 * @returns 권한 보유 여부
 */
export const hasWalletPermission = async (
  usiNum: number, 
  walNum: number, 
  requiredRoles: WalletRole[]
): Promise<boolean> => {
  const userRole = await getUserWalletRole(usiNum, walNum);
  return userRole ? requiredRoles.includes(userRole) : false;
};

/**
 * 지갑 소유자 조회
 * @param walNum 지갑 번호
 * @returns 지갑 소유자 매핑 (없으면 null)
 */
export const getWalletOwner = async (walNum: number): Promise<WalletUserMapping | null> => {
  const mappings = await getUserMappingsByWallet(walNum);
  return mappings.find(mapping => mapping.wumRole === 'owner') || null;
};

/**
 * 지갑 관리자 목록 조회
 * @param walNum 지갑 번호
 * @returns 지갑 관리자 매핑 목록
 */
export const getWalletAdmins = async (walNum: number): Promise<WalletUserMapping[]> => {
  const mappings = await getUserMappingsByWallet(walNum);
  return mappings.filter(mapping => 
    mapping.wumRole === 'admin' || mapping.wumRole === 'owner'
  );
};

/**
 * 지갑 서명자 목록 조회
 * @param walNum 지갑 번호
 * @returns 지갑 서명자 매핑 목록
 */
export const getWalletSigners = async (walNum: number): Promise<WalletUserMapping[]> => {
  const mappings = await getUserMappingsByWallet(walNum);
  return mappings.filter(mapping => 
    ['owner', 'admin', 'signer'].includes(mapping.wumRole)
  );
};

/**
 * 사용자를 지갑에 추가
 * @param usiNum 사용자 번호
 * @param walNum 지갑 번호
 * @param role 역할
 * @returns 생성 응답
 */
export const addUserToWallet = async (
  usiNum: number, 
  walNum: number, 
  role: WalletRole
): Promise<WalletUserMappingCreateResponse> => {
  // 기존 매핑이 있는지 확인
  const existingRole = await getUserWalletRole(usiNum, walNum);
  if (existingRole) {
    throw new Error('User is already mapped to this wallet');
  }
  
  return createWalletUserMapping({
    usiNum,
    walNum,
    wumRole: role
  });
};

/**
 * 사용자의 지갑 역할 변경
 * @param usiNum 사용자 번호
 * @param walNum 지갑 번호
 * @param newRole 새로운 역할
 * @returns 수정 응답
 */
export const changeUserWalletRole = async (
  usiNum: number, 
  walNum: number, 
  newRole: WalletRole
): Promise<SimpleResponse> => {
  const mappings = await getWalletUserMappingList();
  const mapping = mappings.find(m => 
    m.usiNum === usiNum && 
    m.walNum === walNum && 
    m.active === '1'
  );
  
  if (!mapping) {
    throw new Error('User wallet mapping not found');
  }
  
  return updateWalletUserMapping(mapping.wumNum!, {
    ...mapping,
    wumRole: newRole
  });
};

/**
 * 지갑에서 사용자 제거
 * @param usiNum 사용자 번호
 * @param walNum 지갑 번호
 * @returns 삭제 응답
 */
export const removeUserFromWallet = async (usiNum: number, walNum: number): Promise<SimpleResponse> => {
  const mappings = await getWalletUserMappingList();
  const mapping = mappings.find(m => 
    m.usiNum === usiNum && 
    m.walNum === walNum && 
    m.active === '1'
  );
  
  if (!mapping) {
    throw new Error('User wallet mapping not found');
  }
  
  return deleteWalletUserMapping(mapping.wumNum!);
};

/**
 * 사용자가 소유한 지갑 목록 조회
 * @param usiNum 사용자 번호
 * @returns 소유 지갑 매핑 목록
 */
export const getOwnedWallets = async (usiNum: number): Promise<WalletUserMapping[]> => {
  const mappings = await getWalletMappingsByUser(usiNum);
  return mappings.filter(mapping => mapping.wumRole === 'owner');
};

/**
 * 사용자가 관리하는 지갑 목록 조회 (소유 + 관리)
 * @param usiNum 사용자 번호
 * @returns 관리 지갑 매핑 목록
 */
export const getManagedWallets = async (usiNum: number): Promise<WalletUserMapping[]> => {
  const mappings = await getWalletMappingsByUser(usiNum);
  return mappings.filter(mapping => 
    mapping.wumRole === 'owner' || mapping.wumRole === 'admin'
  );
};

/**
 * 지갑 매핑 통계 조회
 * @param walNum 지갑 번호 (선택사항)
 * @returns 매핑 통계
 */
export const getWalletMappingStats = async (walNum?: number): Promise<{
  totalMappings: number;
  byRole: Record<WalletRole, number>;
  byWallet?: Record<number, number>;
}> => {
  let mappings = await getWalletUserMappingList();
  
  if (walNum) {
    mappings = mappings.filter(m => m.walNum === walNum);
  }
  
  const activeMappings = mappings.filter(m => m.active === '1');
  
  const stats = {
    totalMappings: activeMappings.length,
    byRole: {
      'owner': activeMappings.filter(m => m.wumRole === 'owner').length,
      'admin': activeMappings.filter(m => m.wumRole === 'admin').length,
      'viewer': activeMappings.filter(m => m.wumRole === 'viewer').length,
      'signer': activeMappings.filter(m => m.wumRole === 'signer').length,
    } as Record<WalletRole, number>,
    byWallet: undefined as Record<number, number> | undefined
  };
  
  if (!walNum) {
    // 지갑별 매핑 수 계산
    const walletCounts: Record<number, number> = {};
    activeMappings.forEach(mapping => {
      walletCounts[mapping.walNum] = (walletCounts[mapping.walNum] || 0) + 1;
    });
    stats.byWallet = walletCounts;
  }
  
  return stats;
};
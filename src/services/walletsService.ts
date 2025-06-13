import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';
import { getUserInfoList, UserInfo } from '@/services/userInfoService';

/**
 * 지갑 타입 정의
 */
export type WalletType = 'Self-custody Hot' | 'Cold' | 'Trading';
export type WalletProtocol = 'MPC' | 'Multisig';
export type WalletStatus = 'frozen' | 'archived' | 'active';

/**
 * 지갑 응답 인터페이스 (백엔드 WalletsResponseDTO 매칭)
 */
export interface Wallet extends CommonFields {
  walNum?: number;        // 지갑 번호
  walName: string;        // 지갑명
  walType: WalletType;    // 지갑 타입
  walProtocol: WalletProtocol; // 지갑 프로토콜
  walStatus: WalletStatus; // 지갑 상태
  wumRole: string;         // 지갑 역할
  astNum?: number;        // 자산 번호 (외래키)
  polNum?: number;        // 정책 번호 (외래키)
}

/**
 * 지갑 요청 인터페이스 (백엔드 WalletsRequestDTO 매칭)
 */
export interface WalletRequest {
  walNum?: number;
  walName: string;
  walType: WalletType;
  walProtocol: WalletProtocol;
  walStatus: WalletStatus;
  astNum?: number;
  polNum?: number;
  [key: string]: unknown;
}

/**
 * 지갑 생성 응답 인터페이스
 */
export interface WalletCreateResponse extends CreateResponse {
  data?: {
    walNum: number;
  };
}

/**
 * 지갑 목록 조회 (페이징 지원)
 * GET /api/wal/list
 * @param params 페이징 파라미터 (offset, limit)
 * @returns 지갑 목록
 */
export const getWalletList = async (params?: ListParams): Promise<Wallet[]> => {
  const response = await apiGet<ApiResponse<Wallet[]>>('/api/wal/list', params as Record<string, string | number | boolean> | undefined);
  return response.data || [];
};

/**
 * 지갑 단건 조회
 * GET /api/wal/{walNum}
 * @param walNum 지갑 번호
 * @returns 지갑 정보
 */
export const getWalletById = async (walNum: number): Promise<Wallet> => {
  const response = await apiGet<ApiResponse<Wallet>>(`/api/wal/${walNum}`);
  if (!response.data) {
    throw new Error('Wallet not found');
  }
  return response.data;
};

/**
 * 지갑 등록
 * POST /api/wal
 * @param wallet 지갑 정보
 * @returns 생성된 지갑 번호 포함 응답
 */
export const createWallet = async (wallet: WalletRequest): Promise<WalletCreateResponse> => {
  return apiPost<WalletCreateResponse, WalletRequest>('/api/wal', wallet);
};

export const createBitcoinWallet = async (wallet: WalletRequest): Promise<WalletCreateResponse> => {
  return apiPost<WalletCreateResponse, WalletRequest>('/api/wallet/bitcoin/create', wallet);
};

/**
 * 지갑 수정
 * PUT /api/wal/{walNum}
 * @param walNum 지갑 번호
 * @param wallet 수정할 지갑 정보
 * @returns 수정 완료 응답
 */
export const updateWallet = async (walNum: number, wallet: WalletRequest): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, WalletRequest>(`/api/wal/${walNum}`, wallet);
};

/**
 * 지갑 삭제 (논리삭제)
 * DELETE /api/wal/{walNum}
 * @param walNum 지갑 번호
 * @returns 삭제 완료 응답
 */
export const deleteWallet = async (walNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/wal/${walNum}`);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 지갑 타입별 조회
 * @param walletType 지갑 타입
 * @returns 해당 타입의 활성 지갑 목록
 */
export const getWalletsByType = async (walletType: WalletType): Promise<Wallet[]> => {
  const wallets = await getWalletList();
  return wallets.filter(wallet => 
    wallet.walType === walletType && 
    wallet.active === '1'
  );
};

/**
 * 지갑 상태별 조회
 * @param status 지갑 상태
 * @returns 해당 상태의 지갑 목록
 */
export const getWalletsByStatus = async (status: WalletStatus): Promise<Wallet[]> => {
  const wallets = await getWalletList();
  return wallets.filter(wallet => 
    wallet.walStatus === status && 
    wallet.active === '1'
  );
};

/**
 * 지갑 프로토콜별 조회
 * @param protocol 지갑 프로토콜
 * @returns 해당 프로토콜의 활성 지갑 목록
 */
export const getWalletsByProtocol = async (protocol: WalletProtocol): Promise<Wallet[]> => {
  const wallets = await getWalletList();
  return wallets.filter(wallet => 
    wallet.walProtocol === protocol && 
    wallet.active === '1'
  );
};

/**
 * 자산별 지갑 조회
 * @param astNum 자산 번호
 * @returns 해당 자산의 활성 지갑 목록
 */
export const getWalletsByAsset = async (astNum: number): Promise<Wallet[]> => {
  const wallets = await getWalletList();
  return wallets.filter(wallet => 
    wallet.astNum === astNum && 
    wallet.active === '1'
  );
};

/**
 * 활성 지갑 목록만 조회
 * @returns 활성 상태인 지갑 목록
 */
export const getActiveWallets = async (): Promise<Wallet[]> => {
  const wallets = await getWalletList();
  return wallets.filter(wallet => 
    wallet.active === '1' && 
    wallet.walStatus === 'active'
  );
};

/**
 * 지갑 검색
 * @param searchTerm 검색어 (지갑명)
 * @returns 검색된 지갑 목록
 */
export const searchWallets = async (searchTerm: string): Promise<Wallet[]> => {
  const wallets = await getWalletList();
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  
  return wallets.filter(wallet => 
    wallet.active === '1' && 
    wallet.walName.toLowerCase().includes(lowercaseSearchTerm)
  );
};

/**
 * 지갑 상태 변경
 * @param walNum 지갑 번호
 * @param newStatus 새로운 상태
 * @returns 상태 변경 완료 응답
 */
export const changeWalletStatus = async (walNum: number, newStatus: WalletStatus): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, { walStatus: WalletStatus }>(`/api/wal/${walNum}/status`, {
    walStatus: newStatus
  });
};

/**
 * 지갑 이름 중복 확인
 * @param walletName 확인할 지갑명
 * @returns 중복 여부 (true: 중복됨, false: 사용가능)
 */
export const checkWalletNameExists = async (walletName: string): Promise<boolean> => {
  try {
    const wallets = await getWalletList();
    return wallets.some(wallet => 
      wallet.walName === walletName && 
      wallet.active === '1'
    );
  } catch (error) {
    return false;
  }
};

/**
 * 사용자별 지갑 조회 (지갑-사용자 매핑 테이블 기반)
 * @param usiNum 사용자 번호
 * @returns 해당 사용자의 지갑 목록
 */
export const getWalletsByUser = async (usiNum: number): Promise<Wallet[]> => {
  const response = await apiGet<ApiResponse<Wallet[]>>(`/api/wal/wad/list/${usiNum}`);
  return response.data || [];
};

/**
 * 지갑 통계 조회
 * @returns 지갑 통계 정보
 */
export const getWalletStats = async (): Promise<{
  totalCount: number;
  activeCount: number;
  frozenCount: number;
  archivedCount: number;
  byType: Record<WalletType, number>;
  byProtocol: Record<WalletProtocol, number>;
}> => {
  const wallets = await getWalletList();
  const activeWallets = wallets.filter(w => w.active === '1');
  
  return {
    totalCount: activeWallets.length,
    activeCount: activeWallets.filter(w => w.walStatus === 'active').length,
    frozenCount: activeWallets.filter(w => w.walStatus === 'frozen').length,
    archivedCount: activeWallets.filter(w => w.walStatus === 'archived').length,
    byType: {
      'Self-custody Hot': activeWallets.filter(w => w.walType === 'Self-custody Hot').length,
      'Cold': activeWallets.filter(w => w.walType === 'Cold').length,
      'Trading': activeWallets.filter(w => w.walType === 'Trading').length,
    },
    byProtocol: {
      'MPC': activeWallets.filter(w => w.walProtocol === 'MPC').length,
      'Multisig': activeWallets.filter(w => w.walProtocol === 'Multisig').length,
    }
  };
};

/**
 * 특정 지갑과 연관된 사용자 목록 조회
 * GET /api/wal/users/list/{walNum}
 * @param walNum 지갑 번호
 * @param params (선택) 페이징 파라미터 (offset, limit)
 * @returns 사용자 목록
 */
export const getWalletUsersList = async (
  walNum: number,
  params?: { offset?: number; limit?: number }
): Promise<UserInfo[]> => {
  const response = await apiGet<ApiResponse<UserInfo[]>>(`/api/wal/users/list/${walNum}`, params as Record<string, string | number | boolean>);
  return response.data || [];
};
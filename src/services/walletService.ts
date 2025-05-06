// src/services/walletService.ts
// 지갑 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// 지갑 인터페이스
export interface Wallet {
  walNum?: number;
  walName: string;
  walType: string;
  walProtocol: string;
  walPwd?: string;
  walStatus: string;
  usiNum: number | null;
  astId: number;
  polId: number;
  active?: string;
}

// 지갑 생성 응답 인터페이스
export interface WalletCreateResponse {
  walNum: number;
  message: string;
}

// 지갑 업데이트 응답 인터페이스
export interface WalletUpdateResponse {
  message: string;
}

/**
 * 모든 지갑 목록 조회
 */
export const getAllWallets = async (): Promise<Wallet[]> => {
  return apiGet<Wallet[]>('/api/wallets');
};

/**
 * 지갑 번호로 조회
 * @param walletId 지갑 번호
 */
export const getWalletById = async (walletId: number): Promise<Wallet> => {
  return apiGet<Wallet>(`/api/wallets/${walletId}`);
};

/**
 * 사용자 번호로 지갑 목록 조회
 * @param userId 사용자 번호
 */
export const getWalletsByUser = async (userId: number): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/user/${userId}`);
};

/**
 * 자산 번호로 지갑 목록 조회
 * @param assetId 자산 번호
 */
export const getWalletsByAsset = async (assetId: number): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/asset/${assetId}`);
};

/**
 * 지갑 타입으로 조회
 * @param type 지갑 타입 (Self-custody Hot, Cold, Trading)
 */
export const getWalletsByType = async (type: string): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/type/${type}`);
};

/**
 * 프로토콜로 조회
 * @param protocol 지갑 프로토콜 (Multisig, MPC)
 */
export const getWalletsByProtocol = async (protocol: string): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/protocol/${protocol}`);
};

/**
 * 상태로 조회
 * @param status 지갑 상태 (active, frozen, archived)
 */
export const getWalletsByStatus = async (status: string): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/status/${status}`);
};

/**
 * 신규 지갑 등록
 * @param wallet 지갑 정보
 */
export const createWallet = async (wallet: Wallet): Promise<WalletCreateResponse> => {
  return apiPost<WalletCreateResponse, Wallet>('/api/wallets', wallet);
};

/**
 * 지갑 정보 전체 업데이트
 * @param wallet 지갑 정보
 */
export const updateWallet = async (wallet: Wallet): Promise<WalletUpdateResponse> => {
  return apiPut<WalletUpdateResponse, Wallet>('/api/wallets', wallet);
};

/**
 * 지갑 정보 부분 업데이트
 * @param wallet 지갑 부분 정보
 */
export const patchWallet = async (wallet: Partial<Wallet> & { walNum: number }): Promise<WalletUpdateResponse> => {
  return apiPut<WalletUpdateResponse, Partial<Wallet>>('/api/wallets', wallet);
};

/**
 * 지갑 상태 업데이트
 * @param walletId 지갑 번호
 * @param status 변경할 상태
 */
export const updateWalletStatus = async (walletId: number, status: string): Promise<WalletUpdateResponse> => {
  return apiPut<WalletUpdateResponse, { walNum: number, walStatus: string }>('/api/wallets/status', {
    walNum: walletId,
    walStatus: status
  });
};

/**
 * 지갑 삭제 (비활성화)
 * @param walletId 지갑 번호
 */
export const deleteWallet = async (walletId: number): Promise<WalletUpdateResponse> => {
  return apiDelete<WalletUpdateResponse>(`/api/wallets/${walletId}`);
};

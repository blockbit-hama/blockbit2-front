// src/services/walletAddressesService.ts
// 지갑 주소 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';

/**
 * 지갑 주소 응답 인터페이스 (백엔드 WalletAddressesResponseDTO 매칭)
 */
export interface WalletAddress extends CommonFields {
  wadNum?: number;        // 지갑 주소 번호
  walNum: number;         // 지갑 번호
  wadAddress: string;     // 블록체인 주소
  wadKeyInfo: string;     // 키 정보 (JSON 문자열)
  wadScriptInfo?: string; // 스크립트/메타정보 (JSON 문자열)
}

/**
 * 지갑 주소 요청 인터페이스 (백엔드 WalletAddressesRequestDTO 매칭)
 */
export interface WalletAddressRequest {
  wadNum?: number;
  walNum: number;
  wadAddress: string;
  wadKeyInfo: string;
  wadScriptInfo?: string;
  [key: string]: unknown;
}

/**
 * 키 정보 인터페이스 (wadKeyInfo JSON 파싱용)
 */
export interface KeyInfo {
  type: string;           // 'single', 'multisig', 'hd' 등
  publicKeys?: string[];  // 공개키 목록
  privateKeys?: string[]; // 개인키 목록 (보안 주의)
  requiredSigs?: number;  // 필요한 서명 수 (멀티시그)
  totalKeys?: number;     // 전체 키 수 (멀티시그)
  derivationPath?: string; // HD 지갑 경로
  xpub?: string;          // 확장 공개키
}

/**
 * 스크립트 정보 인터페이스 (wadScriptInfo JSON 파싱용)
 */
export interface ScriptInfo {
  redeemScript?: string;  // 리딤 스크립트 (P2SH용)
  scriptType: string;     // 'P2PKH', 'P2SH', 'P2WPKH', 'P2WSH' 등
  network: string;        // 'mainnet', 'testnet'
  witnessScript?: string; // 위트니스 스크립트 (SegWit용)
}

/**
 * 지갑 주소 생성 응답 인터페이스
 */
export interface WalletAddressCreateResponse extends CreateResponse {
  data?: {
    wadNum: number;
  };
}

/**
 * 지갑 주소 목록 조회 파라미터
 */
export interface WalletAddressListParams extends ListParams {
  walNum?: number; // 특정 지갑의 주소만 조회
}

/**
 * 지갑 주소 목록 조회 (페이징 지원)
 * GET /api/wad/list
 * @param params 페이징 및 필터 파라미터
 * @returns 지갑 주소 목록
 */
export const getWalletAddressList = async (params?: WalletAddressListParams): Promise<WalletAddress[]> => {
  const response = await apiGet<ApiResponse<WalletAddress[]>>('/api/wad/list', params as Record<string, string | number | boolean> | undefined);
  return response.data || [];
};

/**
 * 지갑 주소 단건 조회
 * GET /api/wad/{wadNum}
 * @param wadNum 지갑 주소 번호
 * @returns 지갑 주소 정보
 */
export const getWalletAddressById = async (wadNum: number): Promise<WalletAddress> => {
  const response = await apiGet<ApiResponse<WalletAddress>>(`/api/wad/${wadNum}`);
  if (!response.data) {
    throw new Error('Wallet address not found');
  }
  return response.data;
};

/**
 * 특정 지갑의 주소 목록 조회
 * GET /api/wad/wallet/{walNum}
 * @param walNum 지갑 번호
 * @returns 해당 지갑의 주소 목록
 */
export const getWalletAddressesByWallet = async (walNum: number): Promise<WalletAddress[]> => {
  const response = await apiGet<ApiResponse<WalletAddress[]>>(`/api/wad/wallet/${walNum}`);
  return response.data || [];
};

/**
 * 지갑 주소 등록
 * POST /api/wad
 * @param walletAddress 지갑 주소 정보
 * @returns 생성된 주소 번호 포함 응답
 */
export const createWalletAddress = async (walletAddress: WalletAddressRequest): Promise<WalletAddressCreateResponse> => {
  return apiPost<WalletAddressCreateResponse, WalletAddressRequest>('/api/wad', walletAddress);
};

/**
 * 지갑 주소 수정
 * PUT /api/wad
 * @param walletAddress 수정할 지갑 주소 정보 (wadNum 필수)
 * @returns 수정 완료 응답
 */
export const updateWalletAddress = async (walletAddress: WalletAddressRequest & { wadNum: number }): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, WalletAddressRequest>('/api/wad', walletAddress);
};

/**
 * 지갑 주소 삭제 (논리삭제)
 * DELETE /api/wad/{wadNum}
 * @param wadNum 지갑 주소 번호
 * @returns 삭제 완료 응답
 */
export const deleteWalletAddress = async (wadNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/wad/${wadNum}`);
};

// ========== JSON 파싱 유틸리티 함수들 ==========

/**
 * 키 정보 JSON 문자열을 파싱
 * @param wadKeyInfo 키 정보 JSON 문자열
 * @returns 파싱된 키 정보
 */
export const parseKeyInfo = (wadKeyInfo: string): KeyInfo | null => {
  try {
    return JSON.parse(wadKeyInfo) as KeyInfo;
  } catch (error) {
    console.error('Failed to parse key info:', error);
    return null;
  }
};

/**
 * 스크립트 정보 JSON 문자열을 파싱
 * @param wadScriptInfo 스크립트 정보 JSON 문자열
 * @returns 파싱된 스크립트 정보
 */
export const parseScriptInfo = (wadScriptInfo?: string): ScriptInfo | null => {
  if (!wadScriptInfo) return null;
  
  try {
    return JSON.parse(wadScriptInfo) as ScriptInfo;
  } catch (error) {
    console.error('Failed to parse script info:', error);
    return null;
  }
};

/**
 * 키 정보 객체를 JSON 문자열로 변환
 * @param keyInfo 키 정보 객체
 * @returns JSON 문자열
 */
export const stringifyKeyInfo = (keyInfo: KeyInfo): string => {
  return JSON.stringify(keyInfo);
};

/**
 * 스크립트 정보 객체를 JSON 문자열로 변환
 * @param scriptInfo 스크립트 정보 객체
 * @returns JSON 문자열
 */
export const stringifyScriptInfo = (scriptInfo: ScriptInfo): string => {
  return JSON.stringify(scriptInfo);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 지갑별 주소 통계 조회
 * @param walNum 지갑 번호
 * @returns 주소 통계
 */
export const getWalletAddressStats = async (walNum: number): Promise<{
  totalAddresses: number;
  activeAddresses: number;
  addressTypes: Record<string, number>;
  networks: Record<string, number>;
}> => {
  const addresses = await getWalletAddressesByWallet(walNum);
  const activeAddresses = addresses.filter(addr => addr.active === '1');
  
  const addressTypes: Record<string, number> = {};
  const networks: Record<string, number> = {};
  
  activeAddresses.forEach(addr => {
    const keyInfo = parseKeyInfo(addr.wadKeyInfo);
    const scriptInfo = parseScriptInfo(addr.wadScriptInfo);
    
    if (keyInfo?.type) {
      addressTypes[keyInfo.type] = (addressTypes[keyInfo.type] || 0) + 1;
    }
    
    if (scriptInfo?.network) {
      networks[scriptInfo.network] = (networks[scriptInfo.network] || 0) + 1;
    }
  });
  
  return {
    totalAddresses: addresses.length,
    activeAddresses: activeAddresses.length,
    addressTypes,
    networks
  };
};

/**
 * 주소 검색
 * @param searchTerm 검색어 (주소)
 * @returns 검색된 지갑 주소 목록
 */
export const searchWalletAddresses = async (searchTerm: string): Promise<WalletAddress[]> => {
  const addresses = await getWalletAddressList();
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  
  return addresses.filter(addr => 
    addr.active === '1' && 
    addr.wadAddress.toLowerCase().includes(lowercaseSearchTerm)
  );
};

/**
 * 특정 주소로 지갑 주소 정보 조회
 * @param address 블록체인 주소
 * @returns 지갑 주소 정보 (없으면 null)
 */
export const getWalletAddressByAddress = async (address: string): Promise<WalletAddress | null> => {
  const addresses = await getWalletAddressList();
  return addresses.find(addr => 
    addr.wadAddress === address && 
    addr.active === '1'
  ) || null;
};

/**
 * 지갑의 멀티시그 주소 목록 조회
 * @param walNum 지갑 번호
 * @returns 멀티시그 주소 목록
 */
export const getMultisigAddresses = async (walNum: number): Promise<WalletAddress[]> => {
  const addresses = await getWalletAddressesByWallet(walNum);
  
  return addresses.filter(addr => {
    if (addr.active !== '1') return false;
    
    const keyInfo = parseKeyInfo(addr.wadKeyInfo);
    return keyInfo?.type === 'multisig';
  });
};

/**
 * 지갑의 단일 서명 주소 목록 조회
 * @param walNum 지갑 번호
 * @returns 단일 서명 주소 목록
 */
export const getSingleSigAddresses = async (walNum: number): Promise<WalletAddress[]> => {
  const addresses = await getWalletAddressesByWallet(walNum);
  
  return addresses.filter(addr => {
    if (addr.active !== '1') return false;
    
    const keyInfo = parseKeyInfo(addr.wadKeyInfo);
    return keyInfo?.type === 'single' || keyInfo?.type === 'hd';
  });
};

/**
 * 네트워크별 지갑 주소 조회
 * @param network 네트워크 ('mainnet' | 'testnet')
 * @returns 해당 네트워크의 주소 목록
 */
export const getWalletAddressesByNetwork = async (network: 'mainnet' | 'testnet'): Promise<WalletAddress[]> => {
  const addresses = await getWalletAddressList();
  
  return addresses.filter(addr => {
    if (addr.active !== '1') return false;
    
    const scriptInfo = parseScriptInfo(addr.wadScriptInfo);
    return scriptInfo?.network === network;
  });
};

/**
 * 지갑 주소 검증
 * @param walletAddress 지갑 주소 요청 객체
 * @returns 검증 결과 메시지 배열
 */
export const validateWalletAddress = (walletAddress: WalletAddressRequest): string[] => {
  const errors: string[] = [];
  
  if (!walletAddress.wadAddress?.trim()) {
    errors.push('블록체인 주소는 필수입니다.');
  }
  
  if (!walletAddress.wadKeyInfo?.trim()) {
    errors.push('키 정보는 필수입니다.');
  } else {
    const keyInfo = parseKeyInfo(walletAddress.wadKeyInfo);
    if (!keyInfo) {
      errors.push('키 정보가 올바른 JSON 형식이 아닙니다.');
    } else {
      if (!keyInfo.type) {
        errors.push('키 타입은 필수입니다.');
      }
    }
  }
  
  if (walletAddress.wadScriptInfo) {
    const scriptInfo = parseScriptInfo(walletAddress.wadScriptInfo);
    if (!scriptInfo) {
      errors.push('스크립트 정보가 올바른 JSON 형식이 아닙니다.');
    }
  }
  
  return errors;
};

/**
 * 비트코인 주소 생성 헬퍼 함수
 * @param walNum 지갑 번호
 * @param publicKeys 공개키 목록
 * @param privateKeys 개인키 목록
 * @param requiredSigs 필요한 서명 수
 * @param redeemScript 리딤 스크립트
 * @param address 생성된 주소
 * @returns 지갑 주소 요청 객체
 */
export const createBitcoinMultisigAddressRequest = (
  walNum: number,
  publicKeys: string[],
  privateKeys: string[],
  requiredSigs: number,
  redeemScript: string,
  address: string
): WalletAddressRequest => {
  const keyInfo: KeyInfo = {
    type: 'multisig',
    publicKeys,
    privateKeys,
    requiredSigs,
    totalKeys: publicKeys.length
  };
  
  const scriptInfo: ScriptInfo = {
    redeemScript,
    scriptType: 'P2SH',
    network: 'testnet'
  };
  
  return {
    walNum,
    wadAddress: address,
    wadKeyInfo: stringifyKeyInfo(keyInfo),
    wadScriptInfo: stringifyScriptInfo(scriptInfo)
  };
};

/**
 * 활성 지갑 주소 목록만 조회
 * @returns 활성 상태인 지갑 주소 목록
 */
export const getActiveWalletAddresses = async (): Promise<WalletAddress[]> => {
  const addresses = await getWalletAddressList();
  return addresses.filter(addr => addr.active === '1');
};
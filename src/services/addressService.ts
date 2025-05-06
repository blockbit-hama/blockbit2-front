// src/services/addressService.ts
// 주소 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// 주소 인터페이스
export interface Address {
  adrNum?: number;
  adrAddress: string;
  adrLabel: string;
  adrType: string;
  adrPath: string;
  walId: number;
  astId: number;
  active?: string;
}

// 주소 생성 응답 인터페이스
export interface AddressCreateResponse {
  adrNum: number;
  message: string;
}

// 주소 업데이트 응답 인터페이스
export interface AddressUpdateResponse {
  message: string;
}

// 잔액 인터페이스
export interface Balance {
  balNum: number;
  adrId: number;
  astId: number;
  balBefore: number;
  balAfter: number;
  balConfirmed: number;
  balPending: number;
  creusr?: number;
  credat?: string;
  cretim?: string;
  active?: string;
}

/**
 * 모든 주소 목록 조회
 */
export const getAllAddresses = async (): Promise<Address[]> => {
  return apiGet<Address[]>('/api/addresses');
};

/**
 * 주소 번호로 조회
 * @param addressId 주소 번호
 */
export const getAddressById = async (addressId: number): Promise<Address> => {
  return apiGet<Address>(`/api/addresses/${addressId}`);
};

/**
 * 지갑 ID로 주소 목록 조회
 * @param walletId 지갑 번호
 */
export const fetchAddresses = async (walletId: number): Promise<Address[]> => {
  return apiGet<Address[]>(`/api/addresses/wallet/${walletId}`);
};

/**
 * 자산 ID로 주소 목록 조회
 * @param assetId 자산 번호
 */
export const getAddressesByAsset = async (assetId: number): Promise<Address[]> => {
  return apiGet<Address[]>(`/api/addresses/asset/${assetId}`);
};

/**
 * 주소 타입으로 조회
 * @param type 주소 타입 (receive, change, cold)
 */
export const getAddressesByType = async (type: string): Promise<Address[]> => {
  return apiGet<Address[]>(`/api/addresses/type/${type}`);
};

/**
 * 실제 암호화폐 주소로 조회
 * @param cryptoAddress 암호화폐 주소
 */
export const getAddressByCryptoAddress = async (cryptoAddress: string): Promise<Address> => {
  return apiGet<Address>(`/api/addresses/crypto-address/${cryptoAddress}`);
};

/**
 * 신규 주소 등록
 * @param address 주소 정보
 */
export const createAddress = async (address: Address): Promise<AddressCreateResponse> => {
  return apiPost<AddressCreateResponse, Address>('/api/addresses', address);
};

/**
 * 주소 정보 업데이트
 * @param address 주소 정보
 */
export const updateAddress = async (address: Address): Promise<AddressUpdateResponse> => {
  return apiPut<AddressUpdateResponse, Address>('/api/addresses', address);
};

/**
 * 주소 정보 부분 업데이트
 * @param address 주소 부분 정보
 */
export const patchAddress = async (address: Partial<Address> & { adrNum: number }): Promise<AddressUpdateResponse> => {
  return apiPut<AddressUpdateResponse, Partial<Address>>('/api/addresses', address);
};

/**
 * 주소 삭제 (비활성화)
 * @param addressId 주소 번호
 */
export const deleteAddress = async (addressId: number): Promise<AddressUpdateResponse> => {
  return apiDelete<AddressUpdateResponse>(`/api/addresses/${addressId}`);
};

/**
 * 주소의 자산 잔액 조회
 * @param addressId 주소 번호
 * @param assetId 자산 번호
 */
export const fetchBalance = async (addressId: number, assetId: number): Promise<Balance | null> => {
  try {
    const balances = await apiGet<Balance[]>(`/api/balances/address/${addressId}`);
    
    if (!balances || balances.length === 0) {
      return null;
    }
    
    const matchingBalances = balances.filter(bal => bal.astId === assetId);
    
    if (matchingBalances.length === 0) {
      return null;
    }
    
    // 가장 최신 잔액 정보 반환
    return matchingBalances.reduce((latest, current) => {
      if (!latest.credat || !current.credat) {
        return current;
      }
      
      if (current.credat > latest.credat) {
        return current;
      } else if (current.credat < latest.credat) {
        return latest;
      }
      
      if (!latest.cretim || !current.cretim) {
        return current;
      }
      
      if (current.cretim > latest.cretim) {
        return current;
      } else {
        return latest;
      }
    });
  } catch (err) {
    console.error(`Error fetching balance for address ID ${addressId}:`, err);
    return null;
  }
};

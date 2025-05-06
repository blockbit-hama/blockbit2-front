// src/services/assetService.ts
// 자산 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// 자산 인터페이스
export interface Asset {
  astNum?: number;
  astName: string;
  astSymbol: string;
  astType: string;
  astNetwork: string;
  astDecimals: number;
  active?: string;
}

// 자산 생성 응답 인터페이스
export interface AssetCreateResponse {
  astNum: number;
  message: string;
}

// 자산 업데이트 응답 인터페이스
export interface AssetUpdateResponse {
  message: string;
}

/**
 * 모든 자산 목록 조회
 */
export const getAllAssets = async (): Promise<Asset[]> => {
  return apiGet<Asset[]>('/api/assets');
};

/**
 * 자산 번호로 조회
 * @param assetId 자산 번호
 */
export const getAssetById = async (assetId: number): Promise<Asset> => {
  return apiGet<Asset>(`/api/assets/${assetId}`);
};

/**
 * 자산 심볼로 조회
 * @param symbol 자산 심볼
 */
export const getAssetBySymbol = async (symbol: string): Promise<Asset> => {
  return apiGet<Asset>(`/api/assets/symbol/${symbol}`);
};

/**
 * 자산 타입으로 조회
 * @param type 자산 타입 (coin, token)
 */
export const getAssetsByType = async (type: string): Promise<Asset[]> => {
  return apiGet<Asset[]>(`/api/assets/type/${type}`);
};

/**
 * 네트워크로 조회
 * @param network 네트워크 (mainnet, testnet)
 */
export const getAssetsByNetwork = async (network: string): Promise<Asset[]> => {
  return apiGet<Asset[]>(`/api/assets/network/${network}`);
};

/**
 * 신규 자산 등록
 * @param asset 자산 정보
 */
export const createAsset = async (asset: Asset): Promise<AssetCreateResponse> => {
  return apiPost<AssetCreateResponse, Asset>('/api/assets', asset);
};

/**
 * 자산 정보 전체 업데이트
 * @param asset 자산 정보
 */
export const updateAsset = async (asset: Asset): Promise<AssetUpdateResponse> => {
  return apiPut<AssetUpdateResponse, Asset>('/api/assets', asset);
};

/**
 * 자산 정보 부분 업데이트
 * @param asset 자산 부분 정보
 */
export const patchAsset = async (asset: Partial<Asset> & { astNum: number }): Promise<AssetUpdateResponse> => {
  return apiPut<AssetUpdateResponse, Partial<Asset>>('/api/assets', asset);
};

/**
 * 자산 삭제 (비활성화)
 * @param assetId 자산 번호
 */
export const deleteAsset = async (assetId: number): Promise<AssetUpdateResponse> => {
  return apiDelete<AssetUpdateResponse>(`/api/assets/${assetId}`);
};

/**
 * 자산 ID 매핑 함수 (임시 구현)
 * @param assetType 자산 유형 이름
 * @returns 자산 ID
 */
export const getAssetIdByType = (assetType: string): number => {
  const assetMap: {[key: string]: number} = {
    'Bitcoin': 1,
    'Ethereum': 2,
    'Bitcoin Cash': 3,
    'Litecoin': 4,
    'ERC-20': 5,
    'Ripple': 6,
    'Tether': 7
  };
  
  return assetMap[assetType] || 1;
};

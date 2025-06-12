import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';

/**
 * 자산 응답 인터페이스 (백엔드 AssetsResponseDTO 매칭)
 */
export interface Asset extends CommonFields {
  astNum?: number;        // 자산 번호
  astName: string;        // 자산명
  astSymbol: string;      // 자산 심볼 (예: BTC, ETH)
  astType: string;        // 자산 타입 ('coin', 'token')
  astNetwork: string;     // 네트워크 ('mainnet', 'testnet')
  astDecimals?: number;   // 소수점 자리수
}

/**
 * 자산 요청 인터페이스 (백엔드 AssetsRequestDTO 매칭)
 */
export interface AssetRequest {
  astNum?: number;
  astName: string;
  astSymbol: string;
  astType: 'coin' | 'token';
  astNetwork: 'mainnet' | 'testnet';
  astDecimals?: number;
  [key: string]: unknown;
}

/**
 * 자산 생성 응답 인터페이스
 */
export interface AssetCreateResponse extends CreateResponse {
  data?: {
    astNum: number;
  };
}

/**
 * 자산 목록 조회 (페이징 지원)
 * GET /api/ast/list
 * @param params 페이징 파라미터 (offset, limit)
 * @returns 자산 목록
 */
export const getAssetList = async (params?: ListParams): Promise<Asset[]> => {
  const response = await apiGet<ApiResponse<Asset[]>>('/api/ast/list', params as Record<string, string | number | boolean>);
  return response.data || [];
};

/**
 * 자산 단건 조회
 * GET /api/ast/{astNum}
 * @param astNum 자산 번호
 * @returns 자산 정보
 */
export const getAssetById = async (astNum: number): Promise<Asset> => {
  const response = await apiGet<ApiResponse<Asset>>(`/api/ast/${astNum}`);
  if (!response.data) {
    throw new Error('Asset not found');
  }
  return response.data;
};

/**
 * 자산 등록
 * POST /api/ast
 * @param asset 자산 정보
 * @returns 생성된 자산 번호 포함 응답
 */
export const createAsset = async (asset: AssetRequest): Promise<AssetCreateResponse> => {
  return apiPost<AssetCreateResponse, AssetRequest>('/api/ast', asset);
};

/**
 * 자산 수정
 * PUT /api/ast
 * @param asset 수정할 자산 정보 (astNum 필수)
 * @returns 수정 완료 응답
 */
export const updateAsset = async (asset: AssetRequest & { astNum: number }): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, AssetRequest>('/api/ast', asset);
};

/**
 * 자산 삭제 (논리삭제)
 * DELETE /api/ast/{astNum}
 * @param astNum 자산 번호
 * @returns 삭제 완료 응답
 */
export const deleteAsset = async (astNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/ast/${astNum}`);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 자산 타입별 조회
 * @param type 자산 타입 ('coin' | 'token')
 * @returns 해당 타입의 활성 자산 목록
 */
export const getAssetsByType = async (type: 'coin' | 'token'): Promise<Asset[]> => {
  const assets = await getAssetList();
  return assets.filter(asset => 
    asset.astType === type && 
    asset.active === '1'
  );
};

/**
 * 네트워크별 자산 조회
 * @param network 네트워크 ('mainnet' | 'testnet')
 * @returns 해당 네트워크의 활성 자산 목록
 */
export const getAssetsByNetwork = async (network: 'mainnet' | 'testnet'): Promise<Asset[]> => {
  const assets = await getAssetList();
  return assets.filter(asset => 
    asset.astNetwork === network && 
    asset.active === '1'
  );
};

/**
 * 심볼로 자산 조회
 * @param symbol 자산 심볼 (예: 'BTC', 'ETH')
 * @returns 해당 심볼의 자산 정보 (없으면 null)
 */
export const getAssetBySymbol = async (symbol: string): Promise<Asset | null> => {
  const assets = await getAssetList();
  return assets.find(asset => 
    asset.astSymbol.toLowerCase() === symbol.toLowerCase() && 
    asset.active === '1'
  ) || null;
};

/**
 * 활성 자산 목록만 조회
 * @returns 활성 상태인 자산 목록
 */
export const getActiveAssets = async (): Promise<Asset[]> => {
  const assets = await getAssetList();
  return assets.filter(asset => asset.active === '1');
};

/**
 * 자산 검색
 * @param searchTerm 검색어 (자산명 또는 심볼)
 * @returns 검색된 자산 목록
 */
export const searchAssets = async (searchTerm: string): Promise<Asset[]> => {
  const assets = await getAssetList();
  const lowercaseSearchTerm = searchTerm.toLowerCase();
  
  return assets.filter(asset => 
    asset.active === '1' && (
      asset.astName.toLowerCase().includes(lowercaseSearchTerm) ||
      asset.astSymbol.toLowerCase().includes(lowercaseSearchTerm)
    )
  );
};

/**
 * 자산 ID 매핑 함수 (임시 구현)
 * @param assetType 자산 유형 이름
 * @returns 자산 ID
 */
export const getAssetIdByType = (assetType: string): number => {
  const assetMap: { [key: string]: number } = {
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
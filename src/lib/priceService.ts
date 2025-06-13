import { API_BASE_URL } from '@/config/environment';

interface PriceData {
  price: number;
  change24h: number;
  lastUpdated: string;
}

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

/**
 * 비트코인 가격 정보를 가져오는 함수
 * @returns {Promise<PriceData>} 가격 정보 (USD 기준)
 */
export const getBitcoinPrice = async (): Promise<PriceData> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    const data: CoinGeckoResponse = await response.json();
    
    return {
      price: data.bitcoin.usd,
      change24h: data.bitcoin.usd_24h_change,
      lastUpdated: new Date(data.bitcoin.last_updated_at * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw error;
  }
};

/**
 * 특정 자산의 가격 정보를 가져오는 함수
 * @param {string} assetId - 자산 ID (예: 'bitcoin', 'ethereum')
 * @returns {Promise<PriceData>} 가격 정보 (USD 기준)
 */
export const getAssetPrice = async (assetId: string): Promise<PriceData> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${assetId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch ${assetId} price`);
    }

    const data = await response.json();
    const assetData = data[assetId];
    
    return {
      price: assetData.usd,
      change24h: assetData.usd_24h_change,
      lastUpdated: new Date(assetData.last_updated_at * 1000).toISOString()
    };
  } catch (error) {
    console.error(`Error fetching ${assetId} price:`, error);
    throw error;
  }
};

/**
 * 여러 자산의 가격 정보를 한 번에 가져오는 함수
 * @param {string[]} assetIds - 자산 ID 배열
 * @returns {Promise<Record<string, PriceData>>} 자산별 가격 정보 (USD 기준)
 */
export const getMultipleAssetPrices = async (assetIds: string[]): Promise<Record<string, PriceData>> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${assetIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch asset prices');
    }

    const data = await response.json();
    const result: Record<string, PriceData> = {};

    for (const assetId of assetIds) {
      if (data[assetId]) {
        result[assetId] = {
          price: data[assetId].usd,
          change24h: data[assetId].usd_24h_change,
          lastUpdated: new Date(data[assetId].last_updated_at * 1000).toISOString()
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching multiple asset prices:', error);
    throw error;
  }
}; 
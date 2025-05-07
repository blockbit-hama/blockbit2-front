// src/services/addressService.ts
// Service for handling address-related API requests

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// Address interface
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

// Address creation response interface
export interface AddressCreateResponse {
  adrNum: number;
  message: string;
}

// Address update response interface
export interface AddressUpdateResponse {
  message: string;
}

// Balance interface
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
 * Get all addresses
 */
export const getAllAddresses = async (): Promise<Address[]> => {
  return apiGet<Address[]>('/api/addresses');
};

/**
 * Get address by ID
 * @param addressId Address ID
 */
export const getAddressById = async (addressId: number): Promise<Address> => {
  return apiGet<Address>(`/api/addresses/${addressId}`);
};

/**
 * Get addresses by wallet ID
 * @param walletId Wallet ID
 */
export const fetchAddresses = async (walletId: number): Promise<Address[]> => {
  return apiGet<Address[]>(`/api/addresses/wallet/${walletId}`);
};

/**
 * Get addresses by asset ID
 * @param assetId Asset ID
 */
export const getAddressesByAsset = async (assetId: number): Promise<Address[]> => {
  return apiGet<Address[]>(`/api/addresses/asset/${assetId}`);
};

/**
 * Get addresses by type
 * @param type Address type (receive, change, cold)
 */
export const getAddressesByType = async (type: string): Promise<Address[]> => {
  return apiGet<Address[]>(`/api/addresses/type/${type}`);
};

/**
 * Get address by cryptocurrency address
 * @param cryptoAddress Cryptocurrency address
 */
export const getAddressByCryptoAddress = async (cryptoAddress: string): Promise<Address> => {
  return apiGet<Address>(`/api/addresses/crypto-address/${cryptoAddress}`);
};

/**
 * Create new address
 * @param address Address information
 */
export const createAddress = async (address: Address): Promise<AddressCreateResponse> => {
  return apiPost<AddressCreateResponse, Address>('/api/addresses', address);
};

/**
 * Update address information
 * @param address Address information
 */
export const updateAddress = async (address: Address): Promise<AddressUpdateResponse> => {
  return apiPut<AddressUpdateResponse, Address>('/api/addresses', address);
};

/**
 * Partially update address information
 * @param address Partial address information
 */
export const patchAddress = async (address: Partial<Address> & { adrNum: number }): Promise<AddressUpdateResponse> => {
  return apiPut<AddressUpdateResponse, Partial<Address>>('/api/addresses', address);
};

/**
 * Delete address (deactivate)
 * @param addressId Address ID
 */
export const deleteAddress = async (addressId: number): Promise<AddressUpdateResponse> => {
  return apiDelete<AddressUpdateResponse>(`/api/addresses/${addressId}`);
};

/**
 * Get asset balance for an address
 * @param addressId Address ID
 * @param assetId Asset ID
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
    
    // Return the most recent balance information
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

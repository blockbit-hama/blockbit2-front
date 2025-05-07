// src/services/walletService.ts
// Service for handling wallet-related API requests

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

// Wallet interface
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

// Wallet creation response interface
export interface WalletCreateResponse {
  walNum: number;
  message: string;
}

// Wallet update response interface
export interface WalletUpdateResponse {
  message: string;
}

/**
 * Get all wallets
 */
export const getAllWallets = async (): Promise<Wallet[]> => {
  return apiGet<Wallet[]>('/api/wallets');
};

/**
 * Get wallet by ID
 * @param walletId Wallet ID
 */
export const getWalletById = async (walletId: number): Promise<Wallet> => {
  return apiGet<Wallet>(`/api/wallets/${walletId}`);
};

/**
 * Get wallets by user
 * @param userId User ID
 */
export const getWalletsByUser = async (userId: number): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/user/${userId}`);
};

/**
 * Get wallets by asset
 * @param assetId Asset ID
 */
export const getWalletsByAsset = async (assetId: number): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/asset/${assetId}`);
};

/**
 * Get wallets by type
 * @param type Wallet type (Self-custody Hot, Cold, Trading)
 */
export const getWalletsByType = async (type: string): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/type/${type}`);
};

/**
 * Get wallets by protocol
 * @param protocol Wallet protocol (Multisig, MPC)
 */
export const getWalletsByProtocol = async (protocol: string): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/protocol/${protocol}`);
};

/**
 * Get wallets by status
 * @param status Wallet status (active, frozen, archived)
 */
export const getWalletsByStatus = async (status: string): Promise<Wallet[]> => {
  return apiGet<Wallet[]>(`/api/wallets/status/${status}`);
};

/**
 * Create new wallet
 * @param wallet Wallet information
 */
export const createWallet = async (wallet: Wallet): Promise<WalletCreateResponse> => {
  return apiPost<WalletCreateResponse, Wallet>('/api/wallets', wallet);
};

/**
 * Update entire wallet information
 * @param wallet Wallet information
 */
export const updateWallet = async (wallet: Wallet): Promise<WalletUpdateResponse> => {
  return apiPut<WalletUpdateResponse, Wallet>('/api/wallets', wallet);
};

/**
 * Partially update wallet information
 * @param wallet Partial wallet information
 */
export const patchWallet = async (wallet: Partial<Wallet> & { walNum: number }): Promise<WalletUpdateResponse> => {
  return apiPut<WalletUpdateResponse, Partial<Wallet>>('/api/wallets', wallet);
};

/**
 * Update wallet status
 * @param walletId Wallet ID
 * @param status Status to change
 */
export const updateWalletStatus = async (walletId: number, status: string): Promise<WalletUpdateResponse> => {
  return apiPut<WalletUpdateResponse, { walNum: number, walStatus: string }>('/api/wallets/status', {
    walNum: walletId,
    walStatus: status
  });
};

/**
 * Delete wallet (deactivate)
 * @param walletId Wallet ID
 */
export const deleteWallet = async (walletId: number): Promise<WalletUpdateResponse> => {
  return apiDelete<WalletUpdateResponse>(`/api/wallets/${walletId}`);
};

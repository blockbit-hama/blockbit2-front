// src/services/transactionService.ts
// 거래 관련 API 요청을 처리하는 서비스

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';
import { CommonFields, ListParams, CreateResponse, SimpleResponse, ApiResponse } from '@/types/common';

/**
 * 거래 상태 타입 정의
 */
export type TransactionStatus = 'created' | 'signed' | 'pending' | 'confirmed' | 'failed' | 'cancelled';

/**
 * 거래 응답 인터페이스 (백엔드 TransactionsResponseDTO 매칭)
 */
export interface Transaction extends CommonFields {
  trxNum?: number;          // 트랜잭션 번호
  trxToAddr: string;        // 수신 주소
  trxAmount: string;        // 전송 금액 (BigDecimal을 String으로 처리)
  trxFee?: string;          // 수수료 (BigDecimal을 String으로 처리)
  trxStatus: TransactionStatus; // 트랜잭션 상태
  trxTxId?: string;         // 블록체인 트랜잭션 ID
  trxScriptInfo?: string;   // JSON 형태의 상세 정보
  trxConfirmedDat?: string; // 컨펌 일자 (YYYYMMDD)
  trxConfirmedTim?: string; // 컨펌 시간 (HHMMSS)
  walNum: number;           // 지갑 번호
  wadNum: number;           // 주소 번호
}

/**
 * 거래 요청 인터페이스 (백엔드 TransactionsRequestDTO 매칭)
 */
export interface TransactionRequest {
  trxNum?: number;
  trxToAddr: string;
  trxAmount: string;
  trxFee?: string;
  trxStatus: TransactionStatus;
  trxTxId?: string;
  trxScriptInfo?: string;
  trxConfirmedDat?: string;
  trxConfirmedTim?: string;
  walNum: number;
  wadNum: number;
  [key: string]: unknown;
}

/**
 * 거래 업데이트 인터페이스 (백엔드 TransactionsUpdateDTO 매칭)
 */
export interface TransactionUpdate {
  trxNum: number;
  trxToAddr: string;
  trxAmount: string;
  trxFee?: string;
  trxStatus: TransactionStatus;
  trxTxId?: string;
  trxScriptInfo?: string;
  trxConfirmedDat?: string;
  trxConfirmedTim?: string;
  walNum: number;
  wadNum?: number;
  [key: string]: unknown;
}

/**
 * 거래 생성 응답 인터페이스
 */
export interface TransactionCreateResponse extends CreateResponse {
  data?: {
    trxNum: number;
  };
}

/**
 * 거래 통계 인터페이스
 */
export interface TransactionStats {
  totalCount: number;
  totalAmount: string;
  byStatus: Record<TransactionStatus, number>;
  todayCount: number;
  todayAmount: string;
}

/**
 * 거래 목록 조회 (페이징 지원)
 * GET /api/trx/list
 * @param params 페이징 파라미터 (offset, limit)
 * @returns 거래 목록
 */
export const getTransactionList = async (params?: ListParams): Promise<Transaction[]> => {
  const response = await apiGet<ApiResponse<Transaction[]>>('/api/trx/list', params as Record<string, string | number | boolean> | undefined);
  return response.data || [];
};

/**
 * 거래 단건 조회
 * GET /api/trx/{trxNum}
 * @param trxNum 거래 번호
 * @returns 거래 정보
 */
export const getTransactionById = async (trxNum: number): Promise<Transaction> => {
  const response = await apiGet<ApiResponse<Transaction>>(`/api/trx/${trxNum}`);
  if (!response.data) {
    throw new Error('Transaction not found');
  }
  return response.data;
};

/**
 * 거래 등록
 * POST /api/trx
 * @param transaction 거래 정보
 * @returns 생성된 거래 번호 포함 응답
 */
export const createTransaction = async (transaction: TransactionRequest): Promise<TransactionCreateResponse> => {
  return apiPost<TransactionCreateResponse, TransactionRequest>('/api/trx', transaction);
};

/**
 * 거래 수정
 * PUT /api/trx/{trxNum}
 * @param trxNum 거래 번호
 * @param transaction 수정할 거래 정보
 * @returns 수정 완료 응답
 */
export const updateTransaction = async (trxNum: number, transaction: TransactionUpdate): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, TransactionUpdate>(`/api/trx/${trxNum}`, transaction);
};

/**
 * 거래 삭제 (논리삭제)
 * DELETE /api/trx/{trxNum}
 * @param trxNum 거래 번호
 * @returns 삭제 완료 응답
 */
export const deleteTransaction = async (trxNum: number): Promise<SimpleResponse> => {
  return apiDelete<SimpleResponse>(`/api/trx/${trxNum}`);
};

// ========== 추가 유틸리티 함수들 ==========

/**
 * 거래 상태별 조회
 * @param status 거래 상태
 * @returns 해당 상태의 거래 목록
 */
export const getTransactionsByStatus = async (status: TransactionStatus): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  return transactions.filter(trx => 
    trx.trxStatus === status && 
    trx.active === '1'
  );
};

/**
 * 지갑별 거래 조회
 * @param walNum 지갑 번호
 * @returns 해당 지갑의 거래 목록
 */
export const getTransactionsByWallet = async (walNum: number): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  return transactions.filter(trx => 
    trx.walNum === walNum && 
    trx.active === '1'
  );
};

/**
 * 주소별 거래 조회
 * @param wadNum 주소 번호
 * @returns 해당 주소의 거래 목록
 */
export const getTransactionsByAddress = async (wadNum: number): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  return transactions.filter(trx => 
    trx.wadNum === wadNum && 
    trx.active === '1'
  );
};

/**
 * 블록체인 트랜잭션 ID로 조회
 * @param txId 블록체인 트랜잭션 ID
 * @returns 거래 정보 (없으면 null)
 */
export const getTransactionByTxId = async (txId: string): Promise<Transaction | null> => {
  const transactions = await getTransactionList();
  return transactions.find(trx => 
    trx.trxTxId === txId && 
    trx.active === '1'
  ) || null;
};

/**
 * 수신 주소로 거래 조회
 * @param toAddress 수신 주소
 * @returns 해당 주소로의 거래 목록
 */
export const getTransactionsByToAddress = async (toAddress: string): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  return transactions.filter(trx => 
    trx.trxToAddr === toAddress && 
    trx.active === '1'
  );
};

/**
 * 일자별 거래 조회
 * @param date 조회할 일자 (YYYYMMDD 형식)
 * @returns 해당 일자의 거래 목록
 */
export const getTransactionsByDate = async (date: string): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  return transactions.filter(trx => 
    trx.credat === date && 
    trx.active === '1'
  );
};

/**
 * 기간별 거래 조회
 * @param startDate 시작 일자 (YYYYMMDD)
 * @param endDate 종료 일자 (YYYYMMDD)
 * @returns 해당 기간의 거래 목록
 */
export const getTransactionsByDateRange = async (startDate: string, endDate: string): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  return transactions.filter(trx => 
    trx.credat && 
    trx.credat >= startDate && 
    trx.credat <= endDate && 
    trx.active === '1'
  );
};

/**
 * 거래 상태 변경
 * @param trxNum 거래 번호
 * @param newStatus 새로운 상태
 * @returns 상태 변경 완료 응답
 */
export const changeTransactionStatus = async (trxNum: number, newStatus: TransactionStatus): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, { trxStatus: TransactionStatus }>(`/api/trx/${trxNum}/status`, {
    trxStatus: newStatus
  });
};

/**
 * 거래 확인 처리
 * @param trxNum 거래 번호
 * @param txId 블록체인 트랜잭션 ID
 * @param confirmedDate 확인 일자 (YYYYMMDD)
 * @param confirmedTime 확인 시간 (HHMMSS)
 * @returns 확인 처리 완료 응답
 */
export const confirmTransaction = async (
  trxNum: number, 
  txId: string, 
  confirmedDate: string, 
  confirmedTime: string
): Promise<SimpleResponse> => {
  return apiPut<SimpleResponse, {
    trxStatus: TransactionStatus;
    trxTxId: string;
    trxConfirmedDat: string;
    trxConfirmedTim: string;
  }>(`/api/trx/${trxNum}/confirm`, {
    trxStatus: 'confirmed',
    trxTxId: txId,
    trxConfirmedDat: confirmedDate,
    trxConfirmedTim: confirmedTime
  });
};

/**
 * 거래 취소
 * @param trxNum 거래 번호
 * @returns 취소 완료 응답
 */
export const cancelTransaction = async (trxNum: number): Promise<SimpleResponse> => {
  return changeTransactionStatus(trxNum, 'cancelled');
};

/**
 * 거래 통계 조회
 * @returns 거래 통계 정보
 */
export const getTransactionStats = async (): Promise<TransactionStats> => {
  const transactions = await getTransactionList();
  const activeTransactions = transactions.filter(trx => trx.active === '1');
  
  // 오늘 날짜 (YYYYMMDD 형식)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const todayTransactions = activeTransactions.filter(trx => trx.credat === today);
  
  // 총 금액 계산
  const totalAmount = activeTransactions
    .filter(trx => trx.trxStatus === 'confirmed')
    .reduce((sum, trx) => sum + parseFloat(trx.trxAmount), 0);
  
  const todayAmount = todayTransactions
    .filter(trx => trx.trxStatus === 'confirmed')
    .reduce((sum, trx) => sum + parseFloat(trx.trxAmount), 0);
  
  return {
    totalCount: activeTransactions.length,
    totalAmount: totalAmount.toString(),
    byStatus: {
      'created': activeTransactions.filter(trx => trx.trxStatus === 'created').length,
      'signed': activeTransactions.filter(trx => trx.trxStatus === 'signed').length,
      'pending': activeTransactions.filter(trx => trx.trxStatus === 'pending').length,
      'confirmed': activeTransactions.filter(trx => trx.trxStatus === 'confirmed').length,
      'failed': activeTransactions.filter(trx => trx.trxStatus === 'failed').length,
      'cancelled': activeTransactions.filter(trx => trx.trxStatus === 'cancelled').length,
    },
    todayCount: todayTransactions.length,
    todayAmount: todayAmount.toString()
  };
};

/**
 * 금액 범위별 거래 조회
 * @param minAmount 최소 금액
 * @param maxAmount 최대 금액
 * @returns 해당 금액 범위의 거래 목록
 */
export const getTransactionsByAmountRange = async (minAmount: string, maxAmount: string): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  const min = parseFloat(minAmount);
  const max = parseFloat(maxAmount);
  
  return transactions.filter(trx => {
    const amount = parseFloat(trx.trxAmount);
    return amount >= min && amount <= max && trx.active === '1';
  });
};

/**
 * 거래 검색 (다양한 조건)
 * @param searchParams 검색 조건
 * @returns 검색된 거래 목록
 */
export const searchTransactions = async (searchParams: {
  txId?: string;
  toAddress?: string;
  status?: TransactionStatus;
  walNum?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Transaction[]> => {
  const transactions = await getTransactionList();
  
  return transactions.filter(trx => {
    if (trx.active !== '1') return false;
    
    if (searchParams.txId && trx.trxTxId !== searchParams.txId) return false;
    if (searchParams.toAddress && !trx.trxToAddr.includes(searchParams.toAddress)) return false;
    if (searchParams.status && trx.trxStatus !== searchParams.status) return false;
    if (searchParams.walNum && trx.walNum !== searchParams.walNum) return false;
    if (searchParams.dateFrom && trx.credat && trx.credat < searchParams.dateFrom) return false;
    if (searchParams.dateTo && trx.credat && trx.credat > searchParams.dateTo) return false;
    
    return true;
  });
};
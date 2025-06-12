/**
 * 백엔드 공통 컬럼 인터페이스
 */
export interface CommonFields {
    creusr?: number;      // 생성자 (usi_num)
    credat?: string;      // 생성일자 (YYYYMMDD)
    cretim?: string;      // 생성시간 (HHMMSS)
    lmousr?: number;      // 수정자 (usi_num)
    lmodat?: string;      // 수정일자 (YYYYMMDD)
    lmotim?: string;      // 수정시간 (HHMMSS)
    active?: string;      // 활성여부 ('1'=활성, '0'=비활성)
  }
  
  /**
   * 페이징 파라미터
   */
  export interface ListParams {
    offset?: number;
    limit?: number;
  }
  
  /**
   * 백엔드 API 응답 래퍼 타입
   */
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp?: string;
  }
  
  /**
   * 생성 응답 인터페이스
   */
  export interface CreateResponse {
    success: boolean;
    data?: {
      [key: string]: number; // astNum, codNum, usiNum 등
    };
    message?: string;
  }
  
  /**
   * 업데이트/삭제 응답 인터페이스
   */
  export interface SimpleResponse {
    success: boolean;
    message?: string;
    timestamp?: string;
    [key: string]: unknown;
  }
  
  /**
   * 에러 응답 인터페이스
   */
  export interface ErrorResponse {
    success: false;
    message: string;
    status: number;
    timestamp: string;
  }
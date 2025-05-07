// src/services/apiService.ts
// Common service module for API calls

import { API_BASE_URL } from '@/config/environment';
import { getCookie } from '@/lib/auth';

// API error class definition
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// 기본 API 요청 옵션
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
};

/**
 * Function to perform API requests with authentication token
 * @param endpoint API endpoint (starts with /)
 * @param options Request options
 * @returns Response object or error
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Get authentication token
  const token = getCookie('auth_token');
  
  // Merge options
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    },
  };
  
  try {
    // Create request URL (use as is if already starting with http://)
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Execute API request
    const response = await fetch(url, mergedOptions);
    
    // Handle authentication errors
    if (response.status === 401) {
      // Redirect to login page or handle logout
      window.location.href = '/login';
      throw new ApiError('Authentication required.', 401);
    }
    
    // Handle unsuccessful responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'An error occurred while processing the request.',
        response.status,
        errorData
      );
    }
    
    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }
    
    // Parse response data
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred.',
      0
    );
  }
};

/**
 * Function to perform GET requests
 * @param endpoint API endpoint
 * @param params URL query parameters (optional)
 */
export const apiGet = async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
  // Process query parameters
  let url = endpoint;
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    url = `${endpoint}?${queryParams.toString()}`;
  }
  
  return apiRequest<T>(url, { method: 'GET' });
};

/**
 * Function to perform POST requests
 * @param endpoint API endpoint
 * @param data Request body data
 */
export const apiPost = async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Function to perform PUT requests
 * @param endpoint API endpoint
 * @param data Request body data
 */
export const apiPut = async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Function to perform PATCH requests
 * @param endpoint API endpoint
 * @param data Request body data
 */
export const apiPatch = async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Function to perform DELETE requests
 * @param endpoint API endpoint
 */
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

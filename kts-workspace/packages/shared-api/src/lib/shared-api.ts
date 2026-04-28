import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@kts-workspace/shared-types';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  getToken?: () => Promise<string | null>;
  onTokenExpired?: () => void;
}

export class ApiClient {
  private client: AxiosInstance;
  private getToken?: () => Promise<string | null>;
  private onTokenExpired?: () => void;

  constructor(config: ApiClientConfig = {}) {
    const {
      baseURL = process.env.NX_API_URL || 'http://localhost:3000',
      timeout = 10000,
      getToken,
      onTokenExpired,
    } = config;

    this.getToken = getToken;
    this.onTokenExpired = onTokenExpired;

    this.client = axios.create({
      baseURL,
      timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (this.getToken) {
          const token = await this.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.onTokenExpired) {
          // Token expired or invalid
          this.onTokenExpired();
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: error.message || 'An unexpected error occurred',
    };

    if (error.response) {
      apiError.status = error.response.status;
      apiError.code = String(error.response.status);
      apiError.message = (error.response.data as any)?.message || apiError.message;
      apiError.details = (error.response.data as any)?.details;
    } else if (error.request) {
      apiError.code = 'NETWORK_ERROR';
      apiError.message = 'Network error. Please check your connection.';
    }

    return apiError;
  }

  public getAxiosClient(): AxiosInstance {
    return this.client;
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Function to create configured API client for different platforms
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

export default apiClient;
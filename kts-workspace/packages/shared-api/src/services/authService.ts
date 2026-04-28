import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@kts-workspace/shared-types';
import { ApiClient } from '../lib/shared-api';

export class AuthService {
  constructor(private apiClient: ApiClient) {}

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiClient
      .getAxiosClient()
      .post<AuthResponse>('/auth/login', request);
    return response.data;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await this.apiClient
      .getAxiosClient()
      .post<AuthResponse>('/auth/register', request);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.apiClient
      .getAxiosClient()
      .get<User>('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.apiClient.getAxiosClient().post('/auth/logout');
  }
}

// Default auth service instance using the default API client
import { apiClient } from '../lib/shared-api';
export const authService = new AuthService(apiClient);
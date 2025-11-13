// JWT utility functions
interface JWTPayload {
  exp: number;
  iat: number;
  userId: string;
  email: string;
  role: string;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;

  private constructor() {
    this.baseURL = '';
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || !refreshToken) {
      return false;
    }

    // Only refresh if token is actually expired or about to expire (within 5 minutes)
    if (!isTokenExpired(accessToken)) {
      const decoded = decodeJWT(accessToken);
      if (decoded) {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - currentTime;
        // If token expires in more than 5 minutes, don't refresh yet
        if (timeUntilExpiry > 300) {
          return false;
        }
      }
    }

    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return true;
      } else {
        // JWT verification unsuccessful - remove stored tokens and redirect
        this.handleAuthFailure();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // JWT verification unsuccessful - remove stored tokens and redirect
      this.handleAuthFailure();
      return false;
    }

    return false;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Proactively refresh token if needed before making the request
    await this.refreshTokenIfNeeded();

    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If still unauthorized after proactive refresh, try one more refresh (in case of race condition)
    if (response.status === 401) {
      const refreshed = await this.refreshTokenIfNeeded();
      if (refreshed) {
        // Retry with new token
        const newHeaders = {
          ...this.getAuthHeaders(),
          ...options.headers,
        };
        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
      } else {
        // Refresh failed - authentication is invalid, redirect to login
        this.handleAuthFailure();
        throw new Error('Authentication failed - redirecting to login');
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private handleAuthFailure(): void {
    console.log('Authentication failed - clearing tokens and redirecting to login');
    this.logout();
    // Use window.location for full page redirect to ensure clean state
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const apiService = ApiService.getInstance();

// API Configuration
export const API_CONFIG = {
  // Use localhost for development - in production this would be your server URL
  BASE_URL: __DEV__ ? 'http://localhost:3001/api' : 'https://your-production-api.com/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    LISTINGS: '/listings',
    BOOKINGS: '/bookings',
    FAVORITES: '/favorites',
    USERS: '/users',
  },
};

// API Headers
export const getAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

// API Helper Functions
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(token),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};
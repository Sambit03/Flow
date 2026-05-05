/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * User context passed through the system
 */
export interface UserContext {
  userId: string;
  email?: string;
  permissions?: string[];
}

/**
 * Environment variables type definitions
 */
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  API_PORT: number;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

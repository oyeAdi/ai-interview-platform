// API Configuration
// Automatically uses Render backend URL in production, localhost:8000 in local development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Constructs a full API URL from a relative path
 * @param path - API endpoint path (e.g., 'api/accounts' or '/api/accounts')
 * @returns Full URL (e.g., 'http://localhost:8000/api/accounts' locally, or Render URL in production)
 */
export const apiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Constructs a WebSocket URL
 * @param path - WebSocket path (e.g., 'ws?view=admin')
 * @returns WebSocket URL (e.g., 'ws://localhost:8000/ws?view=admin' locally, or 'wss://...' in production)
 */
export const wsUrl = (path: string) => {
  // Convert http:// to ws:// and https:// to wss://
  const baseUrl = API_BASE_URL.replace(/^http/, 'ws');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Detects the current tenant from the hostname
 * @returns Tenant slug or null if on a base domain
 */
export const getTenantSlug = () => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;

  // Ignore base domains and reserved subdomains
  const baseDomains = ['swarmhire.ai', 'localhost', 'lvh.me', 'vercel.app'];
  const parts = hostname.split('.');

  if (parts.length > 1) {
    const firstPart = parts[0].toLowerCase();
    const reserved = ['www', 'app', 'api', 'admin'];

    // Simple check: if the hostname ends with a base domain and has a prefix that isn't reserved
    const isBase = baseDomains.some(domain => hostname.endsWith(domain));
    if (isBase && !reserved.includes(firstPart)) {
      return firstPart;
    }
  }
  return null;
};

/**
 * Gets the standard headers for tenant-aware API calls
 * @returns Headers object with X-Tenant-Slug if applicable
 */
export const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const tenant = getTenantSlug();
  if (tenant) {
    headers['X-Tenant-Slug'] = tenant;
  }

  return headers;
};

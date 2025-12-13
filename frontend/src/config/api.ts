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


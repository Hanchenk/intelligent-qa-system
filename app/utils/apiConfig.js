/**
 * API configuration utilities
 */

// Base URL for the API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Ensures that API endpoints are correctly formatted with /api prefix
 * @param {string} endpoint - The API endpoint path (with or without leading slash)
 * @returns {string} - The complete API URL with proper formatting
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Make sure the endpoint starts with /api/
  if (cleanEndpoint.startsWith('api/')) {
    return `${API_URL}/${cleanEndpoint}`;
  }
  
  return `${API_URL}/api/${cleanEndpoint}`;
};

/**
 * Gets the standard authorization headers for API requests
 * @returns {Object} - The headers object with Authorization if token exists
 */
export const getAuthHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`
  };
};

/**
 * Creates a complete axios request configuration with auth headers
 * @param {Object} params - Query parameters for the request
 * @returns {Object} - The config object with headers and params
 */
export const createApiConfig = (params = {}) => {
  return {
    headers: getAuthHeaders(),
    params
  };
}; 
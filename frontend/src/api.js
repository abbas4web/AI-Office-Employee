/**
 * Central API configuration.
 * All fetch calls in the app should import API_URL from here
 * instead of hardcoding the URL.
 *
 * In development: set VITE_API_URL in frontend/.env
 * In production:  set VITE_API_URL in your hosting environment
 */
export const API_URL = import.meta.env.VITE_API_URL || 'https://ai-office-employee-api.vercel.app';

/**
 * Helper: get the Authorization header using the stored JWT token.
 * Returns an empty object if not logged in.
 */
export const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

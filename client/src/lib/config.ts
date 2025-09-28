// Centralized API origin helper — use VITE_API_BASE if provided by the client build env
export const API_ORIGIN = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : 'http://localhost:3005';

export function apiPath(path: string) {
  if (!path) return API_ORIGIN;
  return `${API_ORIGIN}${path.startsWith('/') ? path : '/' + path}`;
}

export default apiPath;

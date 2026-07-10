/**
 * Centralized Axios HTTP client.
 * All API calls go through this instance — no hardcoded URLs in components.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach token ───────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: unwrap `data` from Axios wrapper ──────────────────
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const detail = error.response?.data?.detail;
    let message = '';
    
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = `Validation Error: ${detail
        .map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`)
        .join(', ')}`;
    } else if (error.response?.data?.error?.message) {
      message = error.response.data.error.message;
    } else {
      message = error.message || 'Something went wrong. Please try again.';
    }

    return Promise.reject(new Error(message));
  }
);

export default client;

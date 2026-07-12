/**
 * Centralized Axios HTTP client.
 * All API calls go through this instance — no hardcoded URLs in components.
 */
import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    let url = import.meta.env.VITE_API_URL;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url === 'health-screener-api') {
        const hostname = window.location.hostname;
        if (hostname.includes('.onrender.com')) {
          const apiHostname = hostname.replace('-frontend', '-api');
          return `https://${apiHostname}`;
        }
      }
      return `http://${url}`;
    }
    return url;
  }

  const hostname = window.location.hostname;

  if (hostname.includes('.onrender.com')) {
    const apiHostname = hostname.replace('-frontend', '-api');
    return `https://${apiHostname}`;
  }

  return `http://${hostname}:8000`;
};

const API_BASE_URL = getApiUrl();

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

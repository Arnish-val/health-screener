/**
 * Centralized Axios HTTP client.
 * All API calls go through this instance — no hardcoded URLs in components.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    // FastAPI returns { detail: "..." } for HTTP errors
    // Our APIResponse wrapper uses { error: { message: "..." } } for app errors
    const detail = error.response?.data?.detail;
    const message =
      (typeof detail === 'string' ? detail : null) ||
      error.response?.data?.error?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    return Promise.reject(new Error(message));
  }
);

export default client;

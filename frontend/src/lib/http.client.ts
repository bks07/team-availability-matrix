import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './api.config';
import { currentToken } from './storage';

const baseURL = import.meta.env.DEV ? '/api' : API_BASE_URL;

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = currentToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error?.trim();
    if (message) {
      return Promise.reject(new Error(message));
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return Promise.reject(new Error(error.message));
    }

    return Promise.reject(new Error('Unexpected request error'));
  }
);

export const httpClient = {
  get: async <T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> => {
    const response = await client.get<T>(url, { params });
    return response.data;
  },
  post: async <T, TBody = unknown>(url: string, body?: TBody): Promise<T> => {
    const response = await client.post<T>(url, body);
    return response.data;
  },
  postForm: async <T>(url: string, body: FormData): Promise<T> => {
    const response = await client.post<T>(url, body);
    return response.data;
  },
  put: async <T, TBody = unknown>(url: string, body?: TBody): Promise<T> => {
    const response = await client.put<T>(url, body);
    return response.data;
  },
  delete: async <T>(url: string): Promise<T> => {
    const response = await client.delete<T>(url);
    return response.data;
  }
};

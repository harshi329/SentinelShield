import axios from "axios";
import type {
  CreateScanPayload,
  Scan,
  ScanSummary,
} from "../types/scan";

// In development, Vite proxies /api → http://localhost:5000/api
// In production, set VITE_API_URL to your deployed backend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Response interceptor — normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

export const createScan = async (payload: CreateScanPayload): Promise<Scan> => {
  const response = await api.post<ApiResponse<Scan>>("/scans", payload);
  return response.data.data;
};

export const getScans = async (): Promise<Scan[]> => {
  const response = await api.get<ApiResponse<Scan[]>>("/scans");
  return response.data.data;
};

export const getScanSummary = async (): Promise<ScanSummary> => {
  const response = await api.get<ApiResponse<ScanSummary>>("/scans/summary");
  return response.data.data;
};

export const deleteScan = async (id: string): Promise<void> => {
  await api.delete(`/scans/${id}`);
};

export default api;

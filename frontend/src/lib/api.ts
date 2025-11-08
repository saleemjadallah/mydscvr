import axios, { AxiosInstance } from 'axios';
import type { User, HeadshotBatch, ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  // Register with email/password
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<{ message: string; userId: string; email: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Verify registration with OTP code
  verifyRegistration: async (email: string, code: string): Promise<User> => {
    const response = await api.post('/auth/verify-registration', { email, code });
    return response.data;
  },

  // Login with email/password
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Request OTP for passwordless login
  requestOtp: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/request-otp', { email });
    return response.data;
  },

  // Login with OTP code
  loginWithOtp: async (email: string, code: string): Promise<User> => {
    const response = await api.post('/auth/login-otp', { email, code });
    return response.data;
  },

  // Login/register with Google (Firebase ID token)
  googleAuth: async (idToken: string): Promise<User> => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Batch API
export const batchApi = {
  // Upload photos to R2
  uploadPhotos: async (files: File[], onProgress?: (progress: number) => void): Promise<ApiResponse<string[]>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await api.post('/batches/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });
    return response.data;
  },

  // Create new batch (after payment)
  createBatch: async (data: {
    uploadedPhotos: string[];
    plan: string;
    styleTemplates: string[];
    backgrounds?: string[];
    outfits?: string[];
    stripeSessionId: string;
  }): Promise<ApiResponse<HeadshotBatch>> => {
    const response = await api.post('/batches/create', data);
    return response.data;
  },

  // Get user's batches
  getBatches: async (): Promise<ApiResponse<HeadshotBatch[]>> => {
    const response = await api.get('/batches');
    return response.data;
  },

  // Get specific batch
  getBatch: async (id: number): Promise<ApiResponse<HeadshotBatch>> => {
    const response = await api.get(`/batches/${id}`);
    return response.data;
  },

  // Delete batch
  deleteBatch: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/batches/${id}`);
    return response.data;
  },

  // Get batch status
  getBatchStatus: async (id: number): Promise<ApiResponse<{ status: string; progress?: number }>> => {
    const response = await api.get(`/batches/${id}/status`);
    return response.data;
  },

  // Request edit on specific headshot
  requestEdit: async (
    batchId: number,
    headshotId: string,
    editType: string
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`/batches/${batchId}/edit`, {
      headshotId,
      editType,
    });
    return response.data;
  },

  // Get edit history
  getEdits: async (batchId: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/batches/${batchId}/edits`);
    return response.data;
  },

  // Download single headshot
  downloadHeadshot: async (batchId: number, headshotId: string): Promise<Blob> => {
    const response = await api.get(`/batches/${batchId}/download/${headshotId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download all as ZIP
  downloadAll: async (batchId: number): Promise<Blob> => {
    const response = await api.get(`/batches/${batchId}/download-all`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Checkout API
export const checkoutApi = {
  // Create Stripe checkout session
  createSession: async (data: {
    plan: string;
    uploadedPhotos: string[];
    styleTemplates: string[];
    preferences?: any;
  }): Promise<ApiResponse<{ sessionId: string; url: string }>> => {
    const response = await api.post('/checkout/create-session', data);
    return response.data;
  },

  // Verify payment success
  verifySession: async (sessionId: string): Promise<ApiResponse<{ paid: boolean; batchId?: number }>> => {
    const response = await api.get(`/checkout/verify/${sessionId}`);
    return response.data;
  },
};

// Export main axios instance
export { api };
export default api;

import { getAuthHeaders } from '../utils/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const AUTH_SECRET = import.meta.env.VITE_AUTH_SECRET || 'dev-only-change-me';

/**
 * Make authenticated API request
 * @param {string} userId - Current user ID
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Object>} API response
 */
export async function apiCall(userId, path, options = {}) {
  const headers = await getAuthHeaders(userId, AUTH_SECRET);
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Make authenticated multipart API request (for file uploads)
 * @param {string} userId - Current user ID
 * @param {string} path - API endpoint path
 * @param {FormData} formData - Form data with files
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
export async function apiCallMultipart(userId, path, formData, options = {}) {
  const headers = await getAuthHeaders(userId, AUTH_SECRET);
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    ...options,
    headers: {
      ...headers,
      ...options.headers,
      // Don't set Content-Type for multipart; browser will set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Project endpoints
export const projects = {
  getAll: (userId) => apiCall(userId, '/api/projects'),
  get: (userId, projectId) => apiCall(userId, `/api/projects/${projectId}`),
  create: (userId, name) =>
    apiCall(userId, '/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  addMember: (userId, projectId, memberId, role) =>
    apiCall(userId, `/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId: memberId, role }),
    }),
};

// Scene endpoints
export const scenes = {
  create: (userId, projectId, title, outline) =>
    apiCall(userId, `/api/projects/${projectId}/scenes`, {
      method: 'POST',
      body: JSON.stringify({ title, outline }),
    }),
};

// Task endpoints
export const tasks = {
  create: (userId, projectId, payload) =>
    apiCall(userId, `/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// File endpoints
export const files = {
  list: (userId, projectId) =>
    apiCall(userId, `/api/projects/${projectId}/files`),
  
  upload: (userId, projectId, filesArray, versionStage) => {
    const formData = new FormData();
    filesArray.forEach(file => formData.append('files', file));
    formData.append('versionStage', versionStage);
    return apiCallMultipart(userId, `/api/projects/${projectId}/files/upload`, formData);
  },
  
  download: (userId, projectId, fileId) =>
    `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/download?x-user-id=${userId}&x-user-signature=${userId}`,
  
  preview: (userId, projectId, fileId) =>
    `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/preview?x-user-id=${userId}&x-user-signature=${userId}`,
};

// Rubric endpoints (Phase 3)
export const rubrics = {
  list: (userId, projectId) =>
    apiCall(userId, `/api/projects/${projectId}/rubrics`),
  
  get: (userId, projectId, rubricId) =>
    apiCall(userId, `/api/projects/${projectId}/rubrics/${rubricId}`),
  
  create: (userId, projectId, payload) =>
    apiCall(userId, `/api/projects/${projectId}/rubrics`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Review endpoints (Phase 3)
export const reviews = {
  getAssigned: (userId, projectId) =>
    apiCall(userId, `/api/projects/${projectId}/reviews/assigned`),
  
  getForTarget: (userId, projectId, targetId) =>
    apiCall(userId, `/api/projects/${projectId}/reviews/${targetId}`),
  
  submit: (userId, projectId, payload) =>
    apiCall(userId, `/api/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  
  approve: (userId, projectId, reviewId) =>
    apiCall(userId, `/api/projects/${projectId}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved: true }),
    }),
};
